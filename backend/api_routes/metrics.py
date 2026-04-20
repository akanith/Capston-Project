"""
WildShield-FL: Metrics API Route
"""

from fastapi import APIRouter, HTTPException
import os
import json
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

router = APIRouter(tags=["Metrics"])

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
EVAL_DIR = os.path.join(MODELS_DIR, "evaluation")


@router.get("/metrics")
async def get_metrics():
    """
    Return model evaluation metrics and training history.
    """
    result = {
        "success": True,
        "training_history": None,
        "evaluation_metrics": None,
        "class_names": None,
        "available_plots": []
    }
    
    # Load training history
    history_path = os.path.join(MODELS_DIR, "training_history.json")
    if os.path.exists(history_path):
        with open(history_path, 'r') as f:
            result["training_history"] = json.load(f)
    
    # Load evaluation metrics
    eval_path = os.path.join(EVAL_DIR, "evaluation_metrics.json")
    if os.path.exists(eval_path):
        with open(eval_path, 'r') as f:
            result["evaluation_metrics"] = json.load(f)
    
    # Load class names
    class_path = os.path.join(MODELS_DIR, "class_names.json")
    if os.path.exists(class_path):
        with open(class_path, 'r') as f:
            result["class_names"] = json.load(f)
    
    # List available plot images
    if os.path.exists(EVAL_DIR):
        plots = [f for f in os.listdir(EVAL_DIR) if f.endswith('.png')]
        result["available_plots"] = plots
    
    if result["training_history"] is None and result["evaluation_metrics"] is None:
        return {
            "success": False,
            "message": "No metrics available. Train and evaluate the model first."
        }
    
    return result


@router.get("/metrics/training-history")
async def get_training_history():
    """Return training history only."""
    history_path = os.path.join(MODELS_DIR, "training_history.json")
    if not os.path.exists(history_path):
        raise HTTPException(status_code=404, detail="Training history not found")
    
    with open(history_path, 'r') as f:
        return json.load(f)


@router.get("/metrics/evaluation")
async def get_evaluation_metrics():
    """Return evaluation metrics only."""
    eval_path = os.path.join(EVAL_DIR, "evaluation_metrics.json")
    if not os.path.exists(eval_path):
        raise HTTPException(status_code=404, detail="Evaluation metrics not found")
    
    with open(eval_path, 'r') as f:
        return json.load(f)
