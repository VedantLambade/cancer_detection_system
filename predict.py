from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from tensorflow.keras.applications.densenet import preprocess_input
from PIL import Image, UnidentifiedImageError
import io
import os
import requests

app = FastAPI()

# === Enable CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Configuration ===
MODEL_URL = "https://huggingface.co/VedantJainnnn/cervixnet121/resolve/main/final_cervix_model_optimized.keras"
MODEL_LOCAL = "final_cervix_model_optimized.keras"
THRESHOLD = 0.55
IMG_SIZE = (288, 288)

# === Root route for testing ===
@app.get("/")
def root():
    return {"message": "✅ Cervical Cancer Detection API is running!", "predict_endpoint": "/predict"}

# === Download model if not present ===
if not os.path.exists(MODEL_LOCAL) or os.path.getsize(MODEL_LOCAL) < 1_000_000:
    print("[Render] 📦 Downloading model from Hugging Face...")
    try:
        r = requests.get(MODEL_URL, stream=True)
        r.raise_for_status()
        with open(MODEL_LOCAL, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        print("[Render] ✅ Model downloaded successfully!")
    except Exception as e:
        print(f"[Render] ❌ Error downloading model: {e}")

# === Load model ===
try:
    model = tf.keras.models.load_model(MODEL_LOCAL, compile=False)
    print("[Render] ✅ Model loaded successfully!")
except Exception as e:
    print(f"[Render] ❌ Error loading model: {e}")
    model = None

# === Image preprocessing ===
def preprocess_image(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize(IMG_SIZE)
        img_array = np.expand_dims(preprocess_input(np.array(img, dtype=np.float32)), 0)
        return img_array
    except UnidentifiedImageError:
        raise ValueError("Invalid or corrupted image file.")
    except Exception as e:
        raise ValueError(f"Unexpected image error: {e}")

# === Prediction Endpoint ===
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        if model is None:
            print("[Render] ❌ Model not loaded.")
            return {"error": "Model not loaded", "prediction": "Error", "score": 0}

        # ✅ Read file bytes
        contents = await file.read()
        if not contents:
            print("[Render] ⚠️ Empty file received.")
            return {"error": "Empty file", "prediction": "Error", "score": 0}

        print(f"[Render] ✅ Received file: {file.filename}, size: {len(contents)} bytes")

        # ✅ Preprocess the image
        try:
            img_array = preprocess_image(contents)
            print("[Render] ✅ Image processed successfully.")
        except Exception as e:
            print(f"[Render] ❌ Image processing error: {e}")
            return {"error": "Failed to process image", "details": str(e)}

        # ✅ Perform prediction
        try:
            pred = float(model.predict(img_array, verbose=0)[0][0])
        except Exception as e:
            print(f"[Render] ❌ Model prediction error: {e}")
            return {"error": "Model prediction failed", "details": str(e)}

        # ✅ Format result
        result = "Abnormal" if pred >= THRESHOLD else "Normal"
        print(f"[Render] ✅ Prediction complete → {result} (Score: {pred:.4f})")

        return {
            "prediction": result,
            "score": round(pred, 4),
            "threshold": THRESHOLD,
            "class": result.lower(),
            "filename": file.filename
        }

    except Exception as e:
        print(f"[Render] ❌ Unexpected server error: {e}")
        return {"error": "Internal server error", "details": str(e)}

# === Health check endpoint ===
@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}

# === Entry point for local testing ===
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    print(f"[Render] 🚀 Starting FastAPI server on port {port} ...")
    uvicorn.run(app, host="0.0.0.0", port=port)
