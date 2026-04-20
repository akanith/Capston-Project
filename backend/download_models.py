import os
import requests

# =============================================================================
# PASTE YOUR PUBLIC MODEL LINK HERE
# =============================================================================
RESNET_MODEL_URL = "https://YOUR_LINK_HERE"  # e.g., "https://drive.google.com/uc?id=YOUR_ID"
# =============================================================================

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(os.path.dirname(PROJECT_ROOT), "models")

def download_file(url, destination):
    """Downloads a file from a URL to a destination path."""
    if url == "https://YOUR_LINK_HERE":
        print("⚠️ No model URL provided. Skipping download...")
        return False
        
    print(f"📥 Downloading model to {destination}...")
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(destination, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print("✅ Download complete!")
        return True
    except Exception as e:
        print(f"❌ Failed to download: {e}")
        return False

def main():
    # Ensure models directory exists
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)
        print(f"📁 Created directory: {MODELS_DIR}")

    # 1. Download custom ResNet model
    resnet_path = os.path.join(MODELS_DIR, "global_model_resnet18.pth")
    if not os.path.exists(resnet_path):
        download_file(RESNET_MODEL_URL, resnet_path)
    else:
        print("ℹ️ ResNet model already exists. Skipping.")

    # 2. YOLO model is usually downloaded automatically by the 'ultralytics' library 
    # based on the model name in inference.py, so we don't need to force it here.

if __name__ == "__main__":
    main()
