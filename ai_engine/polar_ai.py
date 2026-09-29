import sys
import json
import os
import joblib
import numpy as np
import pandas as pd

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

def load_models():
    risk_data = joblib.load(os.path.join(MODELS_DIR, "risk_classifier.pkl"))
    fuel_data = joblib.load(os.path.join(MODELS_DIR, "fuel_forecaster.pkl"))
    return risk_data, fuel_data

def predict_risk(payload):
    risk_data, _ = load_models()
    pipeline = risk_data["pipeline"]
    features = risk_data["features"]

    input_df = pd.DataFrame([{
        "wind_speed_kmh": float(payload.get("wind_speed_kmh", 25.0)),
        "temperature_c": float(payload.get("temperature_c", -28.0)),
        "visibility_km": float(payload.get("visibility_km", 12.0)),
        "crevasse_density": float(payload.get("crevasse_density", 0.2)),
        "fleet_health_pct": float(payload.get("fleet_health_pct", 85.0)),
        "traverse_distance_km": float(payload.get("traverse_distance_km", 45.0))
    }])

    pred_class_idx = int(pipeline.predict(input_df)[0])
    probs = pipeline.predict_proba(input_df)[0].tolist()
    class_labels = risk_data["classes"]
    predicted_label = class_labels[pred_class_idx]

    # Calculate overall risk percentage (0 to 100)
    risk_percentage = round((probs[1] * 0.5 + probs[2] * 1.0) * 100, 1)
    confidence = round(max(probs) * 100, 1)

    # Mitigation directives based on features
    wind_val = float(payload.get("wind_speed_kmh", 25.0))
    temp_val = float(payload.get("temperature_c", -28.0))
    vis_val = float(payload.get("visibility_km", 12.0))
    crev_val = float(payload.get("crevasse_density", 0.2))
    fleet_val = float(payload.get("fleet_health_pct", 85.0))

    mitigations = []
    if wind_val > 60:
        mitigations.append("Katabatic wind exceeds 60 km/h: enforce convoy tethering and buddy protocols.")
    if temp_val < -40:
        mitigations.append("Temperature below -40°C: pre-heat hydraulic fluids and cycle snowcat engines every 2 hours.")
    if vis_val < 2.0:
        mitigations.append("Whiteout visibility (<2 km): ground transit prohibited without radar ground beacon lock.")
    if crev_val > 0.4:
        mitigations.append("High crevasse density: lead tractor must operate Ground-Penetrating Radar (GPR) at 5 km/h.")
    if fleet_val < 70:
        mitigations.append("Fleet health <70%: deploy standby PB-07 vehicle as secondary rescue escort.")

    if not mitigations:
        mitigations.append("All operational telemetry parameters nominal. Clear for standard field sortie.")

    return {
        "status": "success",
        "predicted_class": predicted_label,
        "class_index": pred_class_idx,
        "risk_percentage": risk_percentage,
        "confidence_percentage": confidence,
        "probabilities": {
            "operational": round(probs[0] * 100, 1),
            "caution": round(probs[1] * 100, 1),
            "critical": round(probs[2] * 100, 1)
        },
        "actionable_directives": mitigations
    }

def forecast_resources(payload):
    _, fuel_data = load_models()
    pipeline = fuel_data["pipeline"]

    temp = float(payload.get("ambient_temp_c", -28.0))
    crew = float(payload.get("active_crew_count", 46))
    snowcats = float(payload.get("active_snowcats", 2))
    annex = float(payload.get("science_annex_active", 1))
    current_fuel = float(payload.get("current_diesel_reserve_liters", 32000.0))
    current_rations = float(payload.get("current_rations_kg", 5400.0))

    input_df = pd.DataFrame([{
        "ambient_temp_c": temp,
        "active_crew_count": crew,
        "active_snowcats": snowcats,
        "science_annex_active": annex
    }])
    predicted_daily_burn = float(pipeline.predict(input_df)[0])
    daily_rations_burn = float(crew * 2.4)

    days_fuel_left = round(current_fuel / max(predicted_daily_burn, 1.0), 1)
    days_rations_left = round(current_rations / max(daily_rations_burn, 1.0), 1)

    return {
        "status": "success",
        "predicted_daily_diesel_liters": round(predicted_daily_burn, 1),
        "days_fuel_autonomy": days_fuel_left,
        "predicted_daily_rations_kg": round(daily_rations_burn, 1),
        "days_rations_autonomy": days_rations_left,
        "critical_fuel_threshold_days": 14,
        "is_fuel_critical": days_fuel_left < 14
    }

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: polar_ai.py <risk|forecast> '<json_payload>'"}))
        sys.exit(1)

    mode = sys.argv[1]
    try:
        payload = json.loads(sys.argv[2])
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON payload: {str(e)}"}))
        sys.exit(1)

    if mode == "risk":
        res = predict_risk(payload)
    elif mode == "forecast":
        res = forecast_resources(payload)
    else:
        res = {"error": f"Unknown mode: {mode}"}

    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
