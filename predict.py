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

# === Enable CORS (Allow Frontend Access) ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can later restrict this to your Vercel URL
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
    return {
        "message": "✅ Cervical Cancer Detection API is running successfully!",
        "predict_endpoint": "/predict"
    }

# === Download model if not present ===
if not os.path.exists(MODEL_LOCAL) or os.path.getsize(MODEL_LOCAL) < 1_000_000:
    print("[Render] 📦 Downloading model from Hugging Face...")
    try:
        response = requests.get(MODEL_URL, stream=True)
        response.raise_for_status()
        with open(MODEL_LOCAL, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
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

# === Image preprocessing function ===
def preprocess_image(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize(IMG_SIZE)
        img_array = np.expand_dims(preprocess_input(np.array(img, dtype=np.float32)), 0)
        return img_array
    except UnidentifiedImageError:
        raise ValueError("Invalid or corrupted image file.")
    except Exception as e:
        raise ValueError(f"Unexpected image processing error: {e}")

# === Prediction Endpoint ===
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Ensure model is loaded
        if model is None:
            print("[Render] ❌ Model not loaded.")
            return {"error": "Model not loaded", "prediction": "Error", "score": 0}

        # Read file bytes
        contents = await file.read()
        if not contents:
            print("[Render] ⚠️ Empty file received.")
            return {"error": "Empty file", "prediction": "Error", "score": 0}

        print(f"[Render] ✅ Received file: {file.filename} | Size: {len(contents)} bytes")

        # Preprocess image
        try:
            img_array = preprocess_image(contents)
            print("[Render] ✅ Image processed successfully.")
        except Exception as e:
            print(f"[Render] ❌ Image processing error: {e}")
            return {"error": "Failed to process image", "details": str(e)}

        # Perform prediction
        try:
            prediction = float(model.predict(img_array, verbose=0)[0][0])
        except Exception as e:
            print(f"[Render] ❌ Prediction error: {e}")
            return {"error": "Model prediction failed", "details": str(e)}

        # Determine result
        label = "Abnormal" if prediction >= THRESHOLD else "Normal"
        print(f"[Render] ✅ Prediction complete → {label} (Score: {prediction:.4f})")

        # Send JSON response
        return {
            "filename": file.filename,
            "prediction": label,
            "score": round(prediction, 4),
            "threshold": THRESHOLD,
            "class": label.lower()
        }

    except Exception as e:
        print(f"[Render] ❌ Unexpected server error: {e}")
        return {"error": "Internal server error", "details": str(e)}

# === Health check endpoint ===
@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}

# === Entry point for Render deployment ===
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))  # ✅ Render uses dynamic port
    print(f"[Render] 🚀 Starting FastAPI server on port {port} ...")
    uvicorn.run(app, host="0.0.0.0", port=port)
