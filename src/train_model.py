"""
train_model.py
==============
Trains a Random Forest classifier on network intrusion detection data.

Workflow:
  1. Load and clean the dataset
  2. Auto-detect or prompt for the label column
  3. Build preprocessing pipeline
  4. Stratified train/test split
  5. Train Random Forest inside a full sklearn Pipeline
  6. Evaluate: accuracy, precision, recall, F1, confusion matrix
  7. Save model + preprocessor pipeline + metadata
"""

import os
import json
import logging
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report,
)

from src.data_preprocessing import (
    clean_dataframe,
    detect_label_column,
    split_features_labels,
    build_preprocessing_pipeline,
    get_feature_names,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_PATH        = os.path.join(MODELS_DIR, "intrusion_model.pkl")
PIPELINE_PATH     = os.path.join(MODELS_DIR, "preprocessing_pipeline.pkl")
METADATA_PATH     = os.path.join(MODELS_DIR, "model_metadata.json")


# ─────────────────────────────────────────────
# Core training function
# ─────────────────────────────────────────────

def train(
    df: pd.DataFrame,
    label_col: str,
    test_size: float = 0.2,
    n_estimators: int = 100,
    random_state: int = 42,
    class_weight: str = "balanced",
    progress_callback=None,   # optional callable(message: str)
) -> dict:
    """
    Train a Random Forest classifier and save artefacts.

    Parameters
    ----------
    df              : cleaned input DataFrame (must contain label_col)
    label_col       : name of the target column
    test_size       : fraction used for evaluation
    n_estimators    : number of RF trees
    random_state    : reproducibility seed
    class_weight    : 'balanced' handles class imbalance automatically
    progress_callback : optional function(str) to report progress steps

    Returns
    -------
    dict with keys: accuracy, precision, recall, f1, confusion_matrix,
                    classification_report, feature_names, n_train, n_test,
                    model_path, pipeline_path, trained_at
    """

    def _log(msg: str):
        logger.info(msg)
        if progress_callback:
            progress_callback(msg)

    _log("Step 1/7 — Cleaning dataset …")
    df = clean_dataframe(df)

    _log("Step 2/7 — Splitting features and labels …")
    X, y_binary, y_original = split_features_labels(df, label_col)

    # Drop any secondary label/identifier columns that are NOT real features.
    # These would leak information and would not be present at prediction time.
    SECONDARY_LABEL_COLS = {"Attack_Type", "attack_type", "attack_cat", "category"}
    secondary_to_drop = [c for c in X.columns if c in SECONDARY_LABEL_COLS]
    if secondary_to_drop:
        logger.info(f"Excluding secondary label columns from features: {secondary_to_drop}")
        X = X.drop(columns=secondary_to_drop)

    if len(X) < 50:
        raise ValueError("Dataset too small — need at least 50 rows to train.")

    _log("Step 3/7 — Building preprocessing pipeline …")
    preprocessor, num_cols, cat_cols = build_preprocessing_pipeline(X)
    feature_names = get_feature_names(preprocessor, num_cols, cat_cols)

    _log("Step 4/7 — Stratified train/test split …")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_binary,
        test_size=test_size,
        random_state=random_state,
        stratify=y_binary,
    )

    _log(f"  Training rows : {len(X_train)}")
    _log(f"  Test rows     : {len(X_test)}")

    _log("Step 5/7 — Training Random Forest …")
    rf_clf = RandomForestClassifier(
        n_estimators=n_estimators,
        class_weight=class_weight,
        random_state=random_state,
        n_jobs=-1,   # use all CPU cores
    )

    # Full pipeline: preprocess → classify
    full_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier",   rf_clf),
    ])

    full_pipeline.fit(X_train, y_train)
    _log("  Model training complete.")

    _log("Step 6/7 — Evaluating model …")
    y_pred = full_pipeline.predict(X_test)

    # Probabilities (for confidence scores)
    try:
        y_prob = full_pipeline.predict_proba(X_test)[:, 1]
    except Exception:
        y_prob = None

    accuracy  = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall    = recall_score(y_test, y_pred, zero_division=0)
    f1        = f1_score(y_test, y_pred, zero_division=0)
    cm        = confusion_matrix(y_test, y_pred).tolist()
    report    = classification_report(
        y_test, y_pred,
        target_names=["Normal", "Attack"],
        zero_division=0,
    )

    _log(f"  Accuracy  : {accuracy:.4f}")
    _log(f"  Precision : {precision:.4f}")
    _log(f"  Recall    : {recall:.4f}")
    _log(f"  F1-Score  : {f1:.4f}")

    _log("Step 7/7 — Saving model and pipeline …")

    # Extract fitted RF from pipeline for feature importance
    fitted_rf = full_pipeline.named_steps["classifier"]

    # Compute feature importance (aligned to feature_names)
    importances = fitted_rf.feature_importances_
    # Guard against length mismatch (e.g. if ColumnTransformer dropped cols)
    n_features = len(importances)
    if len(feature_names) > n_features:
        feature_names = feature_names[:n_features]
    elif len(feature_names) < n_features:
        feature_names = feature_names + [f"feature_{i}" for i in range(len(feature_names), n_features)]

    fi_dict = dict(zip(feature_names, importances.tolist()))

    # Metadata
    trained_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    metadata = {
        "algorithm"         : "Random Forest Classifier",
        "n_estimators"      : n_estimators,
        "n_train"           : len(X_train),
        "n_test"            : len(X_test),
        "n_features"        : n_features,
        "feature_names"     : feature_names,
        "label_column"      : label_col,
        "num_columns"       : num_cols,
        "cat_columns"       : cat_cols,
        "accuracy"          : round(accuracy, 4),
        "precision"         : round(precision, 4),
        "recall"            : round(recall, 4),
        "f1"                : round(f1, 4),
        "confusion_matrix"  : cm,
        "feature_importance": fi_dict,
        "trained_at"        : trained_at,
        "class_weight"      : class_weight,
    }

    joblib.dump(full_pipeline, MODEL_PATH)
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    _log(f"  Model saved   → {MODEL_PATH}")
    _log(f"  Metadata saved→ {METADATA_PATH}")

    return {
        "accuracy"              : accuracy,
        "precision"             : precision,
        "recall"                : recall,
        "f1"                    : f1,
        "confusion_matrix"      : cm,
        "classification_report" : report,
        "feature_importance"    : fi_dict,
        "feature_names"         : feature_names,
        "n_train"               : len(X_train),
        "n_test"                : len(X_test),
        "model_path"            : MODEL_PATH,
        "trained_at"            : trained_at,
    }


# ─────────────────────────────────────────────
# Load saved artefacts
# ─────────────────────────────────────────────

def load_model() -> tuple:
    """
    Load the trained pipeline and metadata.

    Returns
    -------
    (pipeline, metadata)  or raises FileNotFoundError
    """
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"No trained model found at {MODEL_PATH}. "
            "Please train the model first."
        )
    if not os.path.exists(METADATA_PATH):
        raise FileNotFoundError(
            f"No metadata found at {METADATA_PATH}. "
            "Please retrain the model."
        )

    pipeline = joblib.load(MODEL_PATH)
    with open(METADATA_PATH, "r") as f:
        metadata = json.load(f)

    logger.info(f"Model loaded from {MODEL_PATH}")
    return pipeline, metadata


def model_exists() -> bool:
    """Return True if a trained model is available."""
    return os.path.exists(MODEL_PATH) and os.path.exists(METADATA_PATH)
