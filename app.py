"""
app.py
======
🛡️ AI-Powered Network Intrusion Detection & Security Dashboard
A Streamlit-based cybersecurity mini project for college demonstration.

Run with:
    streamlit run app.py
"""

import os
import sys
import io
import json
import time
import logging
from datetime import datetime
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# ── ensure src/ is importable ───────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.data_preprocessing import (
    load_csv,
    detect_label_column,
    clean_dataframe,
    generate_synthetic_dataset,
    generate_demo_dataset,
    binarize_labels,
)
from src.train_model import train, load_model, model_exists
from src.prediction import predict

logging.basicConfig(level=logging.WARNING)

# ────────────────────────────────────────────────────────────────────────────
# Page configuration
# ────────────────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AI Network Intrusion Detection",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ────────────────────────────────────────────────────────────────────────────
# Custom CSS  — clean light theme, dark readable text
# ────────────────────────────────────────────────────────────────────────────
CUSTOM_CSS = """
<style>
/* ── Global background & text ────────────────────────────────────── */
[data-testid="stAppViewContainer"] {
    background: #f0f4f8;
    color: #1a202c;
}
[data-testid="stAppViewBlock"] {
    background: #f0f4f8;
}

/* ── Sidebar ──────────────────────────────────────────────────────── */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #1e3a5f 0%, #163256 100%);
    border-right: 2px solid #2a5f8f;
}
[data-testid="stSidebar"] * {
    color: #e8f0fe !important;
}
[data-testid="stSidebar"] .stRadio label {
    color: #c8d8f0 !important;
    font-size: 0.95rem;
}

/* ── Main content area ────────────────────────────────────────────── */
[data-testid="stMain"] {
    background: #f0f4f8;
}

/* ── Headings ─────────────────────────────────────────────────────── */
h1, h2, h3, h4 {
    color: #1a202c !important;
    font-weight: 700;
}
h1 { font-size: 1.8rem !important; }
h2 { font-size: 1.3rem !important; }

/* ── Body text ────────────────────────────────────────────────────── */
p, li, label, span, div {
    color: #2d3748;
}

/* ── Stat cards ───────────────────────────────────────────────────── */
.stat-card {
    background: #ffffff;
    border: 1px solid #cbd5e0;
    border-radius: 14px;
    padding: 20px 16px;
    text-align: center;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.13);
}
.stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: #1e3a5f;
    margin: 6px 0;
}
.stat-label {
    font-size: 0.78rem;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-weight: 600;
}
.stat-icon { font-size: 1.6rem; margin-bottom: 4px; }

/* ── Badge styles ─────────────────────────────────────────────────── */
.badge-normal {
    background: #c6f6d5;
    color: #22543d;
    border: 1px solid #48bb78;
    border-radius: 8px;
    padding: 4px 12px;
    font-weight: 700;
}
.badge-attack {
    background: #fed7d7;
    color: #742a2a;
    border: 1px solid #fc8181;
    border-radius: 8px;
    padding: 4px 12px;
    font-weight: 700;
}
.badge-high {
    background: #fed7d7;
    color: #742a2a;
    border: 1px solid #fc8181;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 0.8rem;
    font-weight: 700;
}
.badge-medium {
    background: #fefcbf;
    color: #744210;
    border: 1px solid #f6ad55;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 0.8rem;
    font-weight: 700;
}
.badge-low {
    background: #c6f6d5;
    color: #22543d;
    border: 1px solid #48bb78;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 0.8rem;
    font-weight: 700;
}

/* ── Section headers ──────────────────────────────────────────────── */
.section-header {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e3a5f;
    border-bottom: 3px solid #4299e1;
    padding-bottom: 8px;
    margin: 20px 0 12px 0;
}

/* ── Info & Warning boxes ─────────────────────────────────────────── */
.info-box {
    background: #ebf8ff;
    border-left: 5px solid #3182ce;
    border-radius: 6px;
    padding: 14px 18px;
    margin: 10px 0;
    font-size: 0.92rem;
    color: #2c5282;
    font-weight: 500;
}
.warning-box {
    background: #fffbeb;
    border-left: 5px solid #f6ad55;
    border-radius: 6px;
    padding: 14px 18px;
    margin: 10px 0;
    font-size: 0.92rem;
    color: #744210;
    font-weight: 500;
}

/* ── Streamlit buttons ────────────────────────────────────────────── */
.stButton>button {
    background: linear-gradient(135deg, #2b6cb0, #3182ce);
    color: #ffffff !important;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.95rem;
    padding: 8px 20px;
    transition: all 0.2s;
}
.stButton>button:hover {
    background: linear-gradient(135deg, #2c5282, #2b6cb0);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(49,130,206,0.4);
}

/* ── Metrics ──────────────────────────────────────────────────────── */
[data-testid="stMetric"] {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px;
}
[data-testid="stMetricLabel"] { color: #4a5568 !important; font-weight: 600; }
[data-testid="stMetricValue"] { color: #1e3a5f !important; font-weight: 800; }

/* ── DataFrames ───────────────────────────────────────────────────── */
[data-testid="stDataFrame"] {
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

/* ── Expanders ────────────────────────────────────────────────────── */
[data-testid="stExpander"] {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

/* ── Radio buttons ────────────────────────────────────────────────── */
.stRadio > div { gap: 8px; }
.stRadio label { color: #2d3748 !important; font-weight: 500; }

/* ── Select boxes & inputs ────────────────────────────────────────── */
.stSelectbox > div > div,
.stTextInput > div > div input,
.stNumberInput > div > div input {
    background: #ffffff !important;
    color: #1a202c !important;
    border: 1px solid #cbd5e0 !important;
    border-radius: 6px;
}

/* ── Sliders ──────────────────────────────────────────────────────── */
.stSlider [data-baseweb="slider"] {
    background: #bee3f8;
}

/* ── Tabs and misc ────────────────────────────────────────────────── */
.stTabs [data-baseweb="tab"] { color: #2d3748 !important; }
.stInfo    { background: #ebf8ff; color: #2c5282; border-color: #3182ce; }
.stSuccess { background: #f0fff4; color: #22543d; border-color: #48bb78; }
.stWarning { background: #fffbeb; color: #744210; border-color: #f6ad55; }
.stError   { background: #fff5f5; color: #742a2a; border-color: #fc8181; }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


# ────────────────────────────────────────────────────────────────────────────
# Constants / Paths
# ────────────────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
DATA_DIR      = os.path.join(BASE_DIR, "data")
MODELS_DIR    = os.path.join(BASE_DIR, "models")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")
DEMO_CSV_PATH = os.path.join(DATA_DIR, "demo_network_traffic.csv")   # saved demo dataset
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

PLOTLY_THEME  = "plotly_white"
COLORS_NORMAL = "#38a169"   # green — readable on white
COLORS_ATTACK = "#e53e3e"   # red — readable on white

# ────────────────────────────────────────────────────────────────────────────
# Session state helpers
# ────────────────────────────────────────────────────────────────────────────

def _init_state():
    defaults = {
        "trained_df"       : None,   # DataFrame used for training
        "label_col"        : None,
        "train_results"    : None,   # dict returned by train()
        "demo_mode"        : False,
        "model_loaded"     : False,
        "metadata"         : None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


_init_state()


# ── Auto-train on first startup (needed for Streamlit Cloud deployment) ──────
# On cloud, the filesystem resets every restart, so we auto-generate demo
# data and train the model if no saved model is found.
def _auto_train_if_needed():
    if model_exists():
        return   # model already trained — nothing to do
    if st.session_state.get("_auto_trained"):
        return   # already attempted this session
    st.session_state["_auto_trained"] = True
    try:
        from src.data_preprocessing import generate_demo_dataset
        from src.train_model import train as _train
        df = generate_demo_dataset(n_samples=5000, seed=42)
        os.makedirs(DATA_DIR,   exist_ok=True)
        os.makedirs(MODELS_DIR, exist_ok=True)
        df.to_csv(os.path.join(DATA_DIR, "demo_network_traffic.csv"), index=False)
        results = _train(df=df, label_col="Label",
                         test_size=0.2, n_estimators=100, random_state=42)
        st.session_state["trained_df"]   = df
        st.session_state["label_col"]    = "Label"
        st.session_state["train_results"] = results
    except Exception:
        pass   # fail silently — user can always train manually

_auto_train_if_needed()


# ────────────────────────────────────────────────────────────────────────────
# Utility helpers
# ────────────────────────────────────────────────────────────────────────────

@st.cache_data(show_spinner=False)
def _cached_load_metadata(mtime: float) -> dict | None:
    """
    Load model_metadata.json from disk — cached by file modification time.
    The `mtime` argument busts the cache whenever the file is updated
    (i.e. after a new model is trained).  This runs at most once per file
    change instead of on every Streamlit rerun.
    """
    try:
        with open(METADATA_PATH, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


@st.cache_resource(show_spinner=False)
def _cached_load_model(mtime: float):
    """
    Load the trained sklearn pipeline from disk — cached as a resource.
    Heavy joblib.load() runs only once per server session (or after retraining).
    The `mtime` arg busts the cache when the model file changes.
    """
    try:
        import joblib
        from src.train_model import MODEL_PATH
        return joblib.load(MODEL_PATH)
    except Exception:
        return None


def _try_load_metadata():
    """
    Load metadata into session state, using the disk cache.
    Only does real I/O when the metadata file has changed.
    """
    if not os.path.exists(METADATA_PATH):
        return
    # Use file mtime as cache key — cache busts only on retraining
    mtime = os.path.getmtime(METADATA_PATH)
    data  = _cached_load_metadata(mtime)
    if data is not None:
        st.session_state.metadata    = data
        st.session_state.model_loaded = True


def _stat_card(icon: str, label: str, value):
    st.markdown(
        f"""
        <div class="stat-card">
            <div class="stat-icon">{icon}</div>
            <div class="stat-value">{value}</div>
            <div class="stat-label">{label}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _section(title: str):
    st.markdown(f'<div class="section-header">{title}</div>', unsafe_allow_html=True)


def _plotly_pie(labels, values, title, colors=None):
    colors = colors or [COLORS_NORMAL, COLORS_ATTACK]
    fig = px.pie(
        names=labels,
        values=values,
        title=title,
        color_discrete_sequence=colors,
        template=PLOTLY_THEME,
        hole=0.4,
    )
    fig.update_layout(
        paper_bgcolor="rgba(255,255,255,0)",
        plot_bgcolor ="rgba(255,255,255,0)",
        font_color   ="#2d3748",
        title_font   =dict(color="#1e3a5f", size=15),
        legend_font  =dict(color="#2d3748"),
        margin       =dict(t=50, b=20, l=20, r=20),
    )
    return fig


def _plotly_bar(x, y, title, xlabel="", ylabel="", color="#3182ce", horizontal=False):
    if horizontal:
        fig = px.bar(
            x=y, y=x,
            orientation="h",
            title=title,
            template=PLOTLY_THEME,
            color_discrete_sequence=[color],
        )
        fig.update_layout(xaxis_title=ylabel, yaxis_title=xlabel)
    else:
        fig = px.bar(
            x=x, y=y,
            title=title,
            template=PLOTLY_THEME,
            color_discrete_sequence=[color],
        )
        fig.update_layout(xaxis_title=xlabel, yaxis_title=ylabel)
    fig.update_layout(
        paper_bgcolor="rgba(255,255,255,0)",
        plot_bgcolor ="rgba(255,255,255,0.8)",
        font_color   ="#2d3748",
        title_font   =dict(color="#1e3a5f", size=15),
        margin       =dict(t=50, b=40, l=40, r=20),
    )
    return fig


def _plotly_confusion(cm_list):
    cm = np.array(cm_list)
    labels = ["Normal", "Attack"]
    z_text = [[str(v) for v in row] for row in cm]

    fig = go.Figure(go.Heatmap(
        z    = cm,
        x    = labels,
        y    = labels,
        text = z_text,
        texttemplate="%{text}",
        colorscale  ="Blues",
        showscale   =True,
    ))
    fig.update_layout(
        title      ="Confusion Matrix",
        xaxis_title="Predicted",
        yaxis_title="Actual",
        template   =PLOTLY_THEME,
        paper_bgcolor="rgba(255,255,255,0)",
        plot_bgcolor ="rgba(255,255,255,0.8)",
        font_color  ="#2d3748",
        title_font  =dict(color="#1e3a5f", size=15),
        margin      =dict(t=50, b=40, l=60, r=20),
    )
    return fig



# ────────────────────────────────────────────────────────────────────────────
# Sidebar navigation
# ────────────────────────────────────────────────────────────────────────────

def _sidebar():
    st.sidebar.markdown(
        """
        <div style="text-align:center; padding:20px 0 12px 0;">
            <div style="font-size:2.8rem; line-height:1;">🛡️</div>
            <div style="font-size:1.05rem; font-weight:800; color:#ffffff;
                        letter-spacing:0.04em; margin-top:6px;">NIDS Dashboard</div>
            <div style="font-size:0.72rem; color:#93b4d4; margin-top:2px;
                        letter-spacing:0.06em; text-transform:uppercase;">
                Network Intrusion Detection
            </div>
        </div>
        <hr style="border:none; border-top:1px solid #2a5f8f; margin:4px 0 16px 0;">
        """,
        unsafe_allow_html=True,
    )

    pages = {
        "🏠  Overview"            : "overview",
        "📊  Traffic Analysis"    : "analysis",
        "🤖  Train Model"         : "train",
        "🔍  Intrusion Detection" : "detect",
    }
    page = st.sidebar.radio("Navigation", list(pages.keys()), label_visibility="collapsed")

    st.sidebar.markdown("<hr style='border:none;border-top:1px solid #2a5f8f;margin:16px 0 12px 0;'>",
                        unsafe_allow_html=True)

    # Model status pill
    if model_exists():
        st.sidebar.markdown(
            """
            <div style="background:#1a4a2a; border:1px solid #48bb78; border-radius:20px;
                        padding:6px 14px; text-align:center; font-size:0.8rem;
                        color:#9ae6b4; font-weight:600;">
                ✅ Model Trained &amp; Ready
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.session_state.metadata is None:
            _try_load_metadata()
    else:
        st.sidebar.markdown(
            """
            <div style="background:#3a2a0a; border:1px solid #f6ad55; border-radius:20px;
                        padding:6px 14px; text-align:center; font-size:0.8rem;
                        color:#fbd38d; font-weight:600;">
                ⚠️ No Model Trained Yet
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.sidebar.markdown(
        """
        <div style="margin-top:32px; padding:10px 12px; background:rgba(0,0,0,0.2);
                    border-radius:8px; font-size:0.7rem; color:#6a8aaa;
                    text-align:center; line-height:1.6;">
            🎓 Educational Project<br>
            Not for production use.<br>
            <span style="color:#4a6a8a;">CSE / Data Science Mini Project</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    return pages[page]


# ────────────────────────────────────────────────────────────────────────────
# PAGE 1 — Overview
# ────────────────────────────────────────────────────────────────────────────

def page_overview():
    # ── Professional hero header ───────────────────────────────────────────
    st.markdown(
        """
        <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2b6cb0 100%);
                    border-radius:14px; padding:28px 32px; margin-bottom:24px;">
            <div style="display:flex; align-items:center; gap:16px;">
                <span style="font-size:3rem;">🛡️</span>
                <div>
                    <div style="font-size:1.55rem; font-weight:800; color:#ffffff;
                                letter-spacing:0.01em; line-height:1.2;">
                        AI-Powered Network Intrusion Detection
                    </div>
                    <div style="font-size:0.92rem; color:#bee3f8; margin-top:6px;">
                        Random Forest Classifier &nbsp;•&nbsp; Real-time Threat Analysis &nbsp;•&nbsp;
                        Educational Demo Platform
                    </div>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    df   = st.session_state.get("trained_df")
    meta = st.session_state.get("metadata")

    # ── Stat cards ─────────────────────────────────────────────────────────
    if df is not None and st.session_state.label_col:
        lc      = st.session_state.label_col
        y_bin   = binarize_labels(df[lc].astype(str).str.strip())
        total   = len(df)
        normal  = int((y_bin == 0).sum())
        attack  = int((y_bin == 1).sum())
        pct     = f"{attack/total*100:.1f}%" if total else "—"
        acc_str = f"{meta['accuracy']*100:.1f}%" if meta else "—"
    else:
        total, normal, attack, pct, acc_str = "N/A", "—", "—", "—", "—"

    col1, col2, col3, col4, col5 = st.columns(5)
    with col1: _stat_card("📡", "Total Records",  total  if total  != "N/A" else "N/A")
    with col2: _stat_card("✅", "Normal Traffic",  f"{normal:,}" if isinstance(normal, int) else "—")
    with col3: _stat_card("🚨", "Attack Traffic",  f"{attack:,}" if isinstance(attack, int) else "—")
    with col4: _stat_card("⚡", "Attack Rate",     pct)
    with col5: _stat_card("🎯", "Model Accuracy",  acc_str)

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Charts row ─────────────────────────────────────────────────────────
    if df is not None and isinstance(normal, int):
        col_a, col_b = st.columns([1, 2])
        with col_a:
            st.markdown(
                "<div style='font-size:1rem;font-weight:700;color:#1e3a5f;"
                "margin-bottom:8px;'>Traffic Split</div>",
                unsafe_allow_html=True,
            )
            fig = _plotly_pie(
                ["Normal", "Attack"], [normal, attack],
                "",
                colors=[COLORS_NORMAL, COLORS_ATTACK],
            )
            st.plotly_chart(fig, use_container_width=True)
        with col_b:
            st.markdown(
                "<div style='font-size:1rem;font-weight:700;color:#1e3a5f;"
                "margin-bottom:8px;'>Category Distribution</div>",
                unsafe_allow_html=True,
            )
            lc    = st.session_state.label_col
            cats  = df[lc].astype(str).str.strip().value_counts()
            fig2  = _plotly_bar(
                cats.index.tolist(), cats.values.tolist(),
                "", xlabel="Category", ylabel="Count",
                color="#3182ce",
            )
            st.plotly_chart(fig2, use_container_width=True)
    else:
        st.markdown(
            """
            <div style="background:#ebf8ff; border:1px solid #90cdf4; border-radius:10px;
                        padding:16px 20px; color:#2c5282; font-weight:500;">
                📂 <strong>No dataset loaded yet.</strong><br>
                Go to <strong>🤖 Train Model</strong> in the sidebar to generate a demo dataset
                and train the model — takes under 30 seconds.
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # ── How It Works ───────────────────────────────────────────────────────
    st.markdown(
        "<div style='font-size:1.1rem;font-weight:800;color:#1e3a5f;"
        "border-bottom:3px solid #4299e1;padding-bottom:8px;margin-bottom:16px;'>"
        "🔄 How It Works</div>",
        unsafe_allow_html=True,
    )
    steps = [
        ("📂", "Upload / Generate", "Load a CSV dataset or generate synthetic demo data"),
        ("🧹", "Preprocess",        "Clean, encode, and scale all features automatically"),
        ("🤖", "Train RF Model",    "Random Forest with 100 trees, stratified 80/20 split"),
        ("📊", "Evaluate",          "Accuracy, Precision, Recall, F1, Confusion Matrix"),
        ("🔍", "Detect Threats",    "Run predictions → NORMAL / ATTACK + Risk Level"),
        ("⬇️", "Export Results",    "Download full prediction table as CSV report"),
    ]
    cols = st.columns(len(steps))
    for col, (icon, title, desc) in zip(cols, steps):
        with col:
            st.markdown(
                f"""
                <div style="background:#ffffff; border:1px solid #e2e8f0;
                            border-top:3px solid #4299e1; border-radius:10px;
                            padding:16px 12px; text-align:center;
                            box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                    <div style="font-size:1.6rem;">{icon}</div>
                    <div style="font-weight:700; color:#1e3a5f; margin:6px 0 4px 0;
                                font-size:0.82rem;">{title}</div>
                    <div style="font-size:0.72rem; color:#718096; line-height:1.4;">{desc}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )


# ────────────────────────────────────────────────────────────────────────────
# PAGE 2 — Traffic Analysis
# ────────────────────────────────────────────────────────────────────────────

def page_analysis():
    _section("📊 Traffic Analysis")

    df = st.session_state.get("trained_df")
    if df is None:
        st.warning("⚠️ No dataset loaded. Go to **Train Model** first or use **Demo Mode**.")
        return

    lc    = st.session_state.label_col
    y_bin = binarize_labels(df[lc].astype(str).str.strip())
    y_orig = df[lc].astype(str).str.strip()

    total  = len(df)
    normal = int((y_bin == 0).sum())
    attack = int((y_bin == 1).sum())

    # Row 1: two side-by-side charts
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Normal vs Attack Distribution")
        fig = _plotly_pie(
            ["Normal Traffic", "Attack Traffic"],
            [normal, attack],
            "",
            colors=[COLORS_NORMAL, COLORS_ATTACK],
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("Attack Category Breakdown")
        cat_counts = y_orig.value_counts()
        fig2 = px.bar(
            x=cat_counts.values,
            y=cat_counts.index,
            orientation="h",
            title="",
            template=PLOTLY_THEME,
            color=cat_counts.index,
            color_discrete_sequence=px.colors.qualitative.Plotly,
        )
        fig2.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor ="rgba(0,0,0,0)",
            font_color   ="#e0e6f0",
            showlegend   =False,
            xaxis_title  ="Count",
            yaxis_title  ="Category",
        )
        st.plotly_chart(fig2, use_container_width=True)

    # Row 2: numeric feature distributions
    st.subheader("🔢 Numeric Feature Distributions")
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    if num_cols:
        selected = st.multiselect(
            "Select features to visualize",
            num_cols,
            default=num_cols[:4] if len(num_cols) >= 4 else num_cols,
        )
        if selected:
            n_charts = len(selected)
            cols_per_row = 2
            rows = [selected[i:i+cols_per_row] for i in range(0, n_charts, cols_per_row)]
            for row_features in rows:
                row_cols = st.columns(len(row_features))
                for rc, feat in zip(row_cols, row_features):
                    with rc:
                        plot_df = df[[feat, lc]].copy()
                        plot_df["Traffic Type"] = y_bin.map({0: "Normal", 1: "Attack"})
                        fig3 = px.histogram(
                            plot_df,
                            x=feat,
                            color="Traffic Type",
                            color_discrete_map={"Normal": COLORS_NORMAL, "Attack": COLORS_ATTACK},
                            template=PLOTLY_THEME,
                            title=feat,
                            nbins=40,
                            barmode="overlay",
                            opacity=0.7,
                        )
                        fig3.update_layout(
                            paper_bgcolor="rgba(0,0,0,0)",
                            plot_bgcolor ="rgba(0,0,0,0)",
                            font_color   ="#e0e6f0",
                            margin       =dict(t=40,b=30,l=30,r=10),
                            showlegend   =True,
                        )
                        st.plotly_chart(fig3, use_container_width=True)
    else:
        st.info("No numeric features found in the dataset.")

    # Row 3: Class imbalance indicator
    st.subheader("⚖️ Class Balance")
    bar_data = pd.DataFrame({
        "Category" : y_orig.value_counts().index,
        "Count"    : y_orig.value_counts().values,
        "Type"     : ["Normal" if str(c).lower() in ("benign","normal") else "Attack"
                      for c in y_orig.value_counts().index],
    })
    fig4 = px.bar(
        bar_data, x="Category", y="Count",
        color="Type",
        color_discrete_map={"Normal": COLORS_NORMAL, "Attack": COLORS_ATTACK},
        template=PLOTLY_THEME,
        title="Sample Count per Traffic Category",
    )
    fig4.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor ="rgba(0,0,0,0)",
        font_color   ="#e0e6f0",
        xaxis_tickangle=-30,
    )
    st.plotly_chart(fig4, use_container_width=True)


# ────────────────────────────────────────────────────────────────────────────
# PAGE 3 — Train Model
# ────────────────────────────────────────────────────────────────────────────

def page_train():
    _section("🤖 Train Random Forest Model")

    st.markdown(
        """
        <div class="info-box">
        Upload a <strong>network traffic CSV dataset</strong> (e.g., CICIDS2017) to train the model,
        or click <strong>🧪 Generate Demo Dataset</strong> if you don't have a real dataset.
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ── Dataset source ─────────────────────────────────────────────────────
    source = st.radio(
        "Dataset Source",
        ["🧪 Demo Mode (Generate Dataset)", "📂 Upload CSV Dataset"],
        horizontal=True,
    )

    df: pd.DataFrame | None = None

    # ══════════════════════════════════════════════════════════════════════
    # DEMO MODE — Generate + save demo_network_traffic.csv
    # ══════════════════════════════════════════════════════════════════════
    if source == "🧪 Demo Mode (Generate Dataset)":

        st.markdown(
            """
            <div class="warning-box">
            🧪 <strong>DEMO / SYNTHETIC DATA</strong><br>
            The dataset below is <em>artificially generated</em> using statistical patterns inspired by
            CICIDS-style network flows.  It is <strong>NOT real network traffic</strong> and does
            <strong>NOT represent actual cybersecurity threats</strong>.<br>
            Results from this dataset are for <strong>educational demonstration only</strong>.
            </div>
            """,
            unsafe_allow_html=True,
        )

        col_sl, col_btn = st.columns([3, 1])
        with col_sl:
            n_samples = st.slider(
                "Number of synthetic records to generate",
                min_value=1000, max_value=10000, value=5000, step=500,
            )
        with col_btn:
            st.markdown("<br>", unsafe_allow_html=True)
            gen_clicked = st.button("🧪 Generate Demo Dataset", type="primary")

        # ── If file already exists, offer to load it directly ──────────────
        if os.path.exists(DEMO_CSV_PATH) and not gen_clicked:
            st.info(
                f"📂 A demo dataset already exists at `data/demo_network_traffic.csv`  "
                f"({os.path.getsize(DEMO_CSV_PATH)//1024} KB).  "
                f"Click **🧪 Generate Demo Dataset** to regenerate, or proceed to train below."
            )
            try:
                df = pd.read_csv(DEMO_CSV_PATH)
            except Exception as e:
                st.error(f"❌ Could not load existing demo file: {e}")

        # ── Generate (or regenerate) ─────────────────────────────────────
        if gen_clicked:
            with st.spinner(f"Generating {n_samples:,} synthetic network traffic records …"):
                df = generate_demo_dataset(n_samples=n_samples)
                df.to_csv(DEMO_CSV_PATH, index=False)
            st.session_state.demo_mode = True
            st.success(
                f"✅ Generated **{len(df):,} records** and saved to `data/demo_network_traffic.csv`"
            )

        # ── Dataset info card ─────────────────────────────────────────────
        if df is not None:
            n_norm = int((df["Label"] == "NORMAL").sum())
            n_atk  = int((df["Label"] == "ATTACK").sum())
            n_feat = len([c for c in df.columns if c not in ("Label", "Attack_Type")])
            pct_atk = n_atk / len(df) * 100

            st.markdown("---")
            st.markdown(
                """
                <div style="background:#1a2a0a; border:2px solid #ffab40; border-radius:10px;
                            padding:16px; margin:12px 0;">
                    <div style="font-size:1rem; font-weight:700; color:#ffab40; margin-bottom:8px;">
                        ⚠️ DEMO / SYNTHETIC DATA — Not Real Network Traffic
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            ic1, ic2, ic3, ic4, ic5 = st.columns(5)
            with ic1: _stat_card("📊", "Total Records",   f"{len(df):,}")
            with ic2: _stat_card("🔢", "Feature Columns", n_feat)
            with ic3: _stat_card("✅", "Normal Records",  f"{n_norm:,}")
            with ic4: _stat_card("🚨", "Attack Records",  f"{n_atk:,}")
            with ic5: _stat_card("⚡", "Attack %",        f"{pct_atk:.1f}%")

            st.markdown("<br>", unsafe_allow_html=True)

            # Attack type breakdown
            if "Attack_Type" in df.columns:
                at_counts = df["Attack_Type"].value_counts()
                col_pie, col_tbl = st.columns([1, 1])
                with col_pie:
                    st.subheader("Attack Type Distribution")
                    colors_cycle = [COLORS_NORMAL, "#ff5252", "#ff9800", "#e040fb", "#00bcd4"]
                    fig_at = px.pie(
                        names=at_counts.index,
                        values=at_counts.values,
                        template=PLOTLY_THEME,
                        color_discrete_sequence=colors_cycle,
                        hole=0.35,
                    )
                    fig_at.update_layout(
                        paper_bgcolor="rgba(0,0,0,0)",
                        font_color="#e0e6f0",
                        margin=dict(t=30, b=20, l=20, r=20),
                    )
                    st.plotly_chart(fig_at, use_container_width=True)
                with col_tbl:
                    st.subheader("Category Counts")
                    tbl = at_counts.reset_index()
                    tbl.columns = ["Attack_Type", "Count"]
                    tbl["% of Total"] = (tbl["Count"] / len(df) * 100).round(1).astype(str) + "%"
                    st.dataframe(tbl, use_container_width=True, hide_index=True)

            with st.expander("👁 Preview first 10 rows"):
                st.dataframe(df.head(10), use_container_width=True)

    # ══════════════════════════════════════════════════════════════════════
    # UPLOAD MODE
    # ══════════════════════════════════════════════════════════════════════
    else:
        uploaded = st.file_uploader(
            "Upload CSV (network traffic dataset)",
            type=["csv"],
            help="Supports CICIDS2017, NSL-KDD, or any labelled network traffic CSV.",
        )
        if uploaded:
            try:
                with st.spinner("Reading CSV …"):
                    df = pd.read_csv(uploaded, low_memory=False)
                st.success(f"✅ Loaded: {df.shape[0]:,} rows × {df.shape[1]} columns")
                with st.expander("Preview first 5 rows"):
                    st.dataframe(df.head(), use_container_width=True)
            except Exception as e:
                st.error(f"❌ Could not read file: {e}")
                return

    if df is None:
        st.info("👆 Generate the demo dataset or upload a CSV to continue.")
        return

    # ── Label column detection ─────────────────────────────────────────────
    st.markdown("---")
    st.subheader("🏷️ Label Column")
    auto_label = detect_label_column(df)
    all_cols   = df.columns.tolist()

    if auto_label:
        st.success(f"✅ Auto-detected label column: **{auto_label}**")
        label_col = st.selectbox(
            "Confirm or change the label column",
            all_cols,
            index=all_cols.index(auto_label),
        )
    else:
        st.warning("⚠️ Could not auto-detect the label column. Please select it manually.")
        label_col = st.selectbox("Select the label column", all_cols)

    if label_col:
        vc = df[label_col].value_counts()
        st.write("**Label distribution:**")
        st.dataframe(
            vc.rename("Count").reset_index().rename(columns={"index": label_col}),
            use_container_width=True,
            hide_index=True,
        )

    # ── Training settings ──────────────────────────────────────────────────
    st.subheader("⚙️ Training Settings")
    col1, col2 = st.columns(2)
    with col1:
        test_size    = st.slider("Test set size (%)", 10, 40, 20) / 100
        n_estimators = st.slider("Number of trees (n_estimators)", 10, 300, 100, 10)
    with col2:
        random_state = st.number_input("Random seed", 0, 9999, 42)
        st.info("💡 **class_weight='balanced'** handles class imbalance automatically.")

    # ── Train button ───────────────────────────────────────────────────────
    if st.button("🚀 Train Model", type="primary"):
        progress_box = st.empty()
        progress_bar = st.progress(0)
        steps_done   = []

        def _update(msg):
            steps_done.append(msg)
            progress_box.markdown(
                "<br>".join([f"• {s}" for s in steps_done[-4:]]),
                unsafe_allow_html=True,
            )
            progress_bar.progress(min(len(steps_done) / 7, 1.0))

        try:
            results = train(
                df=df,
                label_col=label_col,
                test_size=test_size,
                n_estimators=n_estimators,
                random_state=int(random_state),
                progress_callback=_update,
            )
            progress_bar.progress(1.0)
            st.session_state.trained_df    = df.copy()
            st.session_state.label_col     = label_col
            st.session_state.train_results = results
            st.session_state.model_loaded  = True
            st.session_state.demo_mode     = (source == "🧪 Demo Mode (Generate Dataset)")
            # Bust metadata cache so the new model shows immediately
            st.session_state.metadata = None
            _try_load_metadata()
            st.success("🎉 Model trained and saved successfully!")

        except Exception as e:
            st.error(f"❌ Training failed: {e}")
            return

    # ── Results ────────────────────────────────────────────────────────────
    results = st.session_state.get("train_results")
    if results:
        _section("📈 Evaluation Results")

        # Demo data disclaimer — shown BEFORE metrics
        if st.session_state.get("demo_mode"):
            st.markdown(
                """
                <div class="warning-box">
                ⚠️ <strong>DEMO / SYNTHETIC DATA — Results Disclaimer</strong><br>
                These results are calculated from <strong>artificially generated data</strong>
                and should <strong>NOT</strong> be considered real-world intrusion detection
                performance.  Accuracy on synthetic data is typically inflated because the
                generator creates clean, well-separated class patterns.
                </div>
                """,
                unsafe_allow_html=True,
            )

        c1, c2, c3, c4 = st.columns(4)
        with c1: st.metric("Accuracy",  f"{results['accuracy']*100:.2f}%")
        with c2: st.metric("Precision", f"{results['precision']*100:.2f}%")
        with c3: st.metric("Recall",    f"{results['recall']*100:.2f}%")
        with c4: st.metric("F1-Score",  f"{results['f1']*100:.2f}%")

        col_a, col_b = st.columns(2)
        with col_a:
            st.subheader("Confusion Matrix")
            fig_cm = _plotly_confusion(results["confusion_matrix"])
            st.plotly_chart(fig_cm, use_container_width=True)
        with col_b:
            st.subheader("Classification Report")
            st.code(results["classification_report"], language="text")

        # Feature importance quick chart
        fi = results.get("feature_importance", {})
        if fi:
            fi_df = (
                pd.DataFrame.from_dict(fi, orient="index", columns=["Importance"])
                .sort_values("Importance", ascending=False)
                .head(10)
                .reset_index()
                .rename(columns={"index": "Feature"})
            )
            fig_fi = px.bar(
                fi_df, x="Importance", y="Feature", orientation="h",
                title="Top 10 Feature Importances",
                template=PLOTLY_THEME,
                color="Importance",
                color_continuous_scale="Blues",
            )
            fig_fi.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor ="rgba(0,0,0,0)",
                font_color   ="#e0e6f0",
                yaxis        =dict(autorange="reversed"),
                coloraxis_showscale=False,
                height       =340,
            )
            st.subheader("🔬 Feature Importance (Quick View)")
            st.plotly_chart(fig_fi, use_container_width=True)




# ────────────────────────────────────────────────────────────────────────────
# PAGE 4 — Intrusion Detection
# ────────────────────────────────────────────────────────────────────────────

def page_detect():
    _section("🔍 Intrusion Detection — Predict Network Traffic")

    if not model_exists():
        st.warning("⚠️ No trained model found. Go to **🤖 Train Model** first.")
        return

    st.markdown(
        """
        <div class="info-box">
        Upload a CSV of unlabelled network traffic, or click <strong>🎲 Generate Demo Traffic</strong>
        to generate synthetic records and send them through the trained model.
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ── Risk level guide ───────────────────────────────────────────────────
    with st.expander("ℹ️ Risk Level Guide", expanded=False):
        st.markdown(
            """
            | Risk Level | Meaning |
            |---|---|
            | 🟢 **Low** | Normal traffic — low attack probability |
            | 🟡 **Medium** | Uncertain — may warrant investigation |
            | 🔴 **High** | Attack detected with high confidence |

            > ⚠️ Risk levels are application-defined thresholds for educational demonstration only.
            > They are **not** a substitute for a professional security monitoring system (SIEM/SOC).
            """,
        )

    # ── Input method ──────────────────────────────────────────────────────
    detect_source = st.radio(
        "Traffic Input",
        ["🎲 Generate Demo Traffic", "🔴 Live Monitor (Simulation)", "📂 Upload CSV"],
        horizontal=True,
    )

    test_df      : pd.DataFrame | None = None
    is_demo_pred : bool = False

    # ══════════════════════════════════════════════════════════════════════
    # LIVE MONITOR — auto-refresh simulation
    # ══════════════════════════════════════════════════════════════════════
    if detect_source == "🔴 Live Monitor (Simulation)":

        st.markdown(
            """
            <div style="background:#fff5f5; border:2px solid #fc8181; border-radius:10px;
                        padding:14px 18px; margin:10px 0; font-size:0.92rem; color:#742a2a;">
                🔴 <strong>LIVE MONITOR — SIMULATION MODE</strong><br>
                This simulates a real-time intrusion detection feed using <em>synthetic data</em>.
                New traffic batches are generated and analysed automatically every few seconds.
                <strong>This is NOT monitoring your actual network.</strong>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # ── Controls ──────────────────────────────────────────────────────
        cfg1, cfg2, cfg3 = st.columns(3)
        with cfg1:
            refresh_sec = st.selectbox(
                "⏱ Refresh Interval",
                [2, 3, 5, 10],
                index=1,
                format_func=lambda x: f"Every {x} seconds",
            )
        with cfg2:
            batch_size = st.selectbox(
                "📦 Records per Batch",
                [5, 10, 15, 20],
                index=1,
            )
        with cfg3:
            alert_pct = st.slider(
                "🚨 Alert Threshold (Attack %)",
                min_value=10, max_value=80, value=30, step=10,
                format="%d%%",
            )

        # ── Start / Stop buttons ──────────────────────────────────────────
        btn1, btn2, btn3 = st.columns([1, 1, 4])
        with btn1:
            if st.button("▶️ Start", type="primary"):
                st.session_state["live_active"]     = True
                st.session_state["live_log"]        = []
                st.session_state["live_total"]      = 0
                st.session_state["live_attacks"]    = 0
                st.session_state["live_batches"]    = 0
                st.session_state["live_start"]      = datetime.now().strftime("%H:%M:%S")
                st.session_state["detect_results"]  = None   # clear old results
                st.rerun()
        with btn2:
            if st.button("⏹ Stop"):
                st.session_state["live_active"] = False
                st.rerun()

        # ── Live monitor running ───────────────────────────────────────────
        if st.session_state.get("live_active", False):

            # Generate a new batch and predict
            raw      = generate_demo_dataset(n_samples=batch_size, seed=None)
            feat_df  = raw.drop(columns=["Label", "Attack_Type"])
            batch_result = predict(feat_df)

            # Stamp each row with current time
            ts = datetime.now().strftime("%H:%M:%S")
            batch_result.insert(0, "Time", ts)

            # Accumulate rolling log (keep last 100 records)
            existing = st.session_state.get("live_log", [])
            existing.insert(0, batch_result)        # newest first
            if len(existing) > 10:                  # keep max 10 batches
                existing = existing[:10]
            st.session_state["live_log"]     = existing

            # Update counters
            n_atk = int((batch_result["Prediction"] == "ATTACK").sum())
            st.session_state["live_total"]   = st.session_state.get("live_total", 0) + batch_size
            st.session_state["live_attacks"] = st.session_state.get("live_attacks", 0) + n_atk
            st.session_state["live_batches"] = st.session_state.get("live_batches", 0) + 1

            # ── Live stats cards ──────────────────────────────────────────
            total_seen  = st.session_state["live_total"]
            total_atk   = st.session_state["live_attacks"]
            total_norm  = total_seen - total_atk
            attack_rate = (total_atk / total_seen * 100) if total_seen else 0

            _section("📡 Live Statistics")
            lc1, lc2, lc3, lc4, lc5 = st.columns(5)
            with lc1: _stat_card("🕐", "Started At",       st.session_state.get("live_start", "—"))
            with lc2: _stat_card("📊", "Total Analysed",   total_seen)
            with lc3: _stat_card("✅", "Normal",            total_norm)
            with lc4: _stat_card("🚨", "Attacks Found",    total_atk)
            with lc5: _stat_card("⚡", "Attack Rate",       f"{attack_rate:.1f}%")

            st.markdown("<br>", unsafe_allow_html=True)

            # ── Attack alert banner ───────────────────────────────────────
            batch_attack_pct = (n_atk / batch_size * 100)
            if batch_attack_pct >= alert_pct:
                st.markdown(
                    f"""
                    <div style="background:#fed7d7; border:3px solid #c53030;
                                border-radius:10px; padding:16px 20px; margin:10px 0;
                                animation: blink 1s step-start infinite;">
                        🚨 <strong style="color:#742a2a; font-size:1.1rem;">
                        ATTACK ALERT!</strong>
                        <span style="color:#742a2a;">
                        &nbsp; {n_atk} out of {batch_size} records in this batch
                        are attacks ({batch_attack_pct:.0f}%) — exceeds your
                        {alert_pct}% alert threshold.
                        </span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
            else:
                st.markdown(
                    f"""
                    <div style="background:#f0fff4; border:2px solid #48bb78;
                                border-radius:10px; padding:12px 18px; margin:10px 0;">
                        ✅ <strong style="color:#22543d;">Traffic Normal</strong>
                        <span style="color:#276749;">
                        &nbsp; {n_atk} attacks in this batch ({batch_attack_pct:.0f}%)
                        — below alert threshold.
                        </span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

            # ── Latest batch table ────────────────────────────────────────
            _section(f"🔄 Latest Batch — {ts}  (Batch #{st.session_state['live_batches']})")

            def _lc_risk(val):
                m = {"High":"color:#742a2a;font-weight:700",
                     "Medium":"color:#744210;font-weight:700",
                     "Low":"color:#22543d;font-weight:700"}
                return m.get(val, "")

            def _lc_pred(val):
                return "color:#c53030;font-weight:700" if val=="ATTACK" else "color:#276749;font-weight:700"

            styled_batch = batch_result.style.map(_lc_risk, subset=["Risk_Level"]) \
                                             .map(_lc_pred, subset=["Prediction"])
            st.dataframe(styled_batch, use_container_width=True, height=280)

            # ── Rolling log (collapsible) ─────────────────────────────────
            if len(st.session_state["live_log"]) > 1:
                with st.expander(
                    f"📜 Full Rolling Log — last {len(st.session_state['live_log'])} batches",
                    expanded=False,
                ):
                    full_log = pd.concat(st.session_state["live_log"], ignore_index=True)
                    styled_log = full_log.style.map(_lc_risk, subset=["Risk_Level"]) \
                                               .map(_lc_pred, subset=["Prediction"])
                    st.dataframe(styled_log, use_container_width=True, height=400)

                    csv_bytes = full_log.to_csv(index=False).encode("utf-8")
                    st.download_button(
                        "⬇️ Download Full Log (CSV)",
                        data=csv_bytes,
                        file_name="live_monitor_log.csv",
                        mime="text/csv",
                    )

            # ── Mini live chart ───────────────────────────────────────────
            _section("📈 Live Attack Rate Trend")
            batch_history = st.session_state.get("live_batch_history", [])
            batch_history.append({
                "Batch": st.session_state["live_batches"],
                "Attack %": round(batch_attack_pct, 1),
                "Normal %": round(100 - batch_attack_pct, 1),
            })
            if len(batch_history) > 20:
                batch_history = batch_history[-20:]
            st.session_state["live_batch_history"] = batch_history

            trend_df = pd.DataFrame(batch_history)
            fig_trend = px.line(
                trend_df, x="Batch", y="Attack %",
                title="Attack % per Batch (last 20 batches)",
                template=PLOTLY_THEME,
                markers=True,
                color_discrete_sequence=[COLORS_ATTACK],
            )
            fig_trend.add_hline(
                y=alert_pct,
                line_dash="dash",
                line_color="#f6ad55",
                annotation_text=f"Alert threshold ({alert_pct}%)",
                annotation_position="top left",
            )
            fig_trend.update_layout(
                paper_bgcolor="rgba(255,255,255,0)",
                font_color="#2d3748",
                yaxis=dict(range=[0, 100], title="Attack %"),
                xaxis_title="Batch #",
                height=280,
            )
            st.plotly_chart(fig_trend, use_container_width=True)

            # ── Status footer ─────────────────────────────────────────────
            st.markdown(
                f"""
                <div style="background:#ebf8ff; border:1px solid #90cdf4; border-radius:8px;
                            padding:10px 16px; font-size:0.85rem; color:#2c5282; margin-top:8px;">
                    🔄 <strong>Auto-refreshing every {refresh_sec}s</strong>
                    &nbsp;|&nbsp; Click <strong>⏹ Stop</strong> to pause
                    &nbsp;|&nbsp; Batch #{st.session_state['live_batches']} at {ts}
                </div>
                """,
                unsafe_allow_html=True,
            )

            # ── Wait then rerun ───────────────────────────────────────────
            time.sleep(refresh_sec)
            st.rerun()

        else:
            # Monitor stopped — show last known stats if any
            if st.session_state.get("live_total", 0) > 0:
                st.info(
                    f"⏹ Monitor stopped.  "
                    f"Session total: **{st.session_state['live_total']}** records analysed, "
                    f"**{st.session_state['live_attacks']}** attacks detected "
                    f"({st.session_state['live_attacks']/st.session_state['live_total']*100:.1f}% attack rate)."
                )
            else:
                st.info("👆 Click **▶️ Start** to begin the live simulation.")
        return   # live monitor handles its own display — skip the rest of page_detect

    # ── Demo traffic generator ─────────────────────────────────────────────
    if detect_source == "🎲 Generate Demo Traffic":
        is_demo_pred = True

        st.markdown(
            """
            <div class="warning-box">
            🎲 <strong>Demo Prediction using Synthetic Traffic</strong><br>
            These are <em>artificially generated</em> network flow records — <strong>NOT</strong>
            real captured traffic.  Predictions shown below are for educational
            demonstration only and do <strong>NOT</strong> reflect real-world threats.
            </div>
            """,
            unsafe_allow_html=True,
        )

        n_demo = st.slider(
            "Number of demo records to generate",
            min_value=10, max_value=200, value=30, step=10,
        )

        if st.button("🎲 Generate Demo Traffic", type="primary"):
            with st.spinner("Generating synthetic traffic records …"):
                raw = generate_demo_dataset(n_samples=n_demo, seed=None)
                # Drop label columns — we predict them
                drop_cols = [c for c in ("Label", "Attack_Type") if c in raw.columns]
                test_df = raw.drop(columns=drop_cols)
                st.session_state["demo_traffic_df"]   = test_df
                st.session_state["demo_traffic_truth"] = raw.get("Label") if "Label" in raw.columns else None
            st.success(f"✅ Generated {len(test_df)} synthetic traffic records")

        # Persist across reruns
        if test_df is None and st.session_state.get("demo_traffic_df") is not None:
            test_df = st.session_state["demo_traffic_df"]

        if test_df is not None:
            with st.expander("👁 Preview generated records"):
                st.dataframe(test_df.head(10), use_container_width=True)
        else:
            st.info("👆 Click **🎲 Generate Demo Traffic** to create synthetic test records.")
            return

    # ── CSV upload mode ────────────────────────────────────────────────────
    else:
        test_file = st.file_uploader(
            "Upload network traffic CSV for analysis",
            type=["csv"],
            key="detect_upload",
        )
        if test_file:
            try:
                raw = pd.read_csv(test_file, low_memory=False)
                # Drop label columns if user accidentally included them
                drop_cols = [c for c in ("Label", "Attack_Type") if c in raw.columns]
                test_df = raw.drop(columns=drop_cols) if drop_cols else raw
                st.success(f"✅ Loaded {len(test_df):,} records × {len(test_df.columns)} features")
                with st.expander("Preview uploaded data"):
                    st.dataframe(test_df.head(), use_container_width=True)
            except Exception as e:
                st.error(f"❌ Could not read file: {e}")
                return
        else:
            st.info("📂 Upload a CSV file above to get started.")
            return

    # ── Run predictions ────────────────────────────────────────────────────
    if st.button("🔍 Analyze Traffic", type="primary"):
        with st.spinner("Running intrusion detection model …"):
            try:
                result_df = predict(test_df)
                st.session_state["detect_results"]      = result_df
                st.session_state["detect_is_demo_pred"] = is_demo_pred
            except RuntimeError as e:
                st.error(f"❌ Prediction error: {e}")
                return
            except Exception as e:
                st.error(f"❌ Unexpected error: {e}")
                return

    result_df = st.session_state.get("detect_results")
    if result_df is None:
        return

    # ── Demo prediction banner ─────────────────────────────────────────────
    if st.session_state.get("detect_is_demo_pred"):
        st.markdown(
            """
            <div style="background:#fffbeb; border:2px solid #f6ad55; border-radius:8px;
                        padding:12px 16px; margin:12px 0; font-size:0.9rem; color:#744210;">
                🎲 <strong>Demo Prediction using Synthetic Traffic</strong> —
                results below are for <strong>educational demonstration only</strong>.
                This is NOT real network monitoring.
            </div>
            """,
            unsafe_allow_html=True,
        )

    # ── Summary cards ──────────────────────────────────────────────────────
    n_total  = len(result_df)
    n_attack = int((result_df["Prediction"] == "ATTACK").sum())
    n_normal = n_total - n_attack
    n_high   = int((result_df["Risk_Level"] == "High").sum())
    n_med    = int((result_df["Risk_Level"] == "Medium").sum())

    _section("🚨 Detection Summary")
    c1, c2, c3, c4, c5 = st.columns(5)
    with c1: _stat_card("📡", "Total Records", n_total)
    with c2: _stat_card("✅", "Normal",        n_normal)
    with c3: _stat_card("🚨", "Attacks",       n_attack)
    with c4: _stat_card("🔴", "High Risk",     n_high)
    with c5: _stat_card("🟡", "Medium Risk",   n_med)

    # ── Individual record badges (first 10) ────────────────────────────────
    st.markdown("---")
    _section("🔎 Individual Record Results (first 10)")
    for _, row in result_df.head(10).iterrows():
        badge_class = "badge-attack" if row["Prediction"] == "ATTACK" else "badge-normal"
        icon        = "🚨" if row["Prediction"] == "ATTACK" else "✅"
        risk_class  = f"badge-{row['Risk_Level'].lower()}"
        st.markdown(
            f"""
            <div style="display:flex; align-items:center; gap:12px; padding:6px 0;">
                <span style="color:#8ab4d4; width:60px;">#{row['Record']}</span>
                <span class="{badge_class}">{icon} {row['Prediction']}</span>
                <span class="{risk_class}">⚡ {row['Risk_Level']} Risk</span>
                <span style="color:#8ab4d4; font-size:0.85rem;">
                    Confidence: {row['Confidence']}
                </span>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # ── Full prediction table ──────────────────────────────────────────────
    st.markdown("---")
    _section("📋 Full Prediction Table")

    def _color_risk(val):
        # Light-theme colors — dark text on light tinted backgrounds
        color_map = {
            "High"   : "color: #742a2a; font-weight: 700;",   # dark red
            "Medium" : "color: #744210; font-weight: 700;",   # dark amber
            "Low"    : "color: #22543d; font-weight: 700;",   # dark green
        }
        return color_map.get(val, "color: #2d3748;")

    def _color_pred(val):
        if val == "ATTACK":
            return "color: #c53030; font-weight: 700;"   # dark red on white
        return "color: #276749; font-weight: 700;"       # dark green on white

    # pandas >= 2.1 uses .map() instead of deprecated .applymap()
    styled = result_df.style.map(_color_risk, subset=["Risk_Level"])
    styled = styled.map(_color_pred, subset=["Prediction"])
    st.dataframe(styled, use_container_width=True, height=400)

    # ── Download ───────────────────────────────────────────────────────────
    csv_bytes = result_df.to_csv(index=False).encode("utf-8")
    st.download_button(
        label    ="⬇️ Download Prediction Results (CSV)",
        data     =csv_bytes,
        file_name="intrusion_detection_results.csv",
        mime     ="text/csv",
        type     ="primary",
    )

    # ── Charts ─────────────────────────────────────────────────────────────
    col_p1, col_p2 = st.columns(2)
    with col_p1:
        fig_pred = _plotly_pie(
            ["Normal", "Attack"], [n_normal, n_attack],
            "Prediction Distribution",
            colors=[COLORS_NORMAL, COLORS_ATTACK],
        )
        st.plotly_chart(fig_pred, use_container_width=True)
    with col_p2:
        risk_counts = result_df["Risk_Level"].value_counts()
        fig_risk = _plotly_pie(
            risk_counts.index.tolist(),
            risk_counts.values.tolist(),
            "Risk Level Distribution",
            colors=["#ff5252", "#ffab40", "#69f0ae"],
        )
        st.plotly_chart(fig_risk, use_container_width=True)


# ────────────────────────────────────────────────────────────────────────────
# Main router
# ────────────────────────────────────────────────────────────────────────────


def main():
    if st.session_state.metadata is None:
        _try_load_metadata()

    page = _sidebar()

    if   page == "overview" : page_overview()
    elif page == "analysis" : page_analysis()
    elif page == "train"    : page_train()
    elif page == "detect"   : page_detect()


if __name__ == "__main__":
    main()
