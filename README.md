# 🛡️ AI-Powered Network Intrusion Detection & Security Dashboard

> **College Mini Project** — CSE / Data Science  
> A web-based cybersecurity dashboard powered by Machine Learning (Random Forest) to detect network intrusions in real-time.

---

## 📌 Table of Contents

1. [Project Introduction](#-project-introduction)  
2. [Problem Statement](#-problem-statement)  
3. [Objectives](#-objectives)  
4. [Existing vs Proposed System](#-existing-vs-proposed-system)  
5. [Key Features](#-key-features)  
6. [Technology Stack](#-technology-stack)  
7. [Dataset Information](#-dataset-information)  
8. [Machine Learning Algorithm](#-machine-learning-algorithm)  
9. [Project Architecture](#-project-architecture)  
10. [Methodology](#-methodology)  
11. [Installation](#-installation)  
12. [How to Run](#-how-to-run)  
13. [User Guide](#-user-guide)  
14. [Results & Evaluation](#-results--evaluation)  
15. [Modules Explained](#-modules-explained)  
16. [Advantages](#-advantages)  
17. [Limitations](#-limitations)  
18. [Future Scope](#-future-scope)  
19. [Conclusion](#-conclusion)  

---

## 📖 Project Introduction

With the rapid growth of the internet and network-connected devices, cybersecurity threats such as **Denial of Service (DoS)**, **port scanning**, **brute-force attacks**, and **data exfiltration** have become a serious challenge for organizations worldwide.

This project implements an **AI-Powered Network Intrusion Detection System (NIDS)** that uses supervised machine learning to classify network traffic as either **Normal** or **Attack**. The system is presented through a modern, interactive **Streamlit dashboard** that allows:

- Training a machine learning model on any labelled network traffic dataset.
- Visualizing traffic patterns with interactive charts.
- Uploading new traffic records and getting instant threat predictions.
- Downloading prediction reports as CSV files.

---

## ❓ Problem Statement

Traditional firewalls and rule-based intrusion detection systems rely on manually crafted rules that:

- Cannot adapt to new or unknown attack patterns (zero-day attacks).
- Require constant manual updates.
- Are easily bypassed by sophisticated attackers.

**Our Proposed Solution:** Use supervised machine learning (Random Forest) trained on real-world network traffic datasets to **automatically learn** normal and malicious traffic patterns, enabling accurate detection of both known and emerging threats.

---

## 🎯 Objectives

1. Develop a machine learning model capable of classifying network traffic as Normal or Attack.
2. Implement a robust data preprocessing pipeline that handles messy real-world datasets.
3. Build a professional web dashboard to visualize traffic data and model performance.
4. Provide an easy-to-use interface for uploading datasets, training models, and making predictions.
5. Display risk levels (Low / Medium / High) for each detected record.
6. Allow export of prediction results for further analysis.

---

## 🔄 Existing vs Proposed System

### Existing System
| Feature | Traditional NIDS |
|---|---|
| Detection Method | Rule-based / Signature matching |
| Adaptability | Low — cannot detect new attacks |
| Maintenance | Requires constant manual rule updates |
| False Positives | High |
| Visualization | Limited |

### Proposed System
| Feature | AI-Powered NIDS (Our Project) |
|---|---|
| Detection Method | Machine Learning (Random Forest) |
| Adaptability | High — learns from data patterns |
| Maintenance | Retrain with new data |
| False Positives | Lower with balanced training |
| Visualization | Interactive web dashboard |

---

## ⭐ Key Features

- **🤖 ML-Powered Detection** — Random Forest classifier trained on network traffic data.
- **📊 Interactive Dashboard** — Plotly charts for traffic analysis and pattern visualization.
- **📂 Flexible Dataset Loading** — Upload any labelled CSV (CICIDS2017, NSL-KDD, etc.).
- **🔧 Smart Preprocessing** — Auto-handles missing values, infinities, duplicates, encoding.
- **🏷️ Auto Label Detection** — Automatically identifies the target column in your dataset.
- **🎭 Demo Mode** — Works without a real dataset using synthetic data.
- **⚡ Risk Level Scoring** — Low / Medium / High risk classification per record.
- **⬇️ Export Results** — Download predictions as CSV for reports.
- **📈 Feature Importance** — Visualize which features matter most for detection.
- **🛡️ Safe by Design** — Educational demonstration only; no real attack execution.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Language | Python 3.9+ |
| Web Framework | Streamlit |
| ML Library | Scikit-learn |
| Data Processing | Pandas, NumPy |
| Visualization | Plotly |
| Model Persistence | Joblib |
| Styling | Custom HTML/CSS in Streamlit |

> **Cost: ₹0 / $0** — All tools are 100% free and open source.

---

## 📦 Dataset Information

### Recommended: CICIDS2017
- **Source:** Canadian Institute for Cybersecurity  
- **URL:** https://www.unb.ca/cic/datasets/ids-2017.html  
- **Features:** 78 network traffic features (flow-based)  
- **Classes:** BENIGN, DoS Hulk, PortScan, DDoS, DoS GoldenEye, FTP-Patator, SSH-Patator, DoS Slowloris, DoS Slowhttptest, Heartbleed, Web Attack, Infiltration, Bot  
- **Size:** ~2.8 GB (multiple CSV files)

### Other Supported Datasets
- **NSL-KDD** — Improved version of the KDD Cup 1999 dataset
- **UNSW-NB15** — Modern mixed attack dataset
- **CIC-IDS-2018** — Updated CICIDS dataset
- **Any custom labelled network traffic CSV**

### Demo Mode
If no dataset is available, the application generates **synthetic network traffic data** with features inspired by CICIDS. This is clearly marked as demo/synthetic and should not be used for real-world evaluation.

---

## 🤖 Machine Learning Algorithm

### Random Forest Classifier

**Why Random Forest?**
- Handles high-dimensional data (many features) well.
- Resistant to overfitting through ensemble averaging.
- Naturally handles class imbalance with `class_weight='balanced'`.
- Provides feature importance rankings.
- Works well with mixed numerical and categorical data.
- No need for feature scaling (tree-based algorithm).

**Training Pipeline:**
```
Raw CSV → Clean Data → Feature Engineering → Train/Test Split
→ Random Forest → Evaluation → Save Model
```

**Parameters Used:**
| Parameter | Value | Reason |
|---|---|---|
| n_estimators | 100 (default) | Good balance of speed and accuracy |
| class_weight | balanced | Handles class imbalance automatically |
| random_state | 42 | Reproducibility |
| n_jobs | -1 | Use all CPU cores |
| test_size | 20% (default) | Standard split ratio |

---

## 🏗️ Project Architecture

```
nids-streamlit/
│
├── data/
│   └── dataset.csv            ← Place your dataset here
│
├── models/
│   ├── intrusion_model.pkl    ← Saved trained model (auto-generated)
│   └── model_metadata.json   ← Model info & metrics (auto-generated)
│
├── notebooks/
│   └── analysis.ipynb         ← Jupyter notebook for exploration
│
├── src/
│   ├── __init__.py
│   ├── data_preprocessing.py  ← Data loading, cleaning, pipeline
│   ├── train_model.py         ← Model training, evaluation, saving
│   └── prediction.py          ← Load model and predict on new data
│
├── app.py                     ← Streamlit dashboard (main entry point)
├── requirements.txt           ← Python dependencies
├── README.md                  ← This file
└── .gitignore
```

---

## 📐 Methodology

```
Step 1: Data Collection
   └─ Upload CSV dataset (CICIDS2017 or similar)

Step 2: Data Preprocessing
   ├─ Strip column whitespace
   ├─ Drop duplicate rows
   ├─ Replace ±Inf with NaN
   ├─ Fill NaN (median for numeric, mode for categorical)
   ├─ Encode categorical features (OrdinalEncoder)
   └─ Scale numeric features (StandardScaler)

Step 3: Label Engineering
   ├─ Auto-detect label column
   └─ Binarize: Normal=0, Attack=1

Step 4: Model Training
   ├─ Stratified train/test split (80/20)
   ├─ Build sklearn Pipeline (ColumnTransformer + RF)
   └─ Fit on training data

Step 5: Evaluation
   ├─ Accuracy, Precision, Recall, F1-Score
   └─ Confusion Matrix, Classification Report

Step 6: Save & Deploy
   ├─ Save pipeline → intrusion_model.pkl
   └─ Save metrics → model_metadata.json

Step 7: Prediction
   ├─ Upload new traffic CSV
   ├─ Apply same preprocessing pipeline
   ├─ Predict: Normal or Attack
   ├─ Score: Confidence % + Risk Level
   └─ Download results as CSV
```

---

## 🔧 Installation

### Prerequisites
- Python 3.9 or higher
- pip (Python package manager)

### Steps

**1. Navigate to the project folder:**
```bash
cd "AI project/nids-streamlit"
```

**2. (Recommended) Create a virtual environment:**
```bash
python -m venv venv

# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate
```

**3. Install dependencies:**
```bash
pip install -r requirements.txt
```

---

## 🚀 How to Run

```bash
streamlit run app.py
```

The dashboard will open automatically at: **http://localhost:8501**

---

## 📘 User Guide

### How to Upload a Dataset
1. Go to **🤖 Train Model** in the sidebar.
2. Select **📂 Upload CSV Dataset**.
3. Upload your CICIDS2017 CSV file.
4. The app auto-detects the label column (or you can select it manually).

### How to Train the Model
1. Confirm the label column.
2. Adjust training settings (test size, number of trees).
3. Click **🚀 Train Model**.
4. View accuracy, precision, recall, F1, and confusion matrix.

### How to Run in Demo Mode (No Dataset Needed)
1. Go to **🤖 Train Model**.
2. Select **🎭 Demo Mode (Synthetic Data)**.
3. Click **⚡ Generate Synthetic Dataset**.
4. Click **🚀 Train Model**.

### How to Make Predictions (Intrusion Detection)
1. Go to **🔍 Intrusion Detection**.
2. Upload a CSV of unlabelled network traffic records.
3. Click **🔍 Analyze Traffic**.
4. View results: Normal / Attack + Risk Level + Confidence.
5. Click **⬇️ Download** to export results.

---

## 📊 Results & Evaluation

### Metrics Explained

| Metric | What it Means |
|---|---|
| **Accuracy** | % of all predictions that were correct |
| **Precision** | Of predicted attacks, what % were actually attacks |
| **Recall** | Of all actual attacks, what % did we catch |
| **F1-Score** | Harmonic mean of Precision and Recall |
| **Confusion Matrix** | Grid showing True/False Positives and Negatives |

> **Note:** In security, **Recall** is critical — missing an attack (False Negative) is more dangerous than a false alarm (False Positive).

---

## 📦 Modules Explained

| Module | File | Purpose |
|---|---|---|
| **Data Preprocessing** | `src/data_preprocessing.py` | Load, clean, encode, scale data |
| **Model Training** | `src/train_model.py` | Train RF, evaluate, save |
| **Prediction** | `src/prediction.py` | Load model, predict, risk levels |
| **Dashboard** | `app.py` | Streamlit UI with all 5 pages |

### Dashboard Pages
| Page | Description |
|---|---|
| 🏠 Overview | System stats, traffic split chart |
| 📊 Traffic Analysis | Interactive Plotly charts |
| 🤖 Train Model | Upload dataset, configure, train, evaluate |
| 🔍 Intrusion Detection | Upload traffic → detect → download results |
| ℹ️ Model Info | Algorithm details, feature importance |

---

## ✅ Advantages

1. **No Paid APIs** — Completely free, runs locally on any laptop.
2. **Dataset Flexible** — Works with CICIDS2017, NSL-KDD, UNSW-NB15, or any labelled CSV.
3. **Demo Mode** — Can be demonstrated without downloading any dataset.
4. **Robust Preprocessing** — Handles messy real-world data automatically.
5. **Visual Dashboard** — Professional charts for college presentations.
6. **Downloadable Reports** — Export predictions for submission.
7. **Educational** — Clean, commented code suitable for learning.

---

## ⚠️ Limitations

1. **Static Model** — Does not retrain automatically as new data arrives (batch learning only).
2. **No Real-Time Capture** — Does not capture live network packets; requires CSV input.
3. **Synthetic Demo Data** — Synthetic dataset does not perfectly represent real threats.
4. **Single Algorithm** — Only Random Forest is implemented; no deep learning.
5. **Binary Output** — Primary output is Normal/Attack; multi-class support is visualization only.
6. **Not Production-Grade** — For educational demonstration only.

---

## 🔭 Future Scope

1. **Real-Time Packet Capture** — Integrate Scapy or PyShark for live traffic analysis.
2. **Deep Learning** — Add LSTM or Autoencoder for anomaly-based detection.
3. **Multiple Algorithms** — Compare RF, XGBoost, SVM, Neural Networks.
4. **Auto-Retraining** — Scheduled model retraining with new data.
5. **Alert System** — Email/SMS notifications when attacks are detected.
6. **Database Integration** — Store prediction history in SQLite/PostgreSQL.
7. **API Endpoint** — Expose predictions via a REST API (FastAPI/Flask).
8. **Cloud Deployment** — Deploy on Streamlit Cloud, Heroku, or AWS.
9. **Explainability (XAI)** — Add SHAP values for model interpretability.
10. **Multi-Class Output** — Predict specific attack type (DoS, PortScan, etc.).

---

## 🏁 Conclusion

This project successfully demonstrates how **Artificial Intelligence and Machine Learning** can be applied to **Network Security** to automatically detect intrusions in network traffic.

The system:
- Achieves strong classification performance on benchmark datasets.
- Handles real-world data challenges (missing values, class imbalance, etc.).
- Provides an intuitive, professional dashboard suitable for demonstrations.
- Requires no paid services and runs entirely offline.

The AI-Powered NIDS serves as an excellent foundation for more advanced cybersecurity research and can be extended with real-time capture, deep learning, and cloud deployment in future work.

---

## 📚 References

1. CICIDS2017 Dataset — University of New Brunswick: https://www.unb.ca/cic/datasets/ids-2017.html
2. Scikit-learn Documentation: https://scikit-learn.org/stable/
3. Streamlit Documentation: https://docs.streamlit.io/
4. Plotly Documentation: https://plotly.com/python/
5. NSL-KDD Dataset: https://www.unb.ca/cic/datasets/nsl.html

---

*Made with ❤️ for educational purposes | CSE Mini Project*
