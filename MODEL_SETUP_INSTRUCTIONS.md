# Cervix Cancer Detection Model Setup

## Required Model File

The system requires the trained TensorFlow model file: **`final_cervix_model_optimized.keras`**

### Where to Place the Model File

1. **Download or obtain** `final_cervix_model_optimized.keras` from your training environment
2. **Place it in the project root directory** (same level as `predict.py`)

Your project structure should look like:
\`\`\`
cancerdetectionsystem34151/
├── predict.py
├── final_cervix_model_optimized.keras  ← Place model file here
├── app/
├── components/
├── lib/
└── ... other files
\`\`\`

## Step-by-Step Setup

### 1. Install Python Dependencies
\`\`\`bash
pip install fastapi uvicorn tensorflow pillow numpy
\`\`\`

### 2. Add the Model File
- Copy `final_cervix_model_optimized.keras` to the project root directory
- Verify the file exists: `ls final_cervix_model_optimized.keras`

### 3. Start the Model Server
\`\`\`bash
python predict.py
\`\`\`

You should see:
\`\`\`
[v0] Loading TensorFlow model...
[v0] Model loaded successfully!
[v0] Starting FastAPI server on http://localhost:5000
\`\`\`

### 4. In Another Terminal, Start the Frontend
\`\`\`bash
npm run dev
\`\`\`

## Troubleshooting

### Error: "Model not loaded"
- **Cause**: `final_cervix_model_optimized.keras` file not found
- **Solution**: 
  1. Check file exists in project root: `ls final_cervix_model_optimized.keras`
  2. Verify filename is exactly: `final_cervix_model_optimized.keras`
  3. Make sure it's in the same directory as `predict.py`

### Error: "Failed to fetch" from frontend
- **Cause**: Model server not running
- **Solution**: 
  1. Make sure `python predict.py` is running in a terminal
  2. Check server is accessible: `curl http://localhost:5000/health`
  3. Should return: `{"status":"ok","model_loaded":true}`

### Error: "Model not loaded" but file exists
- **Cause**: TensorFlow/Keras version mismatch
- **Solution**: 
  1. Update TensorFlow: `pip install --upgrade tensorflow`
  2. Restart the server: `python predict.py`

## Testing the Setup

### Test Model Server Health
\`\`\`bash
curl http://localhost:5000/health
\`\`\`

Expected response:
\`\`\`json
{"status":"ok","model_loaded":true}
\`\`\`

### Test Prediction with Sample Image
\`\`\`bash
curl -X POST -F "file=@sample_image.jpg" http://localhost:5000/predict
\`\`\`

Expected response:
\`\`\`json
{
  "prediction": "Normal",
  "score": 0.3456,
  "threshold": 0.55,
  "class": "normal"
}
\`\`\`

## Complete Workflow

1. ✅ Model server running: `python predict.py`
2. ✅ Frontend running: `npm run dev`
3. ✅ Login to AASHA Worker dashboard
4. ✅ Upload cervix image
5. ✅ Image saved to Vercel Blob
6. ✅ Prediction sent to model server
7. ✅ Result saved to Firebase
8. ✅ Frontend displays "NORMAL" or "ABNORMAL"

## Model File Details

The model file should be:
- **Format**: TensorFlow Keras (.keras)
- **Input**: 288x288 RGB images
- **Output**: Binary classification (Normal/Abnormal)
- **Threshold**: 0.55 (configurable in predict.py)

If you don't have the model file yet, you can train it using the `optimized-albu-data-generator.py` script provided in the project.
