from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from tensorflow.keras.applications.densenet import preprocess_input
from PIL import Image
import io

app = FastAPI()

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once at startup
print("[v0] Loading TensorFlow model...")
try:
    model = tf.keras.models.load_model("final_cervix_model_optimized.keras", compile=False)
    print("[v0] Model loaded successfully!")
except Exception as e:
    print(f"[v0] Error loading model: {e}")
    model = None

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Predict cervix image classification
    Returns: {"prediction": "Normal" | "Abnormal", "score": float}
    """
    try:
        if model is None:
            return {"error": "Model not loaded", "prediction": "Error", "score": 0}
        
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB").resize((288, 288))
        
        # Preprocess image
        img_array = np.expand_dims(preprocess_input(np.array(image, dtype=np.float32)), 0)
        
        # Make prediction
        pred = float(model.predict(img_array, verbose=0)[0][0])
        
        # Classify based on threshold
        threshold = 0.55
        result = "Abnormal" if pred >= threshold else "Normal"
        
        print(f"[v0] Prediction: {result}, Score: {pred:.4f}")
        
        return {
            "prediction": result,
            "score": round(pred, 4),
            "threshold": threshold,
            "class": result.lower()
        }
    except Exception as e:
        print(f"[v0] Prediction error: {e}")
        return {"error": str(e), "prediction": "Error", "score": 0}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    print("[v0] Starting FastAPI server on http://localhost:5000")
    uvicorn.run(app, host="0.0.0.0", port=5000)
