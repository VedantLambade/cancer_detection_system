# Cancer Detection System - Complete Setup Guide

## Overview
This system captures cervix images, sends them to a TensorFlow model for prediction, saves images to Vercel Blob, and stores predictions in Firebase.

## Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed
- Firebase project set up
- Vercel Blob storage configured

## Step 1: Install Python Dependencies

Open a terminal and run:

\`\`\`bash
pip install fastapi uvicorn tensorflow pillow numpy
\`\`\`

## Step 2: Prepare Your Model File

Make sure you have your trained model file in the project root:
- File name: `final_cervix_model_optimized.keras`
- Location: Same directory as `predict.py`

## Step 3: Start the Python Model Server

In VS Code, open a NEW terminal (Ctrl+Shift+`) and run:

\`\`\`bash
python predict.py
\`\`\`

You should see:
\`\`\`
[v0] Loading TensorFlow model...
[v0] Model loaded successfully!
[v0] Starting FastAPI server on http://localhost:5000
\`\`\`

**Keep this terminal open!** The server must be running for predictions to work.

## Step 4: Start the Next.js Frontend

In a DIFFERENT terminal, run:

\`\`\`bash
npm run dev
\`\`\`

You should see:
\`\`\`
> next dev
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
\`\`\`

## Step 5: Test the System

1. Open http://localhost:3000 in your browser
2. Login as ASHA Worker
3. Go to Dashboard → Add Patient
4. Upload a cervix image
5. Wait for prediction (Normal/Abnormal)
6. Check Firebase Console → Collections → modelPredictions to see saved data

## What Happens Behind the Scenes

1. **Image Upload** → Saved to Vercel Blob Storage
2. **Model Prediction** → Sent to Python server at http://localhost:5000/predict
3. **Firebase Save** → Prediction stored with image URL, confidence score, and metadata
4. **Frontend Display** → Shows "NORMAL" (green) or "ABNORMAL" (red)

## Firebase Data Structure

Each prediction is saved as:
\`\`\`json
{
  "patientId": "patient-id",
  "imageUrl": "https://blob.vercel-storage.com/...",
  "modelClass": "normal" | "abnormal",
  "confidence": 0.95,
  "rawPrediction": 0.3,
  "threshold": 0.55,
  "ashaWorkerId": "worker-id",
  "modelVersion": "densenet121-optimized-v1",
  "createdAt": "2024-10-18T..."
}
\`\`\`

## Troubleshooting

### "Failed to fetch" error
- Check if Python server is running: http://localhost:5000/health
- Make sure port 5000 is not blocked
- Verify model file exists: `final_cervix_model_optimized.keras`

### Model not loading
- Check file path and name
- Verify TensorFlow version compatibility
- Run: \`python -c "import tensorflow; print(tensorflow.__version__)"\`

### Firebase errors
- Check environment variables in Vars section
- Verify Firebase credentials are correct
- Check Firestore rules allow writes to \`modelPredictions\` collection

### Image not uploading to Blob
- Verify Blob integration is connected
- Check BLOB_READ_WRITE_TOKEN in environment variables
- Ensure image file is valid (JPG, PNG, JPEG)

## Deployment

### Deploy Frontend to Vercel
\`\`\`bash
npm run build
vercel deploy
\`\`\`

### Deploy Python Server
Use Render, Railway, or Heroku:
1. Create account on Render.com
2. Connect GitHub repository
3. Set environment: Python 3.9
4. Build command: \`pip install -r requirements.txt\`
5. Start command: \`uvicorn predict:app --host 0.0.0.0 --port 10000\`
6. Update API URL in frontend to deployed server

## Environment Variables Needed

\`\`\`
NEXT_PUBLIC_CERVIX_MODEL_API=http://localhost:5000
BLOB_READ_WRITE_TOKEN=your_blob_token
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

## Support

If you encounter issues:
1. Check debug logs in browser console (F12)
2. Check server logs in terminal
3. Verify all services are running
4. Check Firebase Firestore rules
