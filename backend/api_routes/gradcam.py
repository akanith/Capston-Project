"""
WildShield-FL: Grad-CAM Explainability API
Generates heatmap overlays showing which image regions drove the prediction.
"""

import os
import io
import sys
import base64
import numpy as np
import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import cv2

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi import APIRouter, UploadFile, File, HTTPException
from ml_training.model import create_resnet18_model

router = APIRouter(tags=["Explainability"])

# Image transforms (same as inference)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

gradcam_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
])


def generate_gradcam(model, image_tensor, target_layer, class_idx=None):
    """
    Generate Grad-CAM heatmap for a given image and model.
    
    Args:
        model: ResNet18 model
        image_tensor: preprocessed image tensor (1, 3, 224, 224)
        target_layer: the conv layer to hook (e.g., model.layer4[-1])
        class_idx: target class index (None = use predicted class)
    
    Returns:
        heatmap: numpy array (224, 224) normalized 0-1
        predicted_idx: int
        confidence: float
    """
    activations = []
    gradients = []

    def forward_hook(module, input, output):
        activations.append(output.detach())

    def backward_hook(module, grad_input, grad_output):
        gradients.append(grad_output[0].detach())

    # Register hooks
    fwd_handle = target_layer.register_forward_hook(forward_hook)
    bwd_handle = target_layer.register_full_backward_hook(backward_hook)

    # Forward pass
    model.eval()
    output = model(image_tensor)
    probs = F.softmax(output, dim=1)

    # Get predicted class
    if class_idx is None:
        class_idx = output.argmax(dim=1).item()

    confidence = probs[0, class_idx].item()

    # Backward pass for the target class
    model.zero_grad()
    output[0, class_idx].backward()

    # Compute Grad-CAM
    act = activations[0]  # (1, C, H, W)
    grad = gradients[0]   # (1, C, H, W)

    # Global average pooling of gradients
    weights = grad.mean(dim=(2, 3), keepdim=True)  # (1, C, 1, 1)

    # Weighted combination of activation maps
    cam = (weights * act).sum(dim=1, keepdim=True)  # (1, 1, H, W)
    cam = F.relu(cam)  # Only positive contributions
    cam = cam.squeeze().cpu().numpy()

    # Normalize to 0-1
    if cam.max() > 0:
        cam = (cam - cam.min()) / (cam.max() - cam.min())
    
    # Resize to 224x224
    cam = cv2.resize(cam, (224, 224))

    # Cleanup hooks
    fwd_handle.remove()
    bwd_handle.remove()

    return cam, class_idx, confidence


def overlay_heatmap(original_image, heatmap, alpha=0.6):
    """
    Overlay Grad-CAM heatmap on the original image with high contrast.
    """
    # Resize original to normalized 224x224 for stable overlay
    img = original_image.resize((224, 224))
    img_array = np.array(img).astype(np.float32)

    # Normalize heatmap strictly
    heatmap = np.maximum(heatmap, 0)
    if heatmap.max() > 0:
        heatmap = heatmap / heatmap.max()

    # Create colored heatmap (Jet colormap)
    heatmap_uint8 = np.uint8(255 * heatmap)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB).astype(np.float32)

    # Blend: Higher alpha for the heatmap to ensure visibility
    overlay = (alpha * heatmap_colored) + ((1 - alpha) * img_array)
    overlay = np.clip(overlay, 0, 255).astype(np.uint8)
    
    return Image.fromarray(overlay)


def pil_to_base64(image, fmt="JPEG", quality=90):
    buffer = io.BytesIO()
    image.save(buffer, format=fmt, quality=quality)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


# Singleton model holder
_gradcam_model = None
_gradcam_class_names = None


def _load_model():
    global _gradcam_model, _gradcam_class_names
    if _gradcam_model is not None:
        return _gradcam_model, _gradcam_class_names

    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_path = os.path.join(project_root, "models", "global_model_resnet18.pth")

    if not os.path.exists(model_path):
        raise FileNotFoundError("Trained model not found. Run federated training first.")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(model_path, map_location=device, weights_only=False)

    model = create_resnet18_model(num_classes=checkpoint['num_classes'], pretrained=False)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()

    _gradcam_model = model
    _gradcam_class_names = checkpoint['class_names']
    return model, _gradcam_class_names


@router.post("/gradcam")
async def gradcam_explain(file: UploadFile = File(...)):
    """Generate Grad-CAM explanation for an uploaded image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        model, class_names = _load_model()
        device = next(model.parameters()).device

        # Load and preprocess image
        contents = await file.read()
        original = Image.open(io.BytesIO(contents)).convert("RGB")
        tensor = gradcam_transform(original).unsqueeze(0).to(device)

        # Run Grad-CAM on layer4 (last residual block)
        target_layer = model.layer4[-1]
        heatmap, pred_idx, confidence = generate_gradcam(model, tensor, target_layer)

        # Create overlay image
        overlay_img = overlay_heatmap(original, heatmap)

        # Get top-5 predictions
        with torch.no_grad():
            output = model(tensor)
            probs = F.softmax(output, dim=1).squeeze().cpu().numpy()

        top_indices = np.argsort(probs)[::-1][:5]
        top_predictions = [
            {"class": class_names[i], "confidence": round(float(probs[i]) * 100, 2)}
            for i in top_indices
        ]

        # Find highlighted region description
        # Identify the quadrant with highest activation
        h, w = heatmap.shape
        quadrants = {
            "top-left": heatmap[:h//2, :w//2].mean(),
            "top-right": heatmap[:h//2, w//2:].mean(),
            "bottom-left": heatmap[h//2:, :w//2].mean(),
            "bottom-right": heatmap[h//2:, w//2:].mean(),
            "center": heatmap[h//4:3*h//4, w//4:3*w//4].mean(),
        }
        focus_region = max(quadrants, key=quadrants.get)

        return {
            "success": True,
            "prediction": {
                "class": class_names[pred_idx],
                "confidence": round(confidence * 100, 2),
            },
            "top_predictions": top_predictions,
            "focus_region": focus_region,
            "original_image": pil_to_base64(original.resize((224, 224))),
            "heatmap_overlay": pil_to_base64(overlay_img),
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grad-CAM failed: {str(e)}")
