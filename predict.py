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

# Model configuration
MODEL_URL = "https://huggingface.co/VedantJainnnn/cervixnet121/resolve/main/final_cervix_model_optimized.keras"
MODEL_LOCAL = "final_cervix_model_optimized.keras"
THRESHOLD = 0.55
IMG_SIZE = (288, 288)

# Download model if not exists
if not os.path.exists(MODEL_LOCAL):
    print("[v0] Downloading model from Hugging Face...")
    try:
        r = requests.get(MODEL_URL, stream=True)
        with open(MODEL_LOCAL, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        print("[v0] Model downloaded successfully!")
    except Exception as e:
        print(f"[v0] Error downloading model: {e}")

# Load model
try:
    model = tf.keras.models.load_model(MODEL_LOCAL, compile=False)
    print("[v0] Model loaded successfully!")
except Exception as e:
    print(f"[v0] Error loading model: {e}")
    model = None

def preprocess_image(image_bytes):
    """Preprocess image for model inference."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize(IMG_SIZE)
    img_array = np.expand_dims(preprocess_input(np.array(img, dtype=np.float32)), 0)
    return img_array

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        if model is None:
            return {"error": "Model not loaded", "prediction": "Error", "score": 0}

        contents = await file.read()
        img_array = preprocess_image(contents)

        pred = float(model.predict(img_array, verbose=0)[0][0])
        result = "Abnormal" if pred >= THRESHOLD else "Normal"

        print(f"[v0] Prediction: {result}, Score: {pred:.4f}")

        return {
            "prediction": result,
            "score": round(pred, 4),
            "threshold": THRESHOLD,
            "class": result.lower()
        }
    except Exception as e:
        print(f"[v0] Prediction error: {e}")
        return {"error": str(e), "prediction": "Error", "score": 0}

@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    print("[v0] Starting FastAPI server on http://localhost:5000")
    uvicorn.run(app, host="0.0.0.0", port=5000)
