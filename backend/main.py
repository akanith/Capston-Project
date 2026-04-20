"""
WildShield-FL: FastAPI Backend Server
Main entry point for the backend API.
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.api_routes import predict, yolo, metrics, gradcam, analytics, edge_metrics, active_learning, alerts

# Project paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
EVAL_DIR = os.path.join(MODELS_DIR, "evaluation")
ARCHIVE_DIR = os.path.join(PROJECT_ROOT, "archive")

# ============================
# FastAPI Application
# ============================
app = FastAPI(
    title="WildShield-FL API",
    description="Privacy-aware wildlife monitoring system with Federated Learning & YOLOv8",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# Mount Static Files
# ============================
if os.path.exists(EVAL_DIR):
    app.mount("/static/evaluation", StaticFiles(directory=EVAL_DIR), name="evaluation")

# Serve dataset images so frontend can display sample thumbnails
if os.path.exists(ARCHIVE_DIR):
    app.mount("/static/archive", StaticFiles(directory=ARCHIVE_DIR), name="archive")

# ============================
# Include Routers
# ============================
app.include_router(predict.router, prefix="/api")
app.include_router(yolo.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(gradcam.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(edge_metrics.router, prefix="/api")
app.include_router(active_learning.router)
app.include_router(alerts.router)

# ============================
# Global Monitoring Storage
# ============================
locations = []

@app.get("/locations")
async def get_locations():
    """Return live detections as map markers."""
    return locations

@app.get("/active-learning")
async def get_active_learning_root():
    """Proxy to active learning queue for the Intelligence Layer."""
    from backend.api_routes.active_learning import active_learning_queue
    return active_learning_queue

@app.get("/edge-metrics")
async def get_edge_metrics():
    """Return randomized edge metrics for monitoring."""
    import random
    return {
        "inference_time_ms": round(random.uniform(40, 80), 2),
        "fps": round(random.uniform(10, 25), 2),
        "model_size_mb": 45,
        "cpu_usage": round(random.uniform(30, 70), 2)
    }


# ============================
# Root Endpoint
# ============================
@app.get("/")
async def root():
    return {
        "name": "WildShield-FL API",
        "version": "2.0.0",
        "description": "Federated Learning Wildlife Monitoring System",
        "endpoints": {
            "docs": "/docs",
            "predict_image": "POST /api/predict-image",
            "detect_yolo_image": "POST /api/detect-yolo-image",
            "detect_video": "POST /api/detect-video",
            "webcam_detection": "POST /api/webcam-detection",
            "metrics": "GET /api/metrics"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    model_exists = os.path.exists(os.path.join(MODELS_DIR, "global_model_resnet18.pth"))
    return {
        "status": "healthy",
        "model_loaded": model_exists,
        "evaluation_available": os.path.exists(EVAL_DIR)
    }


# ============================
# Serve Frontend
# ============================
# Check for static frontend files
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "backend", "static", "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve API normally
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("static"):
            return None # This allows FastAPI to continue to other routes
        
        # Check if file exists in static dir
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Otherwise serve index.html (for React Router)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    # Use environment variable for port (needed for Hugging Face)
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
