"""
WildShield-FL: Federated Learning Training Script
Simulates 3 clients training locally with FedAvg aggregation.
"""

import os
import sys

# Fix OpenMP duplicate library error (common with Anaconda)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import json
import time
import argparse
import copy
import torch
import torch.nn as nn
import torch.optim as optim
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_training.model import create_resnet18_model, get_model_weights, set_model_weights, fedavg_aggregate
from ml_training.dataset_loader import (
    load_datasets, split_dataset_for_clients,
    create_client_dataloaders, create_test_dataloader,
    save_class_names
)


def train_client(model, dataloader, device, epochs=3, lr=0.001):
    """
    Train a single client's local model.
    
    Args:
        model: The model to train.
        dataloader: Client's local DataLoader.
        device: torch device.
        epochs: Number of local training epochs.
        lr: Learning rate.
    
    Returns:
        Tuple of (updated_weights, avg_loss, accuracy)
    """
    model.train()
    model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=lr)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=2, gamma=0.5)
    
    total_loss = 0
    total_correct = 0
    total_samples = 0
    
    for epoch in range(epochs):
        epoch_loss = 0
        epoch_correct = 0
        epoch_samples = 0
        
        for batch_idx, (images, labels) in enumerate(dataloader):
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            _, predicted = torch.max(outputs, 1)
            epoch_correct += (predicted == labels).sum().item()
            epoch_samples += labels.size(0)
            epoch_loss += loss.item() * labels.size(0)
            
            # Progress feedback every 10 batches
            if (batch_idx + 1) % 10 == 0:
                print(f"      Batch {batch_idx + 1}/{len(dataloader)}...", end="\r")
        
        scheduler.step()
        total_loss += epoch_loss
        total_correct += epoch_correct
        total_samples += epoch_samples
    
    avg_loss = total_loss / total_samples if total_samples > 0 else 0
    accuracy = total_correct / total_samples if total_samples > 0 else 0
    
    return get_model_weights(model), avg_loss, accuracy


def evaluate_global_model(model, dataloader, device):
    """
    Evaluate the global model on the test set.
    
    Returns:
        Tuple of (accuracy, avg_loss)
    """
    model.eval()
    model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    total_loss = 0
    total_correct = 0
    total_samples = 0
    
    with torch.no_grad():
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            _, predicted = torch.max(outputs, 1)
            total_correct += (predicted == labels).sum().item()
            total_samples += labels.size(0)
            total_loss += loss.item() * labels.size(0)
    
    accuracy = total_correct / total_samples if total_samples > 0 else 0
    avg_loss = total_loss / total_samples if total_samples > 0 else 0
    
    return accuracy, avg_loss


def federated_training(
    data_dir: str,
    model_save_dir: str,
    num_clients: int = 3,
    num_rounds: int = 10,
    local_epochs: int = 3,
    batch_size: int = 32,
    learning_rate: float = 0.001,
    device: str = None
):
    """
    Main federated learning training loop.
    
    Args:
        data_dir: Path to the dataset (archive/) directory.
        model_save_dir: Directory to save the trained model.
        num_clients: Number of federated clients.
        num_rounds: Number of federated rounds.
        local_epochs: Epochs per client per round.
        batch_size: Training batch size.
        learning_rate: Initial learning rate.
        device: torch device string.
    """
    # Auto-detect device
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    device = torch.device(device)
    print(f"\n{'='*60}")
    print(f"  WildShield-FL: Federated Learning Training")
    print(f"{'='*60}")
    print(f"  Device: {device}")
    print(f"  Clients: {num_clients}")
    print(f"  Rounds: {num_rounds}")
    print(f"  Local epochs per round: {local_epochs}")
    print(f"  Batch size: {batch_size}")
    print(f"  Learning rate: {learning_rate}")
    print(f"{'='*60}\n")
    
    # Load datasets
    print("Loading datasets...")
    train_dataset, test_dataset, class_names, common_classes = load_datasets(data_dir)
    num_classes = len(class_names)
    
    # Save class names for later use
    os.makedirs(model_save_dir, exist_ok=True)
    save_class_names(class_names, os.path.join(model_save_dir, "class_names.json"))
    
    # Split dataset for federated clients
    print("\nSplitting dataset across clients...")
    client_subsets = split_dataset_for_clients(train_dataset, num_clients=num_clients)
    client_dataloaders = create_client_dataloaders(client_subsets, batch_size=batch_size)
    test_dataloader = create_test_dataloader(test_dataset, batch_size=batch_size)
    
    # Initialize global model
    print(f"\nInitializing global ResNet18 model with {num_classes} classes...")
    global_model = create_resnet18_model(num_classes=num_classes, pretrained=True)
    
    # Training history
    history = {
        "config": {
            "num_clients": num_clients,
            "num_rounds": num_rounds,
            "local_epochs": local_epochs,
            "batch_size": batch_size,
            "learning_rate": learning_rate,
            "num_classes": num_classes,
            "class_names": class_names,
            "device": str(device),
            "timestamp": datetime.now().isoformat()
        },
        "rounds": [],
        "global_accuracy": [],
        "global_loss": []
    }
    
    best_accuracy = 0.0
    start_time = time.time()
    
    # ==========================================
    # FEDERATED LEARNING LOOP
    # ==========================================
    for round_idx in range(num_rounds):
        round_start = time.time()
        print(f"\n{'─'*50}")
        print(f"  Round {round_idx + 1}/{num_rounds}")
        print(f"{'─'*50}")
        
        # Get current global weights
        global_weights = get_model_weights(global_model)
        
        # Train each client locally
        client_weights_list = []
        round_info = {"round": round_idx + 1, "clients": []}
        
        for client_idx in range(num_clients):
            print(f"  Training Client {client_idx + 1}...", end=" ")
            
            # Create local model copy with global weights
            local_model = create_resnet18_model(num_classes=num_classes, pretrained=False)
            set_model_weights(local_model, copy.deepcopy(global_weights))
            
            # Train locally
            updated_weights, client_loss, client_acc = train_client(
                local_model, client_dataloaders[client_idx],
                device, epochs=local_epochs, lr=learning_rate
            )
            
            client_weights_list.append(updated_weights)
            
            client_info = {
                "client_id": client_idx + 1,
                "loss": round(client_loss, 4),
                "accuracy": round(client_acc, 4),
                "samples": len(client_subsets[client_idx])
            }
            round_info["clients"].append(client_info)
            print(f"Loss: {client_loss:.4f}, Acc: {client_acc:.4f}")
            
            # Clean up
            del local_model
            torch.cuda.empty_cache() if device.type == 'cuda' else None
        
        # ==========================================
        # FEDAVG AGGREGATION
        # ==========================================
        print(f"\n  Aggregating weights (FedAvg)...")
        aggregated_weights = fedavg_aggregate(client_weights_list)
        set_model_weights(global_model, aggregated_weights)
        
        # Evaluate global model
        global_acc, global_loss = evaluate_global_model(global_model, test_dataloader, device)
        
        round_time = time.time() - round_start
        round_info["global_accuracy"] = round(global_acc, 4)
        round_info["global_loss"] = round(global_loss, 4)
        round_info["time_seconds"] = round(round_time, 1)
        
        history["rounds"].append(round_info)
        history["global_accuracy"].append(round(global_acc, 4))
        history["global_loss"].append(round(global_loss, 4))
        
        print(f"\n  ► Global Accuracy: {global_acc:.4f} ({global_acc*100:.2f}%)")
        print(f"  ► Global Loss: {global_loss:.4f}")
        print(f"  ► Round Time: {round_time:.1f}s")
        
        # Save best model
        if global_acc > best_accuracy:
            best_accuracy = global_acc
            model_path = os.path.join(model_save_dir, "global_model_resnet18.pth")
            torch.save({
                'model_state_dict': global_model.state_dict(),
                'num_classes': num_classes,
                'class_names': class_names,
                'accuracy': best_accuracy,
                'round': round_idx + 1,
                'config': history['config']
            }, model_path)
            print(f"  ✓ New best model saved! (Accuracy: {best_accuracy:.4f})")
    
    # ==========================================
    # TRAINING COMPLETE
    # ==========================================
    total_time = time.time() - start_time
    
    history["best_accuracy"] = round(best_accuracy, 4)
    history["total_time_seconds"] = round(total_time, 1)
    
    # Save training history
    history_path = os.path.join(model_save_dir, "training_history.json")
    with open(history_path, 'w') as f:
        json.dump(history, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"  Training Complete!")
    print(f"{'='*60}")
    print(f"  Best Accuracy: {best_accuracy:.4f} ({best_accuracy*100:.2f}%)")
    print(f"  Total Time: {total_time:.1f}s")
    print(f"  Model saved: {os.path.join(model_save_dir, 'global_model_resnet18.pth')}")
    print(f"  History saved: {history_path}")
    print(f"{'='*60}\n")
    
    return global_model, history


def main():
    parser = argparse.ArgumentParser(description="WildShield-FL Federated Training")
    parser.add_argument("--data-dir", type=str, default=None,
                        help="Path to dataset directory (default: archive/)")
    parser.add_argument("--model-dir", type=str, default=None,
                        help="Directory to save model (default: models/)")
    parser.add_argument("--rounds", type=int, default=10,
                        help="Number of federated rounds")
    parser.add_argument("--epochs", type=int, default=3,
                        help="Local epochs per round")
    parser.add_argument("--clients", type=int, default=3,
                        help="Number of federated clients")
    parser.add_argument("--batch-size", type=int, default=32,
                        help="Training batch size")
    parser.add_argument("--lr", type=float, default=0.001,
                        help="Learning rate")
    parser.add_argument("--device", type=str, default=None,
                        help="Device (cuda/cpu)")
    
    args = parser.parse_args()
    
    # Set default paths relative to project root
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if args.data_dir is None:
        args.data_dir = os.path.join(project_root, "archive")
    if args.model_dir is None:
        args.model_dir = os.path.join(project_root, "models")
    
    federated_training(
        data_dir=args.data_dir,
        model_save_dir=args.model_dir,
        num_clients=args.clients,
        num_rounds=args.rounds,
        local_epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        device=args.device
    )


if __name__ == "__main__":
    main()
