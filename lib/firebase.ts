// Firebase configuration and initialization
import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCldD-vnbNPv-jAAIk3_RoPaDfauHOXefk",
  authDomain: "environmentalimpacttracker.firebaseapp.com",
  projectId: "environmentalimpacttracker",
  storageBucket: "environmentalimpacttracker.firebasestorage.app",
  messagingSenderId: "682710927256",
  appId: "1:682710927256:web:e95b0911644d4c21c24ded",
  measurementId: "G-DBSSL9FLG7",
}

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Initialize Firebase services
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)

export default app
