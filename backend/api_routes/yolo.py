"""
WildShield-FL: YOLO Detection API Routes
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import io
import os
import sys
import uuid
import base64
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.inference import get_yolo_detector

from backend.api_routes.active_learning import add_to_active_learning
from backend.api_routes.alerts import trigger_alert

router = APIRouter(tags=["YOLO Detection"])


@router.post("/detect-yolo-image")
async def detect_yolo_image(file: UploadFile = File(...)):
    """
    Detect animals in an image using YOLOv8.
    Returns detections with bounding boxes and annotated image.
    Integrated with Active Learning, Alerts, and Map updates for the Intelligence Layer.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        contents = await file.read()
        detector = get_yolo_detector()
        result = detector.detect_image_from_bytes(contents, conf_threshold=0.25)
        
        # 1. ACTIVE LEARNING INTEGRATION (100% capture for review)
        for det in result.get("detections", []):
            add_to_active_learning(contents, det["class"], det["confidence"])
        
        # 2. UNIFIED ALERT & MAP LOGIC
        from backend.main import locations
        import random
        from datetime import datetime
        
        detected_classes = [d["class"] for d in result.get("detections", [])]
        
        # A. Poaching Alert (Person + Big 3: elephant, tiger, bear)
        human_present = "person" in detected_classes
        big_3_present = any(cls in ["elephant", "tiger", "bear"] for cls in detected_classes)
        
        if human_present and big_3_present:
            trigger_alert("poaching", "⚠️ Potential Poaching Detected: Humans & Wildlife in same frame!")
            
        # B. Map Updates & Detailed Alerts
        for det in result.get("detections", []):
            label = det["class"]
            if label == "person": continue
            
            # Update Map (Simulated GPS centered in Uganda)
            locations.append({
                "id": uuid.uuid4().hex[:6],
                "lat": 1.97 + random.uniform(-0.5, 0.5),
                "lng": 31.59 + random.uniform(-0.5, 0.5),
                "species": label.capitalize(),
                "time": datetime.now().strftime("%H:%M:%S")
            })
            if len(locations) > 50: locations.pop(0)

            # Check for rare species
            if label in ["panda", "tiger"]:
                trigger_alert("rare", f"🚨 Rare species detected: {label.upper()}")
            else:
                trigger_alert("detection", f"🐾 {label.capitalize()} detected in monitoring zone")
        
        # Intelligence Layer stats
        animal_counts = result.get("object_counts", {})
        total_detections = sum(count for cls, count in animal_counts.items() if cls != "person")

        return {
            "success": True,
            "filename": file.filename,
            "detections": result.get("detections", []),
            "total_objects": result.get("total_objects", 0),
            "total_detections": total_detections,
            "object_counts": animal_counts,
            "annotated_image": result.get("annotated_image"),
            "inference_ms": result.get("metrics", {}).get("inference_time_ms", 0),
            "poaching_alert": (human_present and big_3_present)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@router.post("/detect-video")
async def detect_video(file: UploadFile = File(...)):
    """
    Detect animals in a video using YOLOv8.
    Returns detection statistics and processed video.
    """
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    try:
        contents = await file.read()
        
        # Save input video to temp file
        temp_dir = tempfile.mkdtemp()
        input_path = os.path.join(temp_dir, f"input_{uuid.uuid4().hex[:8]}.mp4")
        output_path = os.path.join(temp_dir, f"output_{uuid.uuid4().hex[:8]}.mp4")
        
        with open(input_path, 'wb') as f:
            f.write(contents)
        
        detector = get_yolo_detector()
        result = detector.detect_video(input_path, output_path, conf_threshold=0.25)
        
        # Read output video as base64
        output_b64 = None
        if os.path.exists(output_path):
            with open(output_path, 'rb') as f:
                output_b64 = base64.b64encode(f.read()).decode("utf-8")
        
        # Cleanup temp files
        try:
            os.remove(input_path)
            if os.path.exists(output_path):
                os.remove(output_path)
            os.rmdir(temp_dir)
        except:
            pass
        
        # Map intelligence keys from inference engine to frontend schema
        animal_counts = result.get("intelligence", {}).get("animal_counts", {})
        total_detections = sum(animal_counts.values())
        movement = result.get("intelligence", {}).get("movement", "Unspecified")

        return {
            "success": True,
            "filename": file.filename,
            "total_frames": result.get("total_frames", 0),
            "fps": result.get("fps", 0),
            "total_detections": total_detections,
            "detection_summary": animal_counts,
            "intelligence_summary": f"Detected {list(animal_counts.keys())} moving {movement}",
            "processed_video": output_b64,
            "avg_inference_ms": result.get("avg_inference_ms", 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video detection failed: {str(e)}")


class WebcamFrame(BaseModel):
    frame: str  # base64-encoded image
    conf_threshold: float = 0.25


@router.post("/webcam-detection")
async def webcam_detection(data: WebcamFrame):
    """
    Detect animals in a webcam frame (base64 encoded).
    Returns detections and annotated frame.
    """
    try:
        detector = get_yolo_detector()
        # detect_frame calls detect_image_from_bytes which returns the full result dict
        result = detector.detect_frame(data.frame, conf_threshold=data.conf_threshold)
        
        return {
            "success": True,
            "detections": result["detections"],
            "total_objects": result["total_objects"],
            "object_counts": result["object_counts"],
            "annotated_image": result["annotated_image"],
            "metrics": result["metrics"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webcam detection failed: {str(e)}")
