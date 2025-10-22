# Complete Setup Guide - Cancer Detection System

## Overview
This guide provides step-by-step instructions to run the entire cancer detection system with:
- Frontend (Next.js) with Vercel Blob storage
- Python ML model server
- Firebase backend
- ASHA worker dashboard

---

## Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed
- Vercel Blob token (provided)
- Firebase project configured
- `final_cervix_model_optimized.keras` model file

---

## Step 1: Setup Environment Variables

### 1.1 Create `.env.local` file in project root

\`\`\`bash
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_S6jh81Q8pDxpmOzc_WChFmITkY71tKqqTeIE7IxcGFwqm8M

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCldD-vnbNPv-jAAIk3_RoPaDfauHOXefk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=environmentalimpacttracker.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=environmentalimpacttracker
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=environmentalimpacttracker.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=682710927256
NEXT_PUBLIC_FIREBASE_APP_ID=1:682710927256:web:e95b0911644d4c21c24ded
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-DBSSL9FLG7

# Model API (Python Server)
NEXT_PUBLIC_CERVIX_MODEL_API=http://localhost:5000
\`\`\`

### 1.2 Verify `.env.local` is in `.gitignore`
\`\`\`bash
echo ".env.local" >> .gitignore
\`\`\`

---

## Step 2: Install Dependencies

### 2.1 Install Node.js dependencies
\`\`\`bash
npm install
\`\`\`

### 2.2 Install Python dependencies
\`\`\`bash
pip install fastapi uvicorn tensorflow pillow numpy python-multipart
\`\`\`

---

## Step 3: Prepare Model File

### 3.1 Place the model file
- Copy `final_cervix_model_optimized.keras` to the project root directory
- Same level as `predict.py`

\`\`\`
project-root/
├── predict.py
├── final_cervix_model_optimized.keras  ← Place here
├── app/
├── components/
├── lib/
└── ...
\`\`\`

---

## Step 4: Run the System

### Terminal 1: Start Python Model Server

\`\`\`bash
# Navigate to project root
cd /path/to/cancerdetectionsystem34151

# Run the model server
python predict.py
\`\`\`

**Expected output:**
\`\`\`
[v0] Loading TensorFlow model...
[v0] Model loaded successfully!
[v0] Starting FastAPI server on http://localhost:5000
INFO:     Started server process [14064]
INFO:     Uvicorn running on http://0.0.0.0:5000
\`\`\`

**Keep this terminal open!**

---

### Terminal 2: Start Next.js Frontend

\`\`\`bash
# Open a new terminal
# Navigate to project root
cd /path/to/cancerdetectionsystem34151

# Start development server
npm run dev
\`\`\`

**Expected output:**
\`\`\`
> next dev
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
\`\`\`

---

## Step 5: Access the Application

1. **Open browser:** http://localhost:3000
2. **Login as ASHA Worker** with your credentials
3. **Navigate to:** `/aasha-worker/dashboard`
4. **Click:** "Add Patient"
5. **Fill in patient details**
6. **Upload cervix image**
7. **Click:** "Add Patient"

---

## Step 6: What Happens Automatically

### Image Upload Flow:
1. ✅ Image uploaded to Vercel Blob storage
2. ✅ Success message shown immediately (no waiting)
3. ✅ Background: Model processes prediction
4. ✅ Background: Results saved to Firebase
5. ✅ Results available in patient dashboard

### Data Saved to Firebase:
- Patient information
- Cervix image URL (from Blob)
- AI prediction (Normal/Abnormal)
- Confidence score
- Timestamp
- ASHA worker ID

---

## Troubleshooting

### Issue: "Failed to fetch" error
**Solution:** Make sure Python server is running on Terminal 1
\`\`\`bash
python predict.py
\`\`\`

### Issue: Model file not found
**Solution:** Ensure `final_cervix_model_optimized.keras` is in project root
\`\`\`bash
ls -la final_cervix_model_optimized.keras
\`\`\`

### Issue: Port 5000 already in use
**Solution:** Kill the process using port 5000
\`\`\`bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
\`\`\`

### Issue: Port 3000 already in use
**Solution:** Use a different port
\`\`\`bash
npm run dev -- -p 3001
\`\`\`

### Issue: Firebase connection error
**Solution:** Verify `.env.local` has correct Firebase credentials
\`\`\`bash
cat .env.local | grep FIREBASE
\`\`\`

---

## System Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│              http://localhost:3000                           │
│  - ASHA Worker Dashboard                                     │
│  - Patient Registration                                      │
│  - Image Upload                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────────┐
│ Vercel Blob  │   │ API Route        │
│ Storage      │   │ /api/predict     │
│ (Images)     │   │ (Node.js)        │
└──────────────┘   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Python Server    │
                   │ localhost:5000   │
                   │ (TensorFlow)     │
                   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Firebase         │
                   │ - Predictions    │
                   │ - Patient Data   │
                   │ - Analysis       │
                   └──────────────────┘
\`\`\`

---

## Key Features

✅ **Async Processing** - Image uploads instantly, prediction runs in background
✅ **Blob Storage** - Images stored securely in Vercel Blob
✅ **Firebase Integration** - All data persisted in Firestore
✅ **Real-time Results** - Predictions saved automatically
✅ **ASHA Worker Dashboard** - Track all patient registrations
✅ **AI Analysis** - DenseNet121 model for cervix cancer detection

---

## Next Steps

1. Test with sample cervix images
2. Monitor predictions in Firebase console
3. Deploy to Vercel when ready
4. Configure production Firebase project
5. Set up doctor review workflow

---

## Support

For issues or questions:
1. Check debug logs in browser console
2. Verify all environment variables are set
3. Ensure both servers (Node.js and Python) are running
4. Check Firebase project permissions
