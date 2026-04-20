---
title: WildShield Wildlife System
emoji: 🛡️
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
---

# 🛡️ WildShield-FL v2.0.0

**Privacy-Aware Wildlife Monitoring with Federated Learning**

A full-stack AI system for wildlife image classification using Federated Learning (FedAvg) with ResNet18, YOLOv8 object detection, FastAPI backend, and React.js dashboard.

---

## 📁 Project Structure

```
Capstone_project/
├── archive/                    # Dataset (train/ & test/ with 31+ classes)
├── ml_training/                # Machine Learning System
│   ├── model.py                # ResNet18 model + FedAvg algorithm
│   ├── dataset_loader.py       # Data loading & federated splitting
│   ├── federated_train.py      # Federated training loop
│   └── evaluation.py           # Model evaluation & visualization
├── backend/                    # FastAPI Backend
│   ├── main.py                 # Server entry point
│   ├── inference.py            # ResNet & YOLO inference engines
│   ├── requirements.txt        # Python dependencies
│   └── api_routes/
│       ├── predict.py          # /predict-image endpoint
│       ├── yolo.py             # YOLO detection endpoints
│       └── metrics.py          # /metrics endpoint
├── frontend/wildshield-app/    # React.js Dashboard
│   ├── src/
│   │   ├── pages/              # 9 page components
│   │   ├── components/         # Sidebar, Header
│   │   └── services/api.js     # API client
│   └── package.json
├── models/                     # Saved models & metrics (generated)
│   ├── global_model_resnet18.pth
│   ├── training_history.json
│   ├── class_names.json
│   └── evaluation/             # Plots & metrics
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- (Optional) NVIDIA GPU with CUDA for faster training

### Step 1: Install Python Dependencies

```bash
cd Capstone_project
pip install -r backend/requirements.txt
```

### Step 2: Train the Federated Model

```bash
# Full training (10 rounds, 3 clients)
python -m ml_training.federated_train

# Quick test (1 round, 1 epoch)
python -m ml_training.federated_train --rounds 1 --epochs 1
```

This saves `models/global_model_resnet18.pth` and `models/training_history.json`.

### Step 3: Evaluate the Model

```bash
python -m ml_training.evaluation
```

Generates confusion matrix, ROC curves, classification report in `models/evaluation/`.

### Step 4: Start the Backend

```bash
cd backend
uvicorn main:app --reload --port 8000

python -m uvicorn main:app --reload --port 8000

```

API docs at `http://localhost:8000/docs`

### Step 5: Start the Frontend

```bash
`cd frontend/wildshield-app`
npm install
npm run dev
```

Open `http://localhost:5173`

---

## 🧠 Federated Learning Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Client 1   │     │  Client 2   │     │  Client 3   │
│ (Local Data)│     │ (Local Data)│     │ (Local Data)│
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │    Send Updated Weights               │
       ▼                   ▼                   ▼
    ┌──────────────────────────────────────────────┐
    │           Central Server (FedAvg)            │
    │  w_global = (1/n) × Σ w_client_i             │
    └──────────────────────────────────────────────┘
       │                                           
       ▼                                           
  Global Model (ResNet18)                          
```

1. Initialize global ResNet18 model
2. Distribute weights to 3 clients
3. Each client trains locally on its data subset
4. Clients send updated weights (not data!) back
5. Server aggregates via FedAvg
6. Repeat for 10 rounds
7. Save best global model

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict-image` | Classify wildlife image |
| POST | `/api/detect-yolo-image` | YOLO object detection |
| POST | `/api/detect-video` | Video detection |
| POST | `/api/webcam-detection` | Webcam frame detection |
| GET  | `/api/metrics` | Training & evaluation metrics |
| GET  | `/api/health` | Health check |

---

## 🖥️ Frontend Pages

| Page | Description |
|------|-------------|
| Dashboard | System overview, accuracy/loss charts |
| Animal Prediction | Upload & classify wildlife images |
| YOLO Image Detection | Detect animals with bounding boxes |
| YOLO Video Detection | Process videos for detections |
| Webcam Detection | Live webcam animal detection |
| Training Metrics | Accuracy/loss vs rounds, client stats |
| Confusion Matrix | Evaluation heatmap & report |
| Model Comparison | ResNet vs YOLO side-by-side |
| FedAvg Explained | Interactive FL workflow visualization |

---

## 🔒 Privacy Features

- **No data sharing**: Raw images never leave client devices
- **Weight-only communication**: Only model parameters are exchanged
- **Distributed training**: No central data storage
- **FedAvg aggregation**: Mathematical averaging preserves privacy

---

## 🛠️ Technologies

- **ML**: PyTorch, ResNet18, YOLOv8 (Ultralytics)
- **Backend**: FastAPI, Uvicorn
- **Frontend**: React.js, Vite, Recharts, React Icons
- **Dataset**: 31 wildlife classes, ~12,000 training images

---

## 📊 Model Performance

After training, run `python -m ml_training.evaluation` to generate:
- Overall accuracy & macro F1
- Per-class precision, recall, F1
- Confusion matrix heatmap
- ROC curves with AUC scores
- Misclassified image analysis
