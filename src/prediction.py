"""
prediction.py
=============
Loads the saved Random Forest pipeline and applies it to new network
traffic data to produce:
  - Binary predictions  (0 = Normal, 1 = Attack)
  - Confidence scores   (probability of being an attack)
  - Risk levels         (Low / Medium / High)
"""

import logging
import numpy as np
import pandas as pd

from src.train_model import load_model
from src.data_preprocessing import clean_dataframe

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Risk level thresholds
# ─────────────────────────────────────────────
RISK_LOW_THRESHOLD    = 0.30   # confidence < 30% → Low Risk
RISK_MEDIUM_THRESHOLD = 0.60   # confidence 30–60% → Medium Risk
# confidence ≥ 60% + prediction = Attack → High Risk


def _assign_risk(prediction: int, confidence: float) -> str:
    """
    Assign a qualitative risk level.

    Note: These are application-defined indicators for demonstration
    purposes only — not a substitute for professional security systems.
    """
    if prediction == 0:
        # Normal traffic
        if confidence < RISK_MEDIUM_THRESHOLD:
            return "Low"
        else:
            return "Medium"   # uncertain normal — flag for review
    else:
        # Attack prediction
        if confidence >= RISK_MEDIUM_THRESHOLD:
            return "High"
        else:
            return "Medium"


def predict(df_input: pd.DataFrame) -> pd.DataFrame:
    """
    Run the trained model on new traffic data.

    Parameters
    ----------
    df_input : DataFrame of raw network traffic features
               (must NOT contain the label column — raw features only)

    Returns
    -------
    DataFrame with columns:
        Record, Prediction, Confidence, Risk_Level
    """
    # ── Load model ────────────────────────────────────────────────────
    try:
        pipeline, metadata = load_model()
    except FileNotFoundError as e:
        raise RuntimeError(str(e))

    # ── Validate & align columns ───────────────────────────────────────
    expected_num = metadata.get("num_columns", [])
    expected_cat = metadata.get("cat_columns", [])
    expected_all = expected_num + expected_cat

    # Strip whitespace from incoming column names
    df_input = df_input.copy()
    df_input.columns = df_input.columns.str.strip()

    # Drop the label column if it was accidentally included
    label_col = metadata.get("label_column", "")
    if label_col and label_col in df_input.columns:
        logger.info(f"Dropping label column '{label_col}' from prediction input.")
        df_input = df_input.drop(columns=[label_col])

    # Report missing columns (model will handle via pipeline's remainder='drop')
    missing = [c for c in expected_all if c not in df_input.columns]
    if missing:
        logger.warning(f"Missing expected columns (will use NaN): {missing[:10]}")
        for col in missing:
            df_input[col] = np.nan

    # Retain only columns the model knows about
    valid_cols = [c for c in expected_all if c in df_input.columns]
    df_aligned = df_input[valid_cols].copy()

    # ── Clean ──────────────────────────────────────────────────────────
    df_aligned = clean_dataframe(df_aligned)

    if df_aligned.empty:
        raise ValueError("After cleaning, the dataset is empty. Check your CSV file.")

    # ── Predict ────────────────────────────────────────────────────────
    predictions = pipeline.predict(df_aligned)

    # Confidence = P(Attack)
    try:
        probabilities = pipeline.predict_proba(df_aligned)[:, 1]
    except Exception:
        # Fallback: 1.0 for attacks, 0.0 for normal
        probabilities = predictions.astype(float)

    # ── Build results DataFrame ─────────────────────────────────────────
    results = []
    for i, (pred, prob) in enumerate(zip(predictions, probabilities), start=1):
        label    = "ATTACK"  if pred == 1 else "NORMAL"
        risk     = _assign_risk(int(pred), float(prob))
        confidence_pct = round(float(prob) * 100, 1)
        results.append({
            "Record"     : i,
            "Prediction" : label,
            "Confidence" : f"{confidence_pct}%",
            "Risk_Level" : risk,
        })

    result_df = pd.DataFrame(results)
    logger.info(
        f"Predictions: {(predictions==1).sum()} attacks, "
        f"{(predictions==0).sum()} normal out of {len(predictions)} records"
    )
    return result_df


def predict_single(record: dict) -> dict:
    """
    Predict for a single network record (dict of feature → value).

    Returns a dict with keys: prediction, confidence, risk_level.
    """
    df = pd.DataFrame([record])
    result_df = predict(df)
    row = result_df.iloc[0]
    return {
        "prediction" : row["Prediction"],
        "confidence" : row["Confidence"],
        "risk_level" : row["Risk_Level"],
    }
