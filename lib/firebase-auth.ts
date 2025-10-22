// Firebase authentication service for login functionality
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase"
import { doctorService, ashaWorkerService, patientService, hospitalService } from "./firebase-services"

export interface AuthUser {
  uid: string
  email: string | null
  userType: "admin" | "doctor" | "ashaWorker" | "patient"
  userData: any
}

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms))

export const registerUser = async (
  email: string,
  password: string,
  userType: "doctor" | "ashaWorker" | "patient",
  userData: any,
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    let docId: string
    switch (userType) {
      case "doctor":
        docId = await doctorService.create({
          ...userData,
          email,
        })
        break
      case "ashaWorker":
        docId = await ashaWorkerService.create({
          ...userData,
          email,
        })
        break
      case "patient":
        docId = await patientService.create({
          ...userData,
          email,
        })
        break
      default:
        throw new Error("Invalid user type")
    }

    await setDoc(doc(db, "users", user.uid), {
      email,
      userType,
      dataId: docId,
      createdAt: new Date(),
    })

    if (userType === "doctor" && userData?.hospitalId) {
      try {
        const hosp = await hospitalService.getById(userData.hospitalId)
        const current = Array.isArray(hosp?.doctorIds) ? hosp!.doctorIds : []
        const updated = Array.from(new Set([...current, docId]))
        await hospitalService.update(userData.hospitalId, { doctorIds: updated })
      } catch (e) {
        console.error("[v0] Failed to link doctor to hospital:", e)
      }
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        userType,
        userData: { ...userData, id: docId, email },
      },
    }
  } catch (error) {
    console.error("[v0] Firebase registration error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    }
  }
}

export const createAdminUser = async (adminData: {
  name: string
  email: string
  phone: string
  password: string
  region: string
}) => {
  try {
    console.log("[v0] Creating admin user:", adminData.email)

    let user: User | null = null

    try {
      // Try to create; if the email already exists, we will sign in instead
      const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password)
      user = userCredential.user
      console.log("[v0] Firebase Auth user created:", user.uid)
    } catch (e: any) {
      if (e?.code === "auth/email-already-in-use") {
        console.log("[v0] Email already exists, signing in instead")
        const signedIn = await signInWithEmailAndPassword(auth, adminData.email, adminData.password)
        user = signedIn.user
        console.log("[v0] Signed in existing user:", user.uid)
      } else {
        throw e
      }
    }

    if (!user) {
      throw new Error("Unable to establish an authenticated session")
    }

    await user.getIdToken(true)
    await wait(300)

    const writeProfile = async () =>
      setDoc(
        doc(db, "users", user!.uid),
        {
          email: adminData.email,
          userType: "admin",
          dataId: user!.uid,
          name: adminData.name,
          phone: adminData.phone,
          region: adminData.region,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      )

    try {
      await writeProfile()
      console.log("[v0] User metadata with role=admin created at users/{uid}")
    } catch (firstErr: any) {
      console.log("[v0] First write failed, retrying after re-auth:", firstErr?.message || firstErr)
      await signInWithEmailAndPassword(auth, adminData.email, adminData.password)
      await auth.currentUser?.getIdToken(true)
      await wait(300)
      await writeProfile()
      console.log("[v0] User metadata write succeeded on retry")
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        userType: "admin" as const,
        userData: {
          id: user.uid,
          email: adminData.email,
          name: adminData.name,
          phone: adminData.phone,
          region: adminData.region,
          role: "admin",
        },
      },
    }
  } catch (error: any) {
    const msg =
      typeof error?.message === "string" && /insufficient permissions|permission/i.test(error.message)
        ? "Missing or insufficient permissions when writing users/{uid}. Ensure Firestore rules allow an authenticated user to create and read their own users/{uid} document."
        : error instanceof Error
          ? error.message
          : "Admin creation failed"
    console.error("[v0] Admin creation error:", msg)
    return {
      success: false,
      error: msg,
    }
  }
}

export const loginWithEmailPassword = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Resolve role and minimal profile info without touching admins/doctors/asha/patients collections.
    let meta: { userType: "doctor" | "ashaWorker" | "patient" | "admin"; dataId?: string } | null = null
    try {
      const userMapSnap = await getDoc(doc(db, "users", user.uid))
      if (userMapSnap.exists()) {
        meta = userMapSnap.data() as any
      }
    } catch (permErr) {
      console.error("[v0] Permission error reading users profile:", permErr)
      console.warn(
        "[v0] Falling back to default role 'patient' due to profile read permissions. Update Firestore rules for users/{uid}.",
      )
      meta = { userType: "patient", dataId: user.uid } as any
    }

    if (!meta) {
      console.warn("[v0] No users/{uid} mapping found; falling back to default role 'patient'.")
      meta = { userType: "patient", dataId: user.uid } as any
    }

    const basicUserData = {
      id: meta.dataId || user.uid,
      email: user.email,
      name: user.displayName || (user.email ? user.email.split("@")[0] : undefined) || "User",
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        userType: meta.userType,
        userData: basicUserData,
      },
    }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    }
  }
}

export const logout = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Logout failed",
    }
  }
}

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}
