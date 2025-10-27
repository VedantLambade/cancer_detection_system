from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from tensorflow.keras.applications.densenet import preprocess_input
from PIL import Image
import io
import os
import requests

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Model configuration ===
MODEL_URL = "https://huggingface.co/VedantJainnnn/cervixnet121/resolve/main/final_cervix_model_optimized.keras"
MODEL_LOCAL = "final_cervix_model_optimized.keras"
THRESHOLD = 0.55
IMG_SIZE = (288, 288)

# === Download model from Hugging Face if not exists ===
if not os.path.exists(MODEL_LOCAL):
    print("[Render] Downloading model from Hugging Face...")
    try:
        r = requests.get(MODEL_URL, stream=True)
        with open(MODEL_LOCAL, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        print("[Render] Model downloaded successfully!")
    except Exception as e:
        print(f"[Render] Error downloading model: {e}")

# === Load model ===
try:
    model = tf.keras.models.load_model(MODEL_LOCAL, compile=False)
    print("[Render] Model loaded successfully!")
except Exception as e:
    print(f"[Render] Error loading model: {e}")
    model = None

# === Preprocess image ===
def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize(IMG_SIZE)
    img_array = np.expand_dims(preprocess_input(np.array(img, dtype=np.float32)), 0)
    return img_array

# === Prediction API ===
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        if model is None:
            return {"error": "Model not loaded", "prediction": "Error", "score": 0}

        contents = await file.read()
        img_array = preprocess_image(contents)
        pred = float(model.predict(img_array, verbose=0)[0][0])
        result = "Abnormal" if pred >= THRESHOLD else "Normal"

        print(f"[Render] Prediction: {result}, Score: {pred:.4f}")

        return {
            "prediction": result,
            "score": round(pred, 4),
            "threshold": THRESHOLD,
            "class": result.lower()
        }
    except Exception as e:
        print(f"[Render] Prediction error: {e}")
        return {"error": str(e), "prediction": "Error", "score": 0}

# === Health check API ===
@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}

# === Entry point ===
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))  # Render provides PORT automatically
    print(f"[Render] Starting FastAPI server on port {port} ...")
    uvicorn.run(app, host="0.0.0.0", port=port)
