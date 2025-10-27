"""
CervixNet121 Model API Server
Serves the trained DenseNet121 cervix classification model via Flask.
Accepts cervix images and returns Normal/Abnormal predictions with confidence.
"""

import os
import json
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
from datetime import datetime
import requests
import base64

# ------------------------------------------------------------
# Initialize Flask App
# ------------------------------------------------------------
app = Flask(__name__)
CORS(app)

# ------------------------------------------------------------
# Model Configuration
# ------------------------------------------------------------
MODEL_URL = os.getenv(
    "MODEL_URL",
    "https://huggingface.co/VedantJainnnn/cervixnet121/resolve/main/final_cervix_model_optimized.keras"
)
MODEL_LOCAL = "final_cervix_model_optimized.keras"
THRESHOLD = float(os.getenv("PREDICTION_THRESHOLD", "0.55"))
IMG_SIZE = (288, 288)

# ------------------------------------------------------------
# Download model from Hugging Face if not exists
# ------------------------------------------------------------
if not os.path.exists(MODEL_LOCAL):
    try:
        print("⏳ Downloading model from Hugging Face...")
        r = requests.get(MODEL_URL, stream=True, timeout=60)
        r.raise_for_status()
        with open(MODEL_LOCAL, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        print("✅ Model downloaded successfully!")
    except Exception as e:
        print(f"❌ Failed to download model: {e}")

# ------------------------------------------------------------
# Load model
# ------------------------------------------------------------
try:
    model = tf.keras.models.load_model(MODEL_LOCAL, compile=False)
    print(f"✅ Model loaded successfully from {MODEL_LOCAL}")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    model = None

# ------------------------------------------------------------
# Image Preprocessing
# ------------------------------------------------------------
def preprocess_image(image_bytes):
    """Preprocess image for model inference."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize(IMG_SIZE)
        img_array = np.array(img, dtype=np.float32)
        img_array = tf.keras.applications.densenet.preprocess_input(img_array)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {str(e)}")

# ------------------------------------------------------------
# Prediction Logic
# ------------------------------------------------------------
def predict_cervix(image_bytes):
    """Run inference on cervix image."""
    if model is None:
        raise RuntimeError("Model not loaded")

    img_array = preprocess_image(image_bytes)
    prediction = float(model.predict(img_array, verbose=0)[0][0])

    is_abnormal = prediction >= THRESHOLD
    class_name = "Abnormal" if is_abnormal else "Normal"
    confidence = prediction if is_abnormal else (1 - prediction)

    return {
        "class": class_name,
        "confidence": round(float(confidence), 4),
        "raw_score": round(prediction, 4),
        "threshold": THRESHOLD,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# ------------------------------------------------------------
# Routes
# ------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "threshold": THRESHOLD
    })

@app.route("/predict", methods=["POST"])
def predict():
    """Predict single cervix image."""
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]
        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        image_bytes = file.read()
        result = predict_cervix(image_bytes)
        return jsonify(result), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    """Predict multiple images (base64 list)."""
    try:
        data = request.get_json()
        if not data or "images" not in data:
            return jsonify({"error": "No images provided"}), 400

        results = []
        for img_b64 in data["images"]:
            try:
                image_bytes = base64.b64decode(img_b64)
                result = predict_cervix(image_bytes)
                results.append(result)
            except Exception as e:
                results.append({"error": str(e)})

        return jsonify({"predictions": results}), 200
    except Exception as e:
        return jsonify({"error": f"Batch prediction failed: {str(e)}"}), 500

# ------------------------------------------------------------
# App Entry Point (Render / Local)
# ------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Starting CervixNet121 Flask server on port {port} ...")
    app.run(host="0.0.0.0", port=port, debug=False)
