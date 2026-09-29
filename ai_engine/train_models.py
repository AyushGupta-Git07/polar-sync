import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def generate_synthetic_polar_data():
    np.random.seed(42)
    n_samples = 1200

    # Risk Features
    wind = np.random.uniform(5, 110, n_samples)
    temp = np.random.uniform(-55, -10, n_samples)
    vis = np.random.uniform(0.2, 25, n_samples)
    crevasse = np.random.uniform(0.05, 0.95, n_samples)
    fleet_health = np.random.uniform(40, 100, n_samples)
    distance = np.random.uniform(15, 350, n_samples)

    # Risk score function based on Antarctic traverse physics
    risk_score = (
        (wind / 100.0) * 0.35 +
        (abs(temp) / 60.0) * 0.20 +
        ((25.0 - vis) / 25.0) * 0.25 +
        (crevasse) * 0.30 +
        ((100.0 - fleet_health) / 100.0) * 0.25 +
        (distance / 350.0) * 0.15
    ) + np.random.normal(0, 0.05, n_samples)

    risk_class = np.zeros(n_samples, dtype=int)
    risk_class[risk_score > 0.70] = 1 # Caution / Elevated
    risk_class[risk_score > 1.05] = 2 # Critical / Hazard

    risk_df = pd.DataFrame({
        "wind_speed_kmh": wind,
        "temperature_c": temp,
        "visibility_km": vis,
        "crevasse_density": crevasse,
        "fleet_health_pct": fleet_health,
        "traverse_distance_km": distance,
        "risk_class": risk_class
    })

    # Fuel & Resource burn data
    crew = np.random.randint(15, 55, n_samples)
    snowcats = np.random.randint(0, 5, n_samples)
    annex = np.random.randint(0, 2, n_samples)

    # Diesel burn physics: base heating + sub-zero compensation + generator loads + vehicles
    diesel_burn = (
        180.0 +
        (abs(temp) * 3.8) +
        (crew * 2.2) +
        (snowcats * 45.0) +
        (annex * 65.0) +
        np.random.normal(0, 8.0, n_samples)
    )

    rations_burn = (crew * 2.4) + np.random.normal(0, 2.0, n_samples)

    fuel_df = pd.DataFrame({
        "ambient_temp_c": temp,
        "active_crew_count": crew,
        "active_snowcats": snowcats,
        "science_annex_active": annex,
        "daily_diesel_burn_liters": diesel_burn,
        "daily_rations_kg": rations_burn
    })

    return risk_df, fuel_df

def train_and_export():
    print("[*] Generating Antarctic expedition telemetry datasets...")
    risk_df, fuel_df = generate_synthetic_polar_data()

    # 1. Train Expedition Risk Classifier
    print("[*] Training Scikit-Learn RandomForest Risk Classifier...")
    risk_features = ["wind_speed_kmh", "temperature_c", "visibility_km", "crevasse_density", "fleet_health_pct", "traverse_distance_km"]
    X_risk = risk_df[risk_features]
    y_risk = risk_df["risk_class"]

    risk_model = Pipeline([
        ("scaler", StandardScaler()),
        ("rf", RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42))
    ])
    risk_model.fit(X_risk, y_risk)

    risk_model_path = os.path.join(MODELS_DIR, "risk_classifier.pkl")
    joblib.dump({
        "pipeline": risk_model,
        "features": risk_features,
        "classes": ["Operational (Green)", "Elevated Caution (Amber)", "Critical Hazard (Red)"]
    }, risk_model_path)
    print(f"[OK] Saved Risk Classifier to: {risk_model_path}")

    # 2. Train Fuel and Resource Regressor
    print("[*] Training Scikit-Learn Resource & Fuel Regressor...")
    fuel_features = ["ambient_temp_c", "active_crew_count", "active_snowcats", "science_annex_active"]
    X_fuel = fuel_df[fuel_features]
    y_fuel = fuel_df["daily_diesel_burn_liters"]

    fuel_model = Pipeline([
        ("scaler", StandardScaler()),
        ("ridge", Ridge(alpha=1.0))
    ])
    fuel_model.fit(X_fuel, y_fuel)

    fuel_model_path = os.path.join(MODELS_DIR, "fuel_forecaster.pkl")
    joblib.dump({
        "pipeline": fuel_model,
        "features": fuel_features
    }, fuel_model_path)
    print(f"[OK] Saved Fuel Forecaster to: {fuel_model_path}")

    print("[OK] AI/ML Models successfully trained and serialized.")

if __name__ == "__main__":
    train_and_export()
