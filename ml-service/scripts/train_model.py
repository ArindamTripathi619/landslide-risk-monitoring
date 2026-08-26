"""
Quick model training script.

Usage:
    python scripts/train_model.py
    python scripts/train_model.py --csv data/processed/ner_training_data.csv
"""
import os
import sys
import argparse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import numpy as np
import pandas as pd

try:
    import xgboost as xgb
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
    from sklearn.preprocessing import LabelEncoder
    import joblib
except ImportError:
    print("❌ Install dependencies: pip install -r requirements.txt")
    sys.exit(1)

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'trained')
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = [
    'latitude', 'longitude', 'slope', 'aspect', 'elevation',
    'rainfall_7day', 'ndvi', 'soil_moisture', 'distance_to_road',
]


def prepare_ner_features(df):
    """Map raw column names to model features."""
    col_map = {
        'rainfall_daily': 'rainfall_24hr',
        'rainfall_7day': 'rainfall_7days',
    }
    df = df.rename(columns=col_map)

    # Ensure all feature columns exist
    for feat in FEATURES:
        if feat not in df.columns:
            df[feat] = 0

    # Fill NaN
    for feat in FEATURES:
        df[feat] = df[feat].fillna(df[feat].median() if df[feat].notna().any() else 0)

    return df


def train(csv_path):
    print(f"📊 Loading: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"   Rows: {len(df)} | Columns: {len(df.columns)}")

    df = prepare_ner_features(df)

    # Determine target column
    target_col = 'landslide' if 'landslide' in df.columns else 'label'
    if target_col not in df.columns:
        print("❌ No target column found ('landslide' or 'label')")
        return

    X = df[FEATURES].values
    y = df[target_col].values.astype(int)

    print(f"\n📊 Class distribution:")
    unique, counts = np.unique(y, return_counts=True)
    for u, c in zip(unique, counts):
        print(f"   Class {u}: {c} ({c/len(y)*100:.1f}%)")

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Train XGBoost
    print(f"\n🏋️ Training XGBoost on {len(X_train)} samples...")
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric='logloss',
        random_state=42,
        scale_pos_weight=len(y_train[y_train==0]) / max(len(y_train[y_train==1]), 1),
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\n✅ Model trained!")
    print(f"   Accuracy: {accuracy:.3f}")
    print(f"\n📊 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['No Landslide', 'Landslide']))
    print(f"📊 Confusion Matrix:")
    print(f"   {cm}")

    # Cross-validation
    print(f"\n🔄 5-fold Cross Validation...")
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"   CV Accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std()*2:.3f})")

    # Feature importance
    importances = model.feature_importances_
    print(f"\n📊 Feature Importance:")
    for feat, imp in sorted(zip(FEATURES, importances), key=lambda x: -x[1]):
        bar = '█' * int(imp * 50)
        print(f"   {feat:20s} {imp:.3f} {bar}")

    # Save model
    model_path = os.path.join(MODEL_DIR, 'landslide_model.pkl')
    joblib.dump(model, model_path)
    print(f"\n💾 Model saved to: {model_path}")

    # Save metadata
    meta = {
        'features': FEATURES,
        'accuracy': float(accuracy),
        'cv_mean': float(cv_scores.mean()),
        'cv_std': float(cv_scores.std()),
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'n_features': len(FEATURES),
    }
    import json
    meta_path = os.path.join(MODEL_DIR, 'model_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)
    print(f"📋 Metadata saved to: {meta_path}")

    return model


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train landslide prediction model')
    parser.add_argument('--csv', default='data/processed/ner_training_data.csv',
                        help='Path to training CSV')
    args = parser.parse_args()

    csv_path = args.csv
    if not os.path.isabs(csv_path):
        csv_path = os.path.join(os.path.dirname(__file__), '..', csv_path)

    train(csv_path)
