// Script to initialize Firestore database with proper collections and indexes
import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCHgMz0UUd0f0HxuZHn0Uf02I3PCZd72vk",
  authDomain: "excellent-flag-455604-h1.firebaseapp.com",
  projectId: "excellent-flag-455604-h1",
  storageBucket: "excellent-flag-455604-h1.firebasestorage.app",
  messagingSenderId: "892310753649",
  appId: "1:892310753649:web:bd7298455dd2e11ffe66d0",
  measurementId: "G-12R5GGPWRG",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function initializeFirestore() {
  try {
    console.log("[v0] Initializing Firestore database...")

    // Create collections with initial documents to establish structure

    // Initialize patients collection
    await setDoc(doc(db, "patients", "_schema"), {
      _description: "Patient records collection",
      fields: {
        patientId: "string - unique patient identifier",
        name: "string - patient full name",
        age: "number - patient age",
        gender: "string - patient gender",
        phone: "string - contact number",
        address: "string - patient address",
        medicalHistory: "string - medical background",
        ashaWorkerId: "string - assigned ASHA worker ID",
        createdAt: "timestamp - creation date",
        updatedAt: "timestamp - last update date",
      },
    })

    // Initialize ashaWorkers collection
    await setDoc(doc(db, "ashaWorkers", "_schema"), {
      _description: "ASHA workers collection",
      fields: {
        name: "string - ASHA worker full name",
        phone: "string - contact number",
        address: "string - worker address",
        experience: "string - work experience",
        username: "string - login username",
        password: "string - login password",
        createdAt: "timestamp - creation date",
        updatedAt: "timestamp - last update date",
      },
    })

    // Initialize doctors collection
    await setDoc(doc(db, "doctors", "_schema"), {
      _description: "Doctors collection",
      fields: {
        name: "string - doctor full name",
        specialization: "string - medical specialization",
        phone: "string - contact number",
        email: "string - email address",
        experience: "string - medical experience",
        username: "string - login username",
        password: "string - login password",
        createdAt: "timestamp - creation date",
        updatedAt: "timestamp - last update date",
      },
    })

    // Initialize cervixAnalyses collection
    await setDoc(doc(db, "cervixAnalyses", "_schema"), {
      _description: "Cervix analysis records collection",
      fields: {
        patientId: "string - reference to patient",
        imageUrl: "string - stored image URL",
        analysis: "string - analysis results",
        riskLevel: "string - low/medium/high risk assessment",
        doctorId: "string - reviewing doctor ID (optional)",
        ashaWorkerId: "string - conducting ASHA worker ID",
        createdAt: "timestamp - analysis date",
      },
    })

    // Initialize chats collection for doctor-patient communication
    await setDoc(doc(db, "chats", "_schema"), {
      _description: "Chat messages between doctors and patients",
      fields: {
        patientId: "string - patient ID",
        doctorId: "string - doctor ID",
        senderId: "string - message sender ID",
        senderType: "string - doctor/patient",
        message: "string - chat message content",
        timestamp: "timestamp - message time",
        isRead: "boolean - message read status",
      },
    })

    // Initialize calls collection for video call records
    await setDoc(doc(db, "calls", "_schema"), {
      _description: "Video call records between doctors and patients",
      fields: {
        patientId: "string - patient ID",
        doctorId: "string - doctor ID",
        callId: "string - unique call identifier",
        status: "string - ongoing/completed/missed",
        startTime: "timestamp - call start time",
        endTime: "timestamp - call end time (optional)",
        duration: "number - call duration in minutes",
      },
    })

    // Initialize admin collection for system administrators
    await setDoc(doc(db, "admins", "_schema"), {
      _description: "System administrators collection",
      fields: {
        name: "string - admin full name",
        email: "string - admin email",
        username: "string - login username",
        password: "string - login password",
        role: "string - admin role level",
        createdAt: "timestamp - creation date",
        updatedAt: "timestamp - last update date",
      },
    })

    console.log("[v0] Firestore database initialized successfully!")
    console.log("[v0] Collections created:")
    console.log("- patients")
    console.log("- ashaWorkers")
    console.log("- doctors")
    console.log("- cervixAnalyses")
    console.log("- chats")
    console.log("- calls")
    console.log("- admins")
  } catch (error) {
    console.error("[v0] Error initializing Firestore:", error)
  }
}

// Run the initialization
initializeFirestore()
