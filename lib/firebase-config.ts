// Firebase configuration file
// This file exports the Firebase configuration object for use in the application

export const firebaseConfig = {
  apiKey: "AIzaSyCldD-vnbNPv-jAAIk3_RoPaDfauHOXefk",
  authDomain: "environmentalimpacttracker.firebaseapp.com",
  projectId: "environmentalimpacttracker",
  storageBucket: "environmentalimpacttracker.firebasestorage.app",
  messagingSenderId: "682710927256",
  appId: "1:682710927256:web:e95b0911644d4c21c24ded",
  measurementId: "G-DBSSL9FLG7",
}

// Note: This configuration is used by lib/firebase.ts to initialize Firebase services
// All demo data has been removed from the frontend components and replaced with Firebase integration
// Real user data is now fetched from Firestore collections for patients, doctors, and ASHA workers
