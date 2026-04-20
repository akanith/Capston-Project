"""
WildShield-FL: YOLOv8 Classification Training
Fine-tunes a pre-trained YOLOv8-cls model on the wildlife dataset.
"""

import os
import sys
import argparse
from ultralytics import YOLO

def train_yolo_classifier(data_dir, model_dir, epochs=10, imgsz=224):
    """
    Fine-tunes YOLOv8-cls on the wildlife dataset.
    
    Args:
        data_dir: Path to the dataset (archive/)
        model_dir: Directory to save the model
        epochs: Training epochs
        imgsz: Image size for training
    """
    print(f"\n{'='*60}")
    print(f"  WildShield-FL: YOLOv8-Cls Fine-Tuning")
    print(f"{'='*60}")
    print(f"  Dataset: {data_dir}")
    print(f"  Epochs: {epochs}")
    print(f"  Image Size: {imgsz}")
    print(f"{'='*60}\n")
    
    # Initialize YOLO weights - using 'n' (nano) for speed
    model = YOLO('yolov8n-cls.pt')
    
    # Train the model
    # Note: Ultralytics expects data directory to have train/ and val/ or test/ subfolders
    # Since our archive has train/ and test/, we'll point to it directly
    results = model.train(
        data=data_dir,
        epochs=epochs,
        imgsz=imgsz,
        project=model_dir,
        name='yolo_wildlife_cls',
        exist_ok=True
    )
    
    print(f"\n{'='*60}")
    print(f"  YOLO Training Complete!")
    print(f"  Model saved in: {os.path.join(model_dir, 'yolo_wildlife_cls', 'weights', 'best.pt')}")
    print(f"{'='*60}\n")

def main():
    parser = argparse.ArgumentParser(description="Fine-tune YOLOv8 on Wildlife Dataset")
    parser.add_argument("--data-dir", type=str, default=None, help="Path to archive/ directory")
    parser.add_argument("--model-dir", type=str, default=None, help="Directory to save models")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=224, help="Image size")
    
    args = parser.parse_args()
    
    # Set default paths
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if args.data_dir is None:
        args.data_dir = os.path.join(project_root, "archive")
    if args.model_dir is None:
        args.model_dir = os.path.join(project_root, "models")
        
    train_yolo_classifier(
        data_dir=args.data_dir,
        model_dir=args.model_dir,
        epochs=args.epochs,
        imgsz=args.imgsz
    )

if __name__ == "__main__":
    main()
