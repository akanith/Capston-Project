"""
WildShield-FL: Wildlife ResNet18 Model Definition
Uses a pre-trained ResNet18 and replaces the final FC layer for wildlife classification.
"""

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import torch
import torch.nn as nn
from torchvision import models
from collections import OrderedDict


def create_resnet18_model(num_classes: int, pretrained: bool = True) -> nn.Module:
    """
    Create a ResNet18 model for wildlife classification.
    
    Args:
        num_classes: Number of wildlife species classes.
        pretrained: Whether to use ImageNet pre-trained weights.
    
    Returns:
        Modified ResNet18 model.
    """
    if pretrained:
        weights = models.ResNet18_Weights.IMAGENET1K_V1
        model = models.resnet18(weights=weights)
    else:
        model = models.resnet18(weights=None)
    
    # Freeze early layers for transfer learning efficiency
    for name, param in model.named_parameters():
        if "layer3" not in name and "layer4" not in name and "fc" not in name:
            param.requires_grad = False
    
    # Replace the final fully connected layer
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(num_features, 256),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.2),
        nn.Linear(256, num_classes)
    )
    
    return model


def get_model_weights(model: nn.Module) -> OrderedDict:
    """Extract model state dict (weights)."""
    return OrderedDict({k: v.clone() for k, v in model.state_dict().items()})


def set_model_weights(model: nn.Module, weights: OrderedDict) -> None:
    """Load weights into model."""
    model.load_state_dict(weights)


def fedavg_aggregate(client_weights_list: list, noise_scale: float = 0.0) -> OrderedDict:
    """
    Federated Averaging (FedAvg) algorithm.
    Aggregates model weights from multiple clients by averaging and optionally adding Gaussian noise (DP).
    
    Args:
        client_weights_list: List of OrderedDicts, each containing a client's model weights.
        noise_scale: Standard deviation of Gaussian noise for Differential Privacy.
    
    Returns:
        Aggregated (averaged) model weights.
    """
    num_clients = len(client_weights_list)
    aggregated_weights = OrderedDict()
    
    # Get all keys from the first client
    keys = client_weights_list[0].keys()
    
    for key in keys:
        # Stack all client weights for this layer and compute mean
        stacked = torch.stack([client_weights_list[i][key].float() for i in range(num_clients)])
        mean_weight = torch.mean(stacked, dim=0)
        
        # Add Differential Privacy noise if scale > 0
        if noise_scale > 0:
            noise = torch.randn_like(mean_weight) * noise_scale
            mean_weight = mean_weight + noise
            
        aggregated_weights[key] = mean_weight
    
    return aggregated_weights


if __name__ == "__main__":
    # Quick test
    model = create_resnet18_model(num_classes=31)
    print(f"Model created with {sum(p.numel() for p in model.parameters())} total parameters")
    print(f"Trainable parameters: {sum(p.numel() for p in model.parameters() if p.requires_grad)}")
    
    # Test FedAvg
    w1 = get_model_weights(model)
    w2 = get_model_weights(model)
    avg = fedavg_aggregate([w1, w2])
    print(f"FedAvg aggregation test passed. Keys: {len(avg)}")
