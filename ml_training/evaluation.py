"""
WildShield-FL: Model Evaluation Script
Evaluates the trained global model and generates comprehensive metrics & visualizations.
"""

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import sys
import json
import argparse
import numpy as np
import torch
import torch.nn as nn
from collections import defaultdict

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_training.model import create_resnet18_model
from ml_training.dataset_loader import load_datasets, create_test_dataloader


def load_trained_model(model_path: str, device: str = None):
    """Load the trained global model from checkpoint."""
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    device = torch.device(device)
    
    checkpoint = torch.load(model_path, map_location=device, weights_only=False)
    
    num_classes = checkpoint['num_classes']
    class_names = checkpoint['class_names']
    
    model = create_resnet18_model(num_classes=num_classes, pretrained=False)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()
    
    print(f"Model loaded from {model_path}")
    print(f"  Classes: {num_classes}")
    print(f"  Best training accuracy: {checkpoint.get('accuracy', 'N/A')}")
    
    return model, class_names, device


def evaluate_model(model, test_loader, class_names, device):
    """
    Run full evaluation on test set.
    
    Returns:
        Dictionary with all evaluation metrics.
    """
    model.eval()
    
    all_predictions = []
    all_labels = []
    all_probabilities = []
    misclassified = []
    
    softmax = nn.Softmax(dim=1)
    
    with torch.no_grad():
        for batch_idx, (images, labels) in enumerate(test_loader):
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            probabilities = softmax(outputs)
            _, predicted = torch.max(outputs, 1)
            
            all_predictions.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probabilities.extend(probabilities.cpu().numpy())
            
            # Track misclassified samples (first 50)
            mask = predicted != labels
            if mask.any() and len(misclassified) < 50:
                for i in mask.nonzero(as_tuple=True)[0]:
                    if len(misclassified) >= 50:
                        break
                    misclassified.append({
                        "batch": batch_idx,
                        "index": i.item(),
                        "true_label": class_names[labels[i].item()],
                        "predicted_label": class_names[predicted[i].item()],
                        "confidence": probabilities[i][predicted[i]].item()
                    })
    
    all_predictions = np.array(all_predictions)
    all_labels = np.array(all_labels)
    all_probabilities = np.array(all_probabilities)
    
    # Compute metrics
    metrics = compute_metrics(all_predictions, all_labels, all_probabilities, class_names)
    metrics["misclassified_samples"] = misclassified
    
    return metrics


def compute_metrics(predictions, labels, probabilities, class_names):
    """Compute detailed classification metrics."""
    num_classes = len(class_names)
    
    # Overall accuracy
    accuracy = np.mean(predictions == labels)
    
    # Per-class metrics
    per_class = {}
    for i, cls_name in enumerate(class_names):
        mask_true = labels == i
        mask_pred = predictions == i
        
        tp = np.sum((predictions == i) & (labels == i))
        fp = np.sum((predictions == i) & (labels != i))
        fn = np.sum((predictions != i) & (labels == i))
        tn = np.sum((predictions != i) & (labels != i))
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        class_acc = tp / np.sum(mask_true) if np.sum(mask_true) > 0 else 0.0
        support = int(np.sum(mask_true))
        
        per_class[cls_name] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "accuracy": round(class_acc, 4),
            "support": support,
            "tp": int(tp), "fp": int(fp), "fn": int(fn), "tn": int(tn)
        }
    
    # Confusion matrix
    confusion_matrix = np.zeros((num_classes, num_classes), dtype=int)
    for t, p in zip(labels, predictions):
        confusion_matrix[t][p] += 1
    
    # Macro averages
    precisions = [per_class[c]["precision"] for c in class_names if per_class[c]["support"] > 0]
    recalls = [per_class[c]["recall"] for c in class_names if per_class[c]["support"] > 0]
    f1s = [per_class[c]["f1_score"] for c in class_names if per_class[c]["support"] > 0]
    
    # ROC data (per class, one-vs-rest)
    roc_data = {}
    for i, cls_name in enumerate(class_names):
        binary_labels = (labels == i).astype(int)
        if np.sum(binary_labels) == 0:
            continue
        scores = probabilities[:, i]
        
        # Compute ROC points
        thresholds = np.linspace(0, 1, 100)
        tpr_list = []
        fpr_list = []
        for thresh in thresholds:
            pred_pos = (scores >= thresh).astype(int)
            tp = np.sum((pred_pos == 1) & (binary_labels == 1))
            fp = np.sum((pred_pos == 1) & (binary_labels == 0))
            fn = np.sum((pred_pos == 0) & (binary_labels == 1))
            tn = np.sum((pred_pos == 0) & (binary_labels == 0))
            
            tpr = tp / (tp + fn) if (tp + fn) > 0 else 0
            fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
            tpr_list.append(tpr)
            fpr_list.append(fpr)
        
        # Compute AUC using trapezoidal rule
        sorted_pairs = sorted(zip(fpr_list, tpr_list))
        fpr_sorted = [p[0] for p in sorted_pairs]
        tpr_sorted = [p[1] for p in sorted_pairs]
        auc = np.trapezoid(tpr_sorted, fpr_sorted)
        
        roc_data[cls_name] = {
            "fpr": [round(x, 4) for x in fpr_sorted[::5]],  # Sample every 5th point
            "tpr": [round(x, 4) for x in tpr_sorted[::5]],
            "auc": round(abs(auc), 4)
        }
    
    return {
        "overall_accuracy": round(accuracy, 4),
        "macro_precision": round(np.mean(precisions), 4),
        "macro_recall": round(np.mean(recalls), 4),
        "macro_f1": round(np.mean(f1s), 4),
        "num_classes": num_classes,
        "total_test_samples": int(len(labels)),
        "class_names": class_names,
        "per_class_metrics": per_class,
        "confusion_matrix": confusion_matrix.tolist(),
        "roc_data": roc_data
    }


def generate_plots(metrics, save_dir):
    """Generate evaluation visualization plots using matplotlib."""
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        import matplotlib.colors as mcolors
    except ImportError:
        print("matplotlib not available. Skipping plot generation.")
        return
    
    os.makedirs(save_dir, exist_ok=True)
    class_names = metrics["class_names"]
    
    # 1. Confusion Matrix Heatmap
    print("  Generating confusion matrix...")
    cm = np.array(metrics["confusion_matrix"])
    fig, ax = plt.subplots(1, 1, figsize=(16, 14))
    
    # Normalize for display
    cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
    cm_norm = np.nan_to_num(cm_norm)
    
    im = ax.imshow(cm_norm, cmap='YlOrRd', aspect='auto')
    ax.set_xticks(range(len(class_names)))
    ax.set_yticks(range(len(class_names)))
    ax.set_xticklabels(class_names, rotation=45, ha='right', fontsize=7)
    ax.set_yticklabels(class_names, fontsize=7)
    ax.set_xlabel('Predicted', fontsize=12)
    ax.set_ylabel('True', fontsize=12)
    ax.set_title('Confusion Matrix (Normalized)', fontsize=14, fontweight='bold')
    plt.colorbar(im, fraction=0.046, pad=0.04)
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "confusion_matrix.png"), dpi=150, bbox_inches='tight')
    plt.close()
    
    # 2. Per-class Accuracy Bar Chart
    print("  Generating per-class accuracy chart...")
    class_accs = [metrics["per_class_metrics"][c]["accuracy"] for c in class_names]
    
    fig, ax = plt.subplots(figsize=(14, 6))
    colors = plt.cm.viridis(np.linspace(0.2, 0.9, len(class_names)))
    bars = ax.bar(range(len(class_names)), class_accs, color=colors)
    ax.set_xticks(range(len(class_names)))
    ax.set_xticklabels(class_names, rotation=45, ha='right', fontsize=8)
    ax.set_ylabel('Accuracy', fontsize=12)
    ax.set_title('Per-Class Accuracy', fontsize=14, fontweight='bold')
    ax.set_ylim(0, 1.1)
    ax.axhline(y=metrics["overall_accuracy"], color='red', linestyle='--', 
               label=f'Overall: {metrics["overall_accuracy"]:.3f}')
    ax.legend(fontsize=10)
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "per_class_accuracy.png"), dpi=150, bbox_inches='tight')
    plt.close()
    
    # 3. Precision/Recall/F1 Comparison
    print("  Generating P/R/F1 chart...")
    precisions = [metrics["per_class_metrics"][c]["precision"] for c in class_names]
    recalls = [metrics["per_class_metrics"][c]["recall"] for c in class_names]
    f1s = [metrics["per_class_metrics"][c]["f1_score"] for c in class_names]
    
    x = np.arange(len(class_names))
    width = 0.25
    
    fig, ax = plt.subplots(figsize=(16, 6))
    ax.bar(x - width, precisions, width, label='Precision', color='#2196F3')
    ax.bar(x, recalls, width, label='Recall', color='#4CAF50')
    ax.bar(x + width, f1s, width, label='F1 Score', color='#FF9800')
    ax.set_xticks(x)
    ax.set_xticklabels(class_names, rotation=45, ha='right', fontsize=7)
    ax.set_ylabel('Score', fontsize=12)
    ax.set_title('Precision / Recall / F1 Score per Class', fontsize=14, fontweight='bold')
    ax.legend(fontsize=10)
    ax.set_ylim(0, 1.1)
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "precision_recall_f1.png"), dpi=150, bbox_inches='tight')
    plt.close()
    
    # 4. ROC Curves (top 10 classes by AUC)
    print("  Generating ROC curves...")
    roc_data = metrics.get("roc_data", {})
    if roc_data:
        sorted_classes = sorted(roc_data.keys(), key=lambda c: roc_data[c]['auc'], reverse=True)[:10]
        
        fig, ax = plt.subplots(figsize=(10, 8))
        colors = plt.cm.tab10(np.linspace(0, 1, len(sorted_classes)))
        
        for i, cls_name in enumerate(sorted_classes):
            data = roc_data[cls_name]
            ax.plot(data['fpr'], data['tpr'], color=colors[i], 
                    label=f'{cls_name} (AUC={data["auc"]:.3f})', linewidth=1.5)
        
        ax.plot([0, 1], [0, 1], 'k--', linewidth=1, alpha=0.5, label='Random')
        ax.set_xlabel('False Positive Rate', fontsize=12)
        ax.set_ylabel('True Positive Rate', fontsize=12)
        ax.set_title('ROC Curves (Top 10 Classes)', fontsize=14, fontweight='bold')
        ax.legend(fontsize=8, loc='lower right')
        ax.set_xlim([0, 1])
        ax.set_ylim([0, 1.05])
        plt.tight_layout()
        plt.savefig(os.path.join(save_dir, "roc_curves.png"), dpi=150, bbox_inches='tight')
        plt.close()
    
    # 5. Classification Report Summary
    print("  Generating classification report...")
    report_lines = [
        f"{'Class':<20} {'Precision':>10} {'Recall':>10} {'F1-Score':>10} {'Support':>10}",
        "=" * 62
    ]
    for cls_name in class_names:
        m = metrics["per_class_metrics"][cls_name]
        report_lines.append(
            f"{cls_name:<20} {m['precision']:>10.4f} {m['recall']:>10.4f} {m['f1_score']:>10.4f} {m['support']:>10d}"
        )
    report_lines.append("=" * 62)
    report_lines.append(
        f"{'Macro Avg':<20} {metrics['macro_precision']:>10.4f} {metrics['macro_recall']:>10.4f} {metrics['macro_f1']:>10.4f} {metrics['total_test_samples']:>10d}"
    )
    report_lines.append(f"\nOverall Accuracy: {metrics['overall_accuracy']:.4f}")
    
    report_text = "\n".join(report_lines)
    with open(os.path.join(save_dir, "classification_report.txt"), 'w') as f:
        f.write(report_text)
    print(f"\n{report_text}")
    
    print(f"\n  All plots saved to {save_dir}")


def generate_training_plots(history_path, save_dir):
    """Generate training history plots from saved JSON."""
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib not available. Skipping training plot generation.")
        return
    
    with open(history_path, 'r') as f:
        history = json.load(f)
    
    os.makedirs(save_dir, exist_ok=True)
    rounds = list(range(1, len(history["rounds"]) + 1))
    
    # 1. Global Accuracy vs Rounds
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    axes[0].plot(rounds, history["global_accuracy"], 'b-o', linewidth=2, markersize=6, label='Global Accuracy')
    axes[0].set_xlabel('Round', fontsize=12)
    axes[0].set_ylabel('Accuracy', fontsize=12)
    axes[0].set_title('Global Model Accuracy vs Rounds', fontsize=14, fontweight='bold')
    axes[0].legend(fontsize=10)
    axes[0].grid(True, alpha=0.3)
    axes[0].set_ylim(0, 1.05)
    
    # 2. Global Loss vs Rounds
    axes[1].plot(rounds, history["global_loss"], 'r-o', linewidth=2, markersize=6, label='Global Loss')
    axes[1].set_xlabel('Round', fontsize=12)
    axes[1].set_ylabel('Loss', fontsize=12)
    axes[1].set_title('Global Model Loss vs Rounds', fontsize=14, fontweight='bold')
    axes[1].legend(fontsize=10)
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "training_curves.png"), dpi=150, bbox_inches='tight')
    plt.close()
    
    # 3. Per-client accuracy across rounds
    fig, ax = plt.subplots(figsize=(10, 6))
    num_clients = history["config"]["num_clients"]
    
    for client_idx in range(num_clients):
        client_accs = [r["clients"][client_idx]["accuracy"] for r in history["rounds"]]
        ax.plot(rounds, client_accs, '-o', linewidth=1.5, markersize=5,
                label=f'Client {client_idx + 1}')
    
    ax.plot(rounds, history["global_accuracy"], 'k-s', linewidth=2.5, markersize=7,
            label='Global Model', zorder=5)
    
    ax.set_xlabel('Round', fontsize=12)
    ax.set_ylabel('Accuracy', fontsize=12)
    ax.set_title('Client vs Global Model Accuracy', fontsize=14, fontweight='bold')
    ax.legend(fontsize=10)
    ax.grid(True, alpha=0.3)
    ax.set_ylim(0, 1.05)
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "client_accuracy.png"), dpi=150, bbox_inches='tight')
    plt.close()
    
    # 4. Per-client loss across rounds
    fig, ax = plt.subplots(figsize=(10, 6))
    for client_idx in range(num_clients):
        client_losses = [r["clients"][client_idx]["loss"] for r in history["rounds"]]
        ax.plot(rounds, client_losses, '-o', linewidth=1.5, markersize=5,
                label=f'Client {client_idx + 1}')
    
    ax.plot(rounds, history["global_loss"], 'k-s', linewidth=2.5, markersize=7,
            label='Global Model', zorder=5)
    
    ax.set_xlabel('Round', fontsize=12)
    ax.set_ylabel('Loss', fontsize=12)
    ax.set_title('Client vs Global Model Loss', fontsize=14, fontweight='bold')
    ax.legend(fontsize=10)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "client_loss.png"), dpi=150, bbox_inches='tight')
    plt.close()
    
    print(f"  Training plots saved to {save_dir}")


def main():
    parser = argparse.ArgumentParser(description="WildShield-FL Model Evaluation")
    parser.add_argument("--model-path", type=str, default=None,
                        help="Path to trained model file")
    parser.add_argument("--data-dir", type=str, default=None,
                        help="Path to dataset directory")
    parser.add_argument("--output-dir", type=str, default=None,
                        help="Directory to save evaluation results")
    parser.add_argument("--device", type=str, default=None)
    
    args = parser.parse_args()
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if args.model_path is None:
        args.model_path = os.path.join(project_root, "models", "global_model_resnet18.pth")
    if args.data_dir is None:
        args.data_dir = os.path.join(project_root, "archive")
    if args.output_dir is None:
        args.output_dir = os.path.join(project_root, "models", "evaluation")
    
    print(f"\n{'='*60}")
    print(f"  WildShield-FL: Model Evaluation")
    print(f"{'='*60}\n")
    
    # Load model
    model, class_names, device = load_trained_model(args.model_path, args.device)
    
    # Load test dataset
    _, test_dataset, _, common_classes = load_datasets(args.data_dir)
    test_loader = create_test_dataloader(test_dataset, batch_size=32)
    
    # Run evaluation
    print("\nRunning evaluation on test set...")
    # Note: we use test_dataset.classes which may differ from training classes
    # The model was trained on training classes, so predictions map to training class indices
    metrics = evaluate_model(model, test_loader, class_names, device)
    
    # Save metrics JSON
    os.makedirs(args.output_dir, exist_ok=True)
    metrics_path = os.path.join(args.output_dir, "evaluation_metrics.json")
    
    # Make JSON serializable (remove numpy types)
    save_metrics = json.loads(json.dumps(metrics, default=str))
    with open(metrics_path, 'w') as f:
        json.dump(save_metrics, f, indent=2)
    print(f"\nMetrics saved to {metrics_path}")
    
    # Generate plots
    print("\nGenerating evaluation plots...")
    generate_plots(metrics, args.output_dir)
    
    # Generate training history plots if available
    history_path = os.path.join(os.path.dirname(args.model_path), "training_history.json")
    if os.path.exists(history_path):
        print("\nGenerating training history plots...")
        generate_training_plots(history_path, args.output_dir)
    
    print(f"\n{'='*60}")
    print(f"  Evaluation Complete!")
    print(f"  Overall Accuracy: {metrics['overall_accuracy']:.4f}")
    print(f"  Macro F1: {metrics['macro_f1']:.4f}")
    print(f"  Results saved to: {args.output_dir}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
