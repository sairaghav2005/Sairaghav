"""
verify_setup.py — Quick smoke test for the NIDS project.
Run with: python verify_setup.py
"""
# -*- coding: utf-8 -*-
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    print("1. Testing imports...")
    from src.data_preprocessing import (
        generate_synthetic_dataset, detect_label_column,
        clean_dataframe, binarize_labels, build_preprocessing_pipeline
    )
    from src.train_model import train, load_model, model_exists
    from src.prediction import predict
    print("   All imports OK")
    return True

def test_data_gen():
    print("2. Testing data generation...")
    from src.data_preprocessing import generate_synthetic_dataset, detect_label_column
    df = generate_synthetic_dataset(300)
    assert df.shape[0] == 300, "Wrong row count"
    lc = detect_label_column(df)
    assert lc is not None, "Label column not detected"
    assert lc in df.columns, f"Label col {lc} not in df"
    print(f"   Generated {df.shape[0]} rows x {df.shape[1]} cols, label='{lc}'")
    return df, lc

def test_training(df, lc):
    print("3. Testing model training...")
    from src.train_model import train, model_exists
    results = train(df, lc, n_estimators=10)
    assert "accuracy" in results
    assert model_exists()
    print(f"   Accuracy={results['accuracy']:.4f}, F1={results['f1']:.4f}")
    return results

def test_prediction():
    print("4. Testing prediction...")
    from src.data_preprocessing import generate_synthetic_dataset, detect_label_column
    from src.prediction import predict
    df = generate_synthetic_dataset(20)
    lc = detect_label_column(df)
    test_df = df.drop(columns=[lc])
    result = predict(test_df)
    assert len(result) == 20
    assert "Prediction" in result.columns
    assert "Risk_Level" in result.columns
    attacks = (result["Prediction"] == "ATTACK").sum()
    normal  = (result["Prediction"] == "NORMAL").sum()
    print(f"   {normal} Normal, {attacks} Attack predictions")
    return result

def test_download(result_df):
    print("5. Testing CSV download...")
    csv = result_df.to_csv(index=False)
    assert len(csv) > 0
    print(f"   CSV size: {len(csv)} chars")

if __name__ == "__main__":
    print("=" * 50)
    print("  NIDS Project — Setup Verification")
    print("=" * 50)
    try:
        test_imports()
        df, lc = test_data_gen()
        test_training(df, lc)
        result_df = test_prediction()
        test_download(result_df)
        print()
        print("All tests passed! The project is ready.")
        print("Run: streamlit run app.py")
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
