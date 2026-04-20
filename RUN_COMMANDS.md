## 1. 🧠 Training the Models (Run these first)

### 🔴 Option A: Test Training (Fast, but Wrong Results)
Use this only to check if the code runs. Results will be inaccurate.
```ps1
python -m ml_training.federated_train --rounds 1 --epochs 1
```

### 🟢 Option B: Deep Training (Higher Accuracy - Recommended)
Use this to get correct animal predictions. This takes longer but is necessary.
```ps1
# 1. Train Federated ResNet-18 (Accurate Classifier)
python -m ml_training.federated_train --rounds 20 --epochs 5

# 2. Fine-tune YOLOv8 (Wildlife specific)
python -m ml_training.yolo_train --epochs 20

# 3. Generate Final Metrics
python -m ml_training.evaluation
```

---

## 2. 🌐 Running the Application

### Step A: Start the Backend (API)
Open a **new terminal** and run:
```ps1
cd d:\Capstone_project\backend
python main.py
```
*Wait until you see "Uvicorn running on http://0.0.0.0:8000"*

### Step B: Start the Frontend (UI)
Open **another new terminal** and run:
```ps1
cd d:\Capstone_project\frontend\wildshield-app
npm run dev
```
*Click the link `http://localhost:5173` that appears in the terminal.*

---

## 🛠️ Troubleshooting
- **Accuracy is low?** Increase training rounds in Step 1A or epochs in Step 1B.
- **Port 8000 busy?** Close any other terminal running the backend first.
- **Charts not showing?** Make sure you ran Step 1C after the training finished.

---
**WildShield-FL — Final Year Project Build**




1️⃣ Step 1: Main Model Training (Longest)
This creates the brain of your project.

ps1
python -m ml_training.federated_train --rounds 20 --epochs 5
Wait ~45-60 mins until it says "Training Complete!"

2️⃣ Step 2: YOLO Fine-Tuning
This teaches YOLO how to recognize your specific animals.

ps1
python -m ml_training.yolo_train --epochs 20
Wait ~30 mins until it says "YOLO Training Complete!"

3️⃣ Step 3: Generate Analytics
This creates the charts for your dashboard.

ps1
python -m ml_training.evaluation
🌐 Finally: Restart the App
Once Step 3 is done, open two new terminals and run:

Terminal A (Backend):

ps1
cd d:\Capstone_project\backend
python main.py
Terminal B (Frontend):

ps1
cd d:\Capstone_project\frontend\wildshield-app
npm run dev