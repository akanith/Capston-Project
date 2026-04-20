"""
WildShield-FL: Active Learning simplified backend
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import base64

router = APIRouter(tags=["Active Learning"])

# Global in-memory queue
active_learning_queue = []
CONF_THRESHOLD = 0.6

class ReviewItem(BaseModel):
    index: int
    correct_label: str

@router.get("/active-learning")
async def get_active_learning():
    """Return the current active learning queue."""
    return active_learning_queue

@router.post("/active-learning/review")
async def review_item(data: ReviewItem):
    """Update a prediction with the correct label."""
    if 0 <= data.index < len(active_learning_queue):
        active_learning_queue[data.index]["corrected_label"] = data.correct_label
        active_learning_queue[data.index]["status"] = "reviewed"
        return {"message": f"Updated item at index {data.index}"}
    raise HTTPException(status_code=400, detail="Invalid index")

@router.post("/active-learning/clear")
async def clear_queue():
    """Clear all items from the queue."""
    active_learning_queue.clear()
    return {"message": "Queue cleared"}

def add_to_active_learning(image_bytes: bytes, predicted_label: str, confidence: float):
    """
    Helper to add an image to the AL queue.
    Now used for 100% capture across ResNet and YOLO.
    """
    encoded_img = base64.b64encode(image_bytes).decode("utf-8")
    
    # Cap at 100 items to prevent memory bloat
    if len(active_learning_queue) >= 100:
        active_learning_queue.pop(0)

    active_learning_queue.append({
        "image": encoded_img,
        "predicted_label": predicted_label,
        "confidence": round(float(confidence), 2),
        "status": "pending"
    })
    return True
