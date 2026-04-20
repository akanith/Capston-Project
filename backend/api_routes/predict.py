"""
WildShield-FL: Prediction API Routes
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.inference import get_resnet_predictor

router = APIRouter(tags=["Classification"])


@router.post("/predict-image")
async def predict_image(file: UploadFile = File(...)):
    """
    Classify a wildlife image using the federated ResNet18 model.
    
    Returns predicted class, confidence score, and top-3 predictions.
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        contents = await file.read()
        predictor = get_resnet_predictor()
        result = predictor.predict_from_bytes(contents, top_k=5)
        
        # ACTIVE LEARNING INTEGRATION: 100% capture for the Intelligence Layer
        from backend.api_routes.active_learning import add_to_active_learning
        add_to_active_learning(contents, result['predicted_class'], result['confidence'] / 100.0)
        
        return {
            "success": True,
            "filename": file.filename,
            "prediction": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
