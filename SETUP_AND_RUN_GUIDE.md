# Cancer Detection System - Complete Setup & Run Guide

## Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed
- Firebase project created
- Vercel Blob storage configured

## Step 1: Install Dependencies

### Frontend Dependencies
\`\`\`bash
npm install
\`\`\`

### Python Backend Dependencies (for running the model locally)
\`\`\`bash
pip install tensorflow numpy opencv-python flask flask-cors pillow albumentations
\`\`\`

## Step 2: Environment Variables Setup

### In VS Code, create a `.env.local` file in the root directory:

\`\`\`env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_blob_token

# Model API Endpoint
NEXT_PUBLIC_CERVIX_MODEL_API=http://localhost:5000
\`\`\`

## Step 3: Run the Frontend

### In VS Code Terminal:
\`\`\`bash
npm run dev
\`\`\`

The app will be available at `http://localhost:3000`

## Step 4: Run the Python Model Server (Optional - if running locally)

### Create a new terminal in VS Code:

\`\`\`bash
# Navigate to your Python model directory
cd path/to/your/model

# Run the Flask server
python app.py
\`\`\`

The model API will be available at `http://localhost:5000/predict`

## Step 5: Test the Prediction Flow

1. **Login as ASHA Worker**
   - Email: shizuka@gmail.com
   - Navigate to Dashboard

2. **Add a Patient**
   - Fill in patient details
   - Upload a cervix image
   - Click "Add Patient"

3. **View Prediction Result**
   - The prediction will display as either:
     - ✅ **NORMAL** (green badge) - Routine follow-up
     - ⚠️ **ABNORMAL** (red badge) - Requires doctor review
   - Confidence percentage will be shown
   - Image is automatically saved to Vercel Blob
   - Prediction is saved to Firebase

## Step 6: Verify Data Storage

### Check Vercel Blob Storage:
- Images are stored with path: `cervix-images/{patientId}/{timestamp}.jpg`

### Check Firebase:
- Predictions are saved in `cervixAnalysis` collection
- Each record contains:
  - `patientId`: Patient identifier
  - `imageUrl`: Blob storage URL
  - `analysis`: AI analysis result
  - `riskLevel`: "high" or "low"
  - `ashaWorkerId`: ASHA worker who uploaded
  - `timestamp`: When analysis was performed

## Troubleshooting

### "Failed to fetch" Error
- Ensure model API is running on `http://localhost:5000`
- Check `NEXT_PUBLIC_CERVIX_MODEL_API` environment variable

### "Model prediction failed" Error
- Verify the image format is supported (JPG, PNG)
- Check model server logs for detailed error
- Ensure image size is reasonable (< 10MB)

### Firebase Connection Issues
- Verify Firebase credentials in `.env.local`
- Check Firebase project has Firestore database enabled
- Ensure Firestore rules allow write access

### Blob Storage Issues
- Verify `BLOB_READ_WRITE_TOKEN` is correct
- Check Vercel project has Blob storage enabled

## Production Deployment

### Deploy to Vercel:
\`\`\`bash
npm run build
vercel deploy
\`\`\`

### Set Environment Variables in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Redeploy the project

## API Endpoints

### POST /api/predict
- **Input**: FormData with `image` (File) and `patientId` (string)
- **Output**: 
  \`\`\`json
  {
    "success": true,
    "class": "normal" | "abnormal",
    "confidence": 0.95,
    "imageUrl": "blob-storage-url",
    "predictionId": "firebase-doc-id"
  }
  \`\`\`

## File Structure

\`\`\`
├── app/
│   ├── api/
│   │   └── predict/
│   │       └── route.ts          # Prediction API endpoint
│   └── aasha-worker/
│       └── dashboard/
│           └── page.tsx          # ASHA worker dashboard
├── components/
│   └── aasha-worker/
│       └── add-patient-form.tsx  # Patient registration with image upload
├── lib/
│   ├── blob-service.ts           # Vercel Blob integration
│   ├── prediction-service.ts     # Firebase prediction storage
│   ├── firebase-services.ts      # Firebase utilities
│   └── firebase-config.ts        # Firebase configuration
└── .env.local                    # Environment variables (create this)
\`\`\`

## Next Steps

1. ✅ Set up environment variables
2. ✅ Run `npm install`
3. ✅ Start frontend with `npm run dev`
4. ✅ Start model server with `python app.py`
5. ✅ Test prediction flow
6. ✅ Deploy to Vercel

---

**Note**: The prediction result displays in real-time on the form as either "NORMAL" or "ABNORMAL" with confidence percentage.
