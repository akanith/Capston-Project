"""
WildShield-FL: Model Inference Engine
Handles loading trained models and running predictions.
"""

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import io
import json
import base64
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import cv2
import sys
import time
import random
import uuid
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_training.model import create_resnet18_model


# ============================
# CONSTANTS & CONFIG
# ============================
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# Simulated Wildlife Zone (Murchison Falls National Park, Uganda)
LAT_RANGE = (1.6, 2.3)
LNG_RANGE = (31.2, 32.1)

WILDLIFE_CLASSES = ["bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe"]

inference_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
])


class ResNetPredictor:
    """Wildlife image classifier using the federated-trained ResNet18 model."""
    
    def __init__(self, model_path: str, device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = torch.device(device)
        
        # Load checkpoint
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
        self.num_classes = checkpoint['num_classes']
        self.class_names = checkpoint['class_names']
        
        # Build model
        self.model = create_resnet18_model(num_classes=self.num_classes, pretrained=False)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.to(self.device)
        self.model.eval()
        
        self.softmax = nn.Softmax(dim=1)
        
        print(f"ResNet predictor loaded: {self.num_classes} classes on {self.device}")
    
    def predict(self, image: Image.Image, top_k: int = 3) -> dict:
        """
        Predict wildlife class from a PIL Image.
        
        Returns:
            Dict with predicted_class, confidence, top_k_predictions.
        """
        # Preprocess
        tensor = inference_transform(image).unsqueeze(0).to(self.device)
        
        # Inference
        with torch.no_grad():
            outputs = self.model(tensor)
            probabilities = self.softmax(outputs)
        
        # Get top-k
        probs = probabilities.squeeze().cpu().numpy()
        top_indices = np.argsort(probs)[::-1][:top_k]
        
        predictions = []
        for idx in top_indices:
            predictions.append({
                "class": self.class_names[idx],
                "confidence": round(float(probs[idx]) * 100, 2)
            })
        
        return {
            "predicted_class": predictions[0]["class"],
            "confidence": predictions[0]["confidence"],
            "top_predictions": predictions,
            "all_probabilities": {
                self.class_names[i]: round(float(probs[i]) * 100, 2)
                for i in range(len(self.class_names))
            }
        }
    
    def predict_from_bytes(self, image_bytes: bytes, top_k: int = 3) -> dict:
        """Predict from raw image bytes."""
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return self.predict(image, top_k)


def _safe_boxes(result):
    """Safely get boxes from a YOLO result. Returns empty list if None."""
    boxes = getattr(result, 'boxes', None)
    if boxes is None:
        return []
    return boxes


class YOLODetector:
    """Enhanced YOLOv8 detector with Poaching Detection and Geo-tagging."""
    
    def __init__(self, model_name: str = "yolov8n.pt"):
        try:
            from ultralytics import YOLO
            
            # Always use the standard YOLO detection model
            # Detection models can say "no objects found" — classification models cannot
            print(f"Loading YOLO detection model: {model_name}")
            self.model = YOLO(model_name)
            self.model_name = model_name
            
            # Paths
            self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.al_queue_dir = os.path.join(self.project_root, "backend", "active_learning_queue")
            os.makedirs(self.al_queue_dir, exist_ok=True)
                
            print(f"YOLO detector initialized ({model_name}).")
        except ImportError:
            raise ImportError("ultralytics package required. Install: pip install ultralytics")
    
    def _parse_result(self, result):
        """
        Parse YOLO detection results.
        Returns (detections_list, animal_count_dict, poaching_alert_bool).
        """
        detections = []
        animal_count = {}
        person_detected = False
        wildlife_detected = False
        
        # Get detection boxes safely
        boxes = _safe_boxes(result)
        for box in boxes:
            try:
                cls_id = int(box.cls[0])
                cls_name = result.names[cls_id]
                conf = float(box.conf[0])
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                if cls_name == "person":
                    person_detected = True
                if cls_name in WILDLIFE_CLASSES:
                    wildlife_detected = True
                
                detections.append({
                    "class": cls_name,
                    "confidence": round(conf, 4),
                    "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)]
                })
                animal_count[cls_name] = animal_count.get(cls_name, 0) + 1
            except Exception:
                continue
        
        poaching_alert = person_detected and wildlife_detected
        return detections, animal_count, poaching_alert
    
    def detect_image(self, image: Image.Image, conf_threshold: float = 0.25) -> dict:
        """
        Detect objects in a PIL Image with edge metrics, geo-tagging, and poaching logic.
        """
        start_time = time.time()
        
        # Run YOLO detection
        results = self.model(image, conf=conf_threshold, verbose=False)
        result = results[0]
        
        inference_time = (time.time() - start_time) * 1000  # ms
        
        # Parse detections
        detections, animal_count, poaching_alert = self._parse_result(result)
        
        # Geo-tagging
        lat = random.uniform(*LAT_RANGE)
        lng = random.uniform(*LNG_RANGE)
        
        # Active Learning check
        uncertain_detection = False
        if detections:
            min_conf = min([d["confidence"] for d in detections])
            if min_conf < 0.6:
                uncertain_detection = True
                self._save_to_active_learning(image, detections)
        
        # Generate annotated image
        annotated = result.plot()
        # Handle both BGR (detection) and RGB (classification) outputs
        if len(annotated.shape) == 3 and annotated.shape[2] == 3:
            try:
                annotated_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
            except Exception:
                annotated_rgb = annotated
        else:
            annotated_rgb = annotated
        
        pil_annotated = Image.fromarray(annotated_rgb)
        
        # Convert to base64
        buffer = io.BytesIO()
        pil_annotated.save(buffer, format="JPEG", quality=85)
        annotated_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        
        return {
            "detections": detections,
            "total_objects": len(detections),
            "object_counts": animal_count,
            "poaching_alert": poaching_alert,
            "geo_tag": {"lat": lat, "lng": lng},
            "metrics": {
                "inference_time_ms": round(inference_time, 2),
                "fps": round(1000 / inference_time, 2) if inference_time > 0 else 0,
                "model_size_mb": round(os.path.getsize(self.model_name) / (1024 * 1024), 2) if os.path.exists(self.model_name) else 0
            },
            "active_learning_queued": uncertain_detection,
            "annotated_image": annotated_b64
        }
    
    def _save_to_active_learning(self, image, detections):
        """Save uncertain image and metadata for human review."""
        sample_id = uuid.uuid4().hex[:8]
        img_path = os.path.join(self.al_queue_dir, f"{sample_id}.jpg")
        meta_path = os.path.join(self.al_queue_dir, f"{sample_id}.json")
        
        image.save(img_path)
        with open(meta_path, 'w') as f:
            json.dump({
                "id": sample_id,
                "timestamp": datetime.now().isoformat(),
                "detections": detections,
                "status": "pending_review"
            }, f, indent=2)
    
    def detect_image_from_bytes(self, image_bytes: bytes, conf_threshold: float = 0.25) -> dict:
        """Detect objects from raw image bytes."""
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return self.detect_image(image, conf_threshold)
    
    def detect_video(self, video_path: str, output_path: str, conf_threshold: float = 0.25) -> dict:
        """
        Process video for object detection with species tracking and counting.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        # Tracking simulation (unique animals per video)
        unique_animals = {} # class -> count
        frame_count = 0
        total_inf_time = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            start_inf = time.time()
            results = self.model(frame, conf=conf_threshold, verbose=False)
            total_inf_time += (time.time() - start_inf)
            
            result = results[0]
            _, animal_count, _ = self._parse_result(result)
            
            # Simple aggregation to simulate counting
            for cls, count in animal_count.items():
                if cls in WILDLIFE_CLASSES:
                    unique_animals[cls] = max(unique_animals.get(cls, 0), count)

            writer.write(result.plot())
            frame_count += 1
        
        cap.release()
        writer.release()
        
        return {
            "total_frames": frame_count,
            "fps": round(fps, 2),
            "intelligence": {
                "animal_counts": unique_animals,
                "movement": random.choice(["North-West", "East", "Stationary", "South-East"])
            },
            "avg_inference_ms": round((total_inf_time / frame_count) * 1000, 2) if frame_count > 0 else 0
        }
    
    def detect_frame(self, frame_b64: str, conf_threshold: float = 0.25) -> dict:
        """Detect objects in a base64-encoded frame (for webcam)."""
        image_bytes = base64.b64decode(frame_b64)
        return self.detect_image_from_bytes(image_bytes, conf_threshold)


# Singleton instances (loaded on first import)
_resnet_predictor = None
_yolo_detector = None


def get_resnet_predictor(model_path: str = None) -> ResNetPredictor:
    """Get or create ResNet predictor singleton."""
    global _resnet_predictor
    if _resnet_predictor is None:
        if model_path is None:
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(project_root, "models", "global_model_resnet18.pth")
        _resnet_predictor = ResNetPredictor(model_path)
    return _resnet_predictor


def get_yolo_detector() -> YOLODetector:
    """Get or create YOLO detector singleton."""
    global _yolo_detector
    if _yolo_detector is None:
        _yolo_detector = YOLODetector()
    return _yolo_detector
