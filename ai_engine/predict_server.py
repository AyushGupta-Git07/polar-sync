import os
import json
from flask import Flask, request, jsonify
from polar_ai import predict_risk, forecast_resources

app = Flask(__name__)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "NCPOR Polar AI Decision Support Engine",
        "models": ["RandomForest Risk Classifier v1.0", "Ridge Fuel Forecaster v1.0"],
        "scikit_learn_version": "1.9.1"
    })

@app.route("/predict-risk", methods=["POST"])
def route_predict_risk():
    try:
        data = request.get_json(force=True) or {}
        result = predict_risk(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/forecast-resources", methods=["POST"])
def route_forecast_resources():
    try:
        data = request.get_json(force=True) or {}
        result = forecast_resources(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"[*] Starting NCPOR Polar AI Service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
