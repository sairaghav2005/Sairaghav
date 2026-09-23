"""
data_preprocessing.py
=====================
Handles all data loading, cleaning, and preprocessing for the
AI-Powered Network Intrusion Detection System.

Responsibilities:
  - Load CSV datasets
  - Auto-detect the label column
  - Handle missing values, infinities, duplicates
  - Encode categorical features
  - Scale numerical features
  - Build a reusable sklearn Pipeline
  - Binarize labels → Normal / Attack
"""

import os
import logging
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, LabelEncoder, OrdinalEncoder
from sklearn.impute import SimpleImputer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Common label column name variants
# ─────────────────────────────────────────────
LABEL_CANDIDATES = [
    "label", "Label", "LABEL",
    "class", "Class", "CLASS",
    "category", "Category", "CATEGORY",
    "attack_cat", "Attack", "attack",
    "traffic_type", "TrafficType",
    " Label",          # CICIDS has a leading space
    "attack_category",
]

# Values that represent normal traffic (case-insensitive)
NORMAL_VALUES = {"normal", "benign", "0", "0.0"}


# ─────────────────────────────────────────────
# Public helpers
# ─────────────────────────────────────────────

def load_csv(filepath: str) -> pd.DataFrame:
    """Load a CSV file and return a DataFrame."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found: {filepath}")
    try:
        df = pd.read_csv(filepath, low_memory=False)
        logger.info(f"Loaded dataset: {df.shape[0]} rows × {df.shape[1]} cols")
        return df
    except Exception as e:
        raise ValueError(f"Could not read CSV file: {e}")


def detect_label_column(df: pd.DataFrame) -> str | None:
    """
    Try to auto-detect the label / target column.
    Returns the column name or None if not found.
    """
    # Exact match first
    for candidate in LABEL_CANDIDATES:
        if candidate in df.columns:
            return candidate

    # Fuzzy: column whose name contains 'label', 'class', or 'attack'
    for col in df.columns:
        lower = col.strip().lower()
        if any(kw in lower for kw in ("label", "class", "attack", "category")):
            return col

    return None


def binarize_labels(series: pd.Series) -> pd.Series:
    """
    Convert multi-class traffic labels to binary:
      Normal → 0   |   Attack → 1
    """
    def _map(val):
        if str(val).strip().lower() in NORMAL_VALUES:
            return 0   # Normal
        return 1       # Attack

    return series.apply(_map)


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    In-place cleaning:
      1. Strip whitespace from column names
      2. Drop full-duplicate rows
      3. Replace ±inf with NaN
      4. Drop columns that are 100% NaN
    """
    # Strip column whitespace
    df.columns = df.columns.str.strip()

    original_rows = len(df)
    df = df.drop_duplicates()
    dropped = original_rows - len(df)
    if dropped:
        logger.info(f"Dropped {dropped} duplicate rows")

    # Inf → NaN for numeric cols
    num_cols = df.select_dtypes(include=[np.number]).columns
    df[num_cols] = df[num_cols].replace([np.inf, -np.inf], np.nan)

    # Drop columns that are entirely NaN
    all_nan = df.columns[df.isnull().all()].tolist()
    if all_nan:
        logger.info(f"Dropping all-NaN columns: {all_nan}")
        df = df.drop(columns=all_nan)

    return df


def split_features_labels(
    df: pd.DataFrame,
    label_col: str,
) -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Returns:
        X           – feature DataFrame
        y_binary    – binary labels (0=Normal, 1=Attack)
        y_original  – original label values (for visualization)
    """
    y_original = df[label_col].copy().astype(str).str.strip()
    y_binary = binarize_labels(y_original)
    X = df.drop(columns=[label_col])
    return X, y_binary, y_original


def build_preprocessing_pipeline(X: pd.DataFrame) -> tuple[ColumnTransformer, list, list]:
    """
    Build a ColumnTransformer that:
      - Imputes + scales numerical columns
      - Imputes + ordinal-encodes categorical columns

    Returns:
        preprocessor  – ColumnTransformer (unfitted)
        num_cols      – list of numerical column names
        cat_cols      – list of categorical column names
    """
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()

    transformers = []

    if num_cols:
        num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ])
        transformers.append(("num", num_pipeline, num_cols))

    if cat_cols:
        cat_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OrdinalEncoder(
                handle_unknown="use_encoded_value",
                unknown_value=-1,
            )),
        ])
        transformers.append(("cat", cat_pipeline, cat_cols))

    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder="drop",   # drop any unexpected columns safely
    )

    logger.info(f"Built pipeline: {len(num_cols)} numeric, {len(cat_cols)} categorical cols")
    return preprocessor, num_cols, cat_cols


def get_feature_names(preprocessor: ColumnTransformer, num_cols: list, cat_cols: list) -> list:
    """Return ordered feature names after ColumnTransformer transform."""
    return num_cols + cat_cols


# ─────────────────────────────────────────────
# CICIDS-style Demo Dataset Generator
# ─────────────────────────────────────────────

# Attack type proportions (share of total attack records)
_ATTACK_MIX = {
    "DoS"       : 0.35,
    "DDoS"      : 0.25,
    "PortScan"  : 0.20,
    "BruteForce": 0.20,
}


def _make_normal(n: int, rng) -> dict:
    """Typical legitimate HTTP/DNS/SSH session patterns."""
    return {
        "Flow_Duration"            : rng.integers(100_000, 50_000_000, n),
        "Total_Fwd_Packets"        : rng.integers(2,   60,  n),
        "Total_Backward_Packets"   : rng.integers(1,   50,  n),
        "Total_Length_Fwd_Packets" : rng.integers(200, 80_000, n),
        "Total_Length_Bwd_Packets" : rng.integers(100, 60_000, n),
        "Fwd_Packet_Length_Mean"   : rng.uniform(40,  1_400,  n),
        "Bwd_Packet_Length_Mean"   : rng.uniform(40,  1_400,  n),
        "Flow_Bytes_s"             : rng.uniform(500, 500_000, n),
        "Flow_Packets_s"           : rng.uniform(1,   500,     n),
        "Packet_Length_Mean"       : rng.uniform(60,  1_400,  n),
        "Packet_Length_Std"        : rng.uniform(5,   600,    n),
        "Average_Packet_Size"      : rng.uniform(60,  1_400,  n),
        "Destination_Port"         : rng.choice([80, 443, 22, 53, 8080, 8443], n),
        "Source_Port"              : rng.integers(1024, 65535, n),
        "Protocol"                 : rng.choice([6, 17], n),  # TCP=6, UDP=17
        "Label"                    : ["NORMAL"] * n,
        "Attack_Type"              : ["NORMAL"] * n,
    }


def _make_dos(n: int, rng) -> dict:
    """DoS: flood of tiny packets, almost no reply, huge pkt/s rate."""
    return {
        "Flow_Duration"            : rng.integers(1_000, 500_000, n),
        "Total_Fwd_Packets"        : rng.integers(200,  2_000, n),
        "Total_Backward_Packets"   : rng.integers(0,    5,     n),
        "Total_Length_Fwd_Packets" : rng.integers(200,  2_000, n),
        "Total_Length_Bwd_Packets" : rng.integers(0,    100,   n),
        "Fwd_Packet_Length_Mean"   : rng.uniform(0.5,  10,    n),
        "Bwd_Packet_Length_Mean"   : rng.uniform(0,    5,     n),
        "Flow_Bytes_s"             : rng.uniform(1_000_000, 50_000_000, n),
        "Flow_Packets_s"           : rng.uniform(10_000,    200_000,    n),
        "Packet_Length_Mean"       : rng.uniform(0.5,  10,    n),
        "Packet_Length_Std"        : rng.uniform(0,    5,     n),
        "Average_Packet_Size"      : rng.uniform(0.5,  10,    n),
        "Destination_Port"         : rng.choice([80, 443, 8080], n),
        "Source_Port"              : rng.integers(1024, 65535, n),
        "Protocol"                 : np.full(n, 6, dtype=int),
        "Label"                    : ["ATTACK"] * n,
        "Attack_Type"              : ["DoS"] * n,
    }


def _make_ddos(n: int, rng) -> dict:
    """DDoS: same as DoS but from many spoofed source ports."""
    d = _make_dos(n, rng)
    d["Source_Port"]  = rng.integers(1, 65535, n)
    d["Flow_Bytes_s"] = rng.uniform(5_000_000, 100_000_000, n)
    d["Label"]        = ["ATTACK"] * n
    d["Attack_Type"]  = ["DDoS"] * n
    return d


def _make_portscan(n: int, rng) -> dict:
    """PortScan: sweeping many distinct destination ports, tiny flows."""
    return {
        "Flow_Duration"            : rng.integers(1_000, 100_000, n),
        "Total_Fwd_Packets"        : rng.integers(1, 3, n),
        "Total_Backward_Packets"   : rng.integers(0, 2, n),
        "Total_Length_Fwd_Packets" : rng.integers(40, 80, n),
        "Total_Length_Bwd_Packets" : rng.integers(0,  40, n),
        "Fwd_Packet_Length_Mean"   : rng.uniform(40, 80,  n),
        "Bwd_Packet_Length_Mean"   : rng.uniform(0,  40,  n),
        "Flow_Bytes_s"             : rng.uniform(200, 5_000, n),
        "Flow_Packets_s"           : rng.uniform(10,  1_000, n),
        "Packet_Length_Mean"       : rng.uniform(40,  80,   n),
        "Packet_Length_Std"        : rng.uniform(0,   10,   n),
        "Average_Packet_Size"      : rng.uniform(40,  80,   n),
        "Destination_Port"         : rng.integers(1, 65535, n),
        "Source_Port"              : rng.integers(1024, 65535, n),
        "Protocol"                 : np.full(n, 6, dtype=int),
        "Label"                    : ["ATTACK"] * n,
        "Attack_Type"              : ["PortScan"] * n,
    }


def _make_bruteforce(n: int, rng) -> dict:
    """BruteForce (SSH/FTP): repeated auth attempts — high pkt count to auth port."""
    return {
        "Flow_Duration"            : rng.integers(500_000, 5_000_000, n),
        "Total_Fwd_Packets"        : rng.integers(10, 80, n),
        "Total_Backward_Packets"   : rng.integers(8,  70, n),
        "Total_Length_Fwd_Packets" : rng.integers(500, 8_000, n),
        "Total_Length_Bwd_Packets" : rng.integers(400, 6_000, n),
        "Fwd_Packet_Length_Mean"   : rng.uniform(50,  120, n),
        "Bwd_Packet_Length_Mean"   : rng.uniform(50,  100, n),
        "Flow_Bytes_s"             : rng.uniform(1_000, 50_000, n),
        "Flow_Packets_s"           : rng.uniform(5,    200,    n),
        "Packet_Length_Mean"       : rng.uniform(50,   120,   n),
        "Packet_Length_Std"        : rng.uniform(5,    40,    n),
        "Average_Packet_Size"      : rng.uniform(50,   120,   n),
        "Destination_Port"         : rng.choice([22, 21, 23, 3389], n),
        "Source_Port"              : rng.integers(1024, 65535, n),
        "Protocol"                 : np.full(n, 6, dtype=int),
        "Label"                    : ["ATTACK"] * n,
        "Attack_Type"              : ["BruteForce"] * n,
    }


def generate_demo_dataset(n_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    """
    ⚠️  DEMO / SYNTHETIC DATA — NOT real network traffic.

    Generates a CICIDS-style network flow dataset with learnable Normal/Attack
    patterns for ML demonstration.  Feature distributions are simplified and
    do NOT represent real-world threat intelligence.

    Parameters
    ----------
    n_samples : total rows (default 5000)
    seed      : reproducibility seed
    """
    rng      = np.random.default_rng(seed)
    n_normal = int(n_samples * 0.60)
    n_attack = n_samples - n_normal

    parts = [pd.DataFrame(_make_normal(n_normal, rng))]

    # Distribute attack records proportionally
    makers    = {"DoS": _make_dos, "DDoS": _make_ddos,
                 "PortScan": _make_portscan, "BruteForce": _make_bruteforce}
    remaining = n_attack
    items     = list(_ATTACK_MIX.items())
    for i, (atype, frac) in enumerate(items):
        cnt = int(n_attack * frac) if i < len(items) - 1 else remaining
        cnt = max(0, min(cnt, remaining))
        if cnt > 0:
            parts.append(pd.DataFrame(makers[atype](cnt, rng)))
        remaining -= cnt

    df = pd.concat(parts, ignore_index=True)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)

    # ~2% missing values in 3 numeric cols (realistic data quality issues)
    for col in ["Flow_Bytes_s", "Packet_Length_Std", "Flow_Duration"]:
        mask = rng.random(len(df)) < 0.02
        df.loc[mask, col] = np.nan

    n_norm = int((df["Label"] == "NORMAL").sum())
    n_atk  = int((df["Label"] == "ATTACK").sum())
    logger.info(
        f"[DEMO DATA] Generated {df.shape[0]} synthetic records "
        f"({n_norm} NORMAL, {n_atk} ATTACK)"
    )
    return df


def generate_synthetic_dataset(n_samples: int = 2000, seed: int = 42) -> pd.DataFrame:
    """Backward-compatible alias → delegates to generate_demo_dataset."""
    return generate_demo_dataset(n_samples=n_samples, seed=seed)
