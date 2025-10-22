// Script to initialize Firebase with real admin users and sample data
import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, Timestamp, doc, setDoc } from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { getDoc } from "firebase/firestore"

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
const auth = getAuth(app)

async function initializeFirebaseData() {
  console.log("🚀 Initializing Firebase with real data...")

  try {
    console.log("📝 Creating admin users...")

    const adminUsers = [
      {
        email: "admin@cancerdetection.com",
        password: "admin123456",
        name: "System Administrator",
        role: "admin",
        permissions: ["manage_users", "view_analytics", "system_settings"],
      },
      {
        email: "superadmin@cancerdetection.com",
        password: "superadmin123",
        name: "Super Administrator",
        role: "superadmin",
        permissions: ["all"],
      },
      {
        email: "abcd@cancerdetection.com",
        password: "ABCD",
        name: "ABCD Administrator",
        role: "admin",
        permissions: ["manage_users", "view_analytics", "system_settings"],
      },
    ]

    for (const adminUser of adminUsers) {
      try {
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, adminUser.email, adminUser.password)
        const user = userCredential.user

        // Store admin data in admins collection
        const adminDocRef = await addDoc(collection(db, "admins"), {
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          permissions: adminUser.permissions,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })

        // Store user metadata in users collection
        await setDoc(doc(db, "users", user.uid), {
          email: adminUser.email,
          userType: "admin",
          dataId: adminDocRef.id,
          createdAt: Timestamp.now(),
        })

        console.log(`✅ Created admin: ${adminUser.email}`)
      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          console.log(`⚠️  Admin ${adminUser.email} already exists`)
        } else {
          console.error(`❌ Error creating admin ${adminUser.email}:`, error)
        }
      }
    }

    // Create Sample Hospitals
    console.log("🏥 Creating sample hospitals...")
    const hospitals = [
      {
        name: "City General Hospital",
        type: "Government" as const,
        city: "Mumbai",
        address: "123 Main Street, Mumbai, Maharashtra",
        phone: "+91-22-1234-5678",
        doctorIds: [],
      },
      {
        name: "Apollo Health Center",
        type: "Private" as const,
        city: "Delhi",
        address: "456 Health Avenue, Delhi",
        phone: "+91-11-9876-5432",
        doctorIds: [],
      },
      {
        name: "Rural Health Clinic",
        type: "Government" as const,
        city: "Pune",
        address: "789 Village Road, Pune, Maharashtra",
        phone: "+91-20-5555-1234",
        doctorIds: [],
      },
    ]

    const hospitalIds: string[] = []
    for (const hospital of hospitals) {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, "hospitals"), {
        ...hospital,
        createdAt: now,
        updatedAt: now,
      })
      hospitalIds.push(docRef.id)
      console.log(`✅ Created hospital: ${hospital.name}`)
    }

    // Create Sample Doctors
    console.log("👨‍⚕️ Creating sample doctors...")
    const doctors = [
      {
        name: "Dr. Priya Sharma",
        specialization: "Gynecology",
        phone: "+91-98765-43210",
        email: "dr.priya@hospital.com",
        experience: "10 years",
        username: "dr.priya",
        password: "doctor123",
        hospitalId: hospitalIds[0],
      },
      {
        name: "Dr. Rajesh Kumar",
        specialization: "Oncology",
        phone: "+91-87654-32109",
        email: "dr.rajesh@hospital.com",
        experience: "15 years",
        username: "dr.rajesh",
        password: "doctor123",
        hospitalId: hospitalIds[1],
      },
      {
        name: "Dr. Anita Patel",
        specialization: "General Medicine",
        phone: "+91-76543-21098",
        email: "dr.anita@hospital.com",
        experience: "8 years",
        username: "dr.anita",
        password: "doctor123",
        hospitalId: hospitalIds[2],
      },
    ]

    const hospitalToDoctorIds: Record<string, string[]> = {}

    for (const doctor of doctors) {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, "doctors"), {
        ...doctor,
        createdAt: now,
        updatedAt: now,
      })
      const hid = doctor.hospitalId
      hospitalToDoctorIds[hid] = hospitalToDoctorIds[hid] || []
      hospitalToDoctorIds[hid].push(docRef.id)
      console.log(`✅ Created doctor: ${doctor.name}`)
    }

    // Push doctor IDs into each hospital's doctorIds (unique)
    for (const hid of Object.keys(hospitalToDoctorIds)) {
      const hospSnap = await getDoc(doc(db, "hospitals", hid))
      const existing = (
        hospSnap.exists() && Array.isArray(hospSnap.data().doctorIds) ? hospSnap.data().doctorIds : []
      ) as string[]
      const updated = Array.from(new Set([...existing, ...hospitalToDoctorIds[hid]]))
      await setDoc(doc(db, "hospitals", hid), { doctorIds: updated }, { merge: true })
      console.log(`🔗 Linked ${hospitalToDoctorIds[hid].length} doctor(s) to hospital ${hid}`)
    }

    // Create Sample ASHA Workers
    console.log("👩‍⚕️ Creating sample ASHA workers...")
    const ashaWorkers = [
      {
        name: "Sunita Devi",
        phone: "+91-98765-11111",
        address: "Village Rampur, District Pune",
        experience: "5 years",
        username: "sunita.asha",
        password: "asha123",
      },
      {
        name: "Meera Kumari",
        phone: "+91-98765-22222",
        address: "Village Shivpur, District Mumbai",
        experience: "7 years",
        username: "meera.asha",
        password: "asha123",
      },
      {
        name: "Kavita Singh",
        phone: "+91-98765-33333",
        address: "Village Ganeshpur, District Delhi",
        experience: "3 years",
        username: "kavita.asha",
        password: "asha123",
      },
    ]

    const ashaWorkerIds: string[] = []
    for (const ashaWorker of ashaWorkers) {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, "ashaWorkers"), {
        ...ashaWorker,
        createdAt: now,
        updatedAt: now,
      })
      ashaWorkerIds.push(docRef.id)
      console.log(`✅ Created ASHA worker: ${ashaWorker.name}`)
    }

    // Create Sample Patients
    console.log("👩‍🦳 Creating sample patients...")
    const patients = [
      {
        patientId: "PAT001",
        name: "Lakshmi Devi",
        age: 35,
        gender: "Female",
        phone: "+91-98765-44444",
        address: "House No. 123, Village Rampur",
        medicalHistory: "No significant medical history",
        ashaWorkerId: ashaWorkerIds[0],
        password: "patient123",
      },
      {
        patientId: "PAT002",
        name: "Radha Sharma",
        age: 42,
        gender: "Female",
        phone: "+91-98765-55555",
        address: "House No. 456, Village Shivpur",
        medicalHistory: "Diabetes, Hypertension",
        ashaWorkerId: ashaWorkerIds[1],
        password: "patient123",
      },
      {
        patientId: "PAT003",
        name: "Geeta Patel",
        age: 28,
        gender: "Female",
        phone: "+91-98765-66666",
        address: "House No. 789, Village Ganeshpur",
        medicalHistory: "No significant medical history",
        ashaWorkerId: ashaWorkerIds[2],
        password: "patient123",
      },
    ]

    for (const patient of patients) {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, "patients"), {
        ...patient,
        createdAt: now,
        updatedAt: now,
      })
      console.log(`✅ Created patient: ${patient.name}`)
    }

    console.log("🎉 Firebase initialization completed successfully!")
    console.log("\n📋 Login Credentials:")
    console.log("Admin: admin@cancerdetection.com / admin123456")
    console.log("Super Admin: superadmin@cancerdetection.com / superadmin123")
    console.log("Doctor: dr.priya / doctor123")
    console.log("ASHA Worker: sunita.asha / asha123")
    console.log("Patient: PAT001 / patient123")
  } catch (error) {
    console.error("❌ Error initializing Firebase:", error)
  }
}

// Run the initialization
initializeFirebaseData()
