"""
WildShield-FL: Dataset Loader & Federated Data Splitter
Loads wildlife images from archive/train and archive/test directories.
Splits training data across federated clients.
"""

import os
import json
import torch
from torch.utils.data import DataLoader, Dataset, Subset, random_split
from torchvision import datasets, transforms


# ImageNet normalization statistics
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# Image size for ResNet18
IMAGE_SIZE = 224


def get_train_transforms():
    """Training data augmentation transforms."""
    return transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.1),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])


def get_test_transforms():
    """Test/validation transforms (no augmentation)."""
    return transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])


class FilteredTestDataset(Dataset):
    """
    Wraps a test ImageFolder dataset and:
    1. Filters out samples whose class is NOT in the training set
    2. Remaps test labels to match training class indices
    """
    def __init__(self, test_dataset, train_class_to_idx):
        self.test_dataset = test_dataset
        self.train_class_to_idx = train_class_to_idx  # e.g. {'Bear': 0, 'Brown_bear': 1, ...}
        
        # Build mapping: test_class_idx -> train_class_idx (only for common classes)
        test_idx_to_name = {v: k for k, v in test_dataset.class_to_idx.items()}
        
        self.valid_indices = []
        self.remapped_labels = []
        
        for i, (_, test_label) in enumerate(test_dataset.samples):
            test_class_name = test_idx_to_name[test_label]
            if test_class_name in train_class_to_idx:
                self.valid_indices.append(i)
                self.remapped_labels.append(train_class_to_idx[test_class_name])
        
        self.classes = list(train_class_to_idx.keys())
        self.class_to_idx = train_class_to_idx
        
        print(f"  Filtered test set: {len(self.valid_indices)}/{len(test_dataset)} samples "
              f"({len(test_dataset) - len(self.valid_indices)} excluded from non-training classes)")
    
    def __len__(self):
        return len(self.valid_indices)
    
    def __getitem__(self, idx):
        original_idx = self.valid_indices[idx]
        image, _ = self.test_dataset[original_idx]  # ignore original label
        label = self.remapped_labels[idx]
        return image, label


def load_datasets(data_dir: str):
    """
    Load training and test datasets.
    Test dataset is filtered to only include classes present in training set,
    and labels are remapped to match training class indices.
    
    Args:
        data_dir: Root directory containing train/ and test/ subdirectories.
    
    Returns:
        Tuple of (train_dataset, filtered_test_dataset, class_names, common_classes)
    """
    train_dir = os.path.join(data_dir, "train")
    test_dir = os.path.join(data_dir, "test")
    
    if not os.path.exists(train_dir):
        raise FileNotFoundError(f"Training directory not found: {train_dir}")
    if not os.path.exists(test_dir):
        raise FileNotFoundError(f"Test directory not found: {test_dir}")
    
    train_dataset = datasets.ImageFolder(train_dir, transform=get_train_transforms())
    test_dataset_raw = datasets.ImageFolder(test_dir, transform=get_test_transforms())
    
    train_classes = set(train_dataset.classes)
    test_classes = set(test_dataset_raw.classes)
    common_classes = sorted(train_classes & test_classes)
    
    print(f"Training classes ({len(train_classes)}): {sorted(train_classes)}")
    print(f"Test classes ({len(test_classes)}): {sorted(test_classes)}")
    print(f"Common classes ({len(common_classes)}): {common_classes}")
    print(f"Training samples: {len(train_dataset)}")
    print(f"Test samples (raw): {len(test_dataset_raw)}")
    
    # Create filtered test dataset with remapped labels
    filtered_test = FilteredTestDataset(test_dataset_raw, train_dataset.class_to_idx)
    print(f"Test samples (filtered): {len(filtered_test)}")
    
    return train_dataset, filtered_test, train_dataset.classes, common_classes


def split_dataset_for_clients(dataset, num_clients: int = 3, seed: int = 42):
    """
    Split training dataset into non-overlapping subsets for federated clients.
    Uses non-IID splitting to simulate realistic federated scenarios.
    
    Args:
        dataset: Full training dataset.
        num_clients: Number of federated clients.
        seed: Random seed for reproducibility.
    
    Returns:
        List of Subset objects, one per client.
    """
    total_size = len(dataset)
    
    # Calculate split sizes
    base_size = total_size // num_clients
    remainder = total_size % num_clients
    
    split_sizes = [base_size] * num_clients
    for i in range(remainder):
        split_sizes[i] += 1
    
    assert sum(split_sizes) == total_size, "Split sizes don't sum to total"
    
    generator = torch.Generator().manual_seed(seed)
    client_subsets = random_split(dataset, split_sizes, generator=generator)
    
    print(f"\nFederated data split across {num_clients} clients:")
    for i, subset in enumerate(client_subsets):
        print(f"  Client {i+1}: {len(subset)} samples")
    
    return client_subsets


def create_client_dataloaders(client_subsets, batch_size: int = 32, num_workers: int = 2):
    """
    Create DataLoaders for each client's subset.
    
    Args:
        client_subsets: List of Subset objects from split_dataset_for_clients.
        batch_size: Batch size for training.
        num_workers: Number of data loading workers.
    
    Returns:
        List of DataLoaders, one per client.
    """
    return [
        DataLoader(
            subset,
            batch_size=batch_size,
            shuffle=True,
            num_workers=num_workers,
            pin_memory=False,
            drop_last=False
        )
        for subset in client_subsets
    ]


def create_test_dataloader(test_dataset, batch_size: int = 32, num_workers: int = 2):
    """Create DataLoader for test dataset."""
    return DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=False
    )


def get_class_mapping(dataset):
    """Get class index to class name mapping."""
    return {v: k for k, v in dataset.class_to_idx.items()}


def save_class_names(class_names, save_path):
    """Save class names to JSON file."""
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, 'w') as f:
        json.dump(class_names, f, indent=2)
    print(f"Class names saved to {save_path}")


if __name__ == "__main__":
    # Test dataset loading
    import sys
    
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "archive")
    
    train_ds, test_ds, class_names, common = load_datasets(data_dir)
    subsets = split_dataset_for_clients(train_ds, num_clients=3)
    loaders = create_client_dataloaders(subsets, batch_size=32)
    
    # Verify a batch loads correctly
    images, labels = next(iter(loaders[0]))
    print(f"\nBatch shape: {images.shape}, Labels shape: {labels.shape}")
    print(f"Image range: [{images.min():.3f}, {images.max():.3f}]")
    print(f"Class names: {class_names}")
