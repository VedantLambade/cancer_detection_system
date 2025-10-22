// Authentication utilities with Firebase integration
import { loginWithEmailPassword, registerUser, createAdminUser } from "./firebase-auth"

export interface User {
  email: string
  password: string
  role: "admin" | "aasha_worker" | "doctor" | "patient"
  name: string
  id: string
}

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  try {
    console.log("[v0] Authenticating user:", { email })

    const firebaseResult = await loginWithEmailPassword(email, password)

    if (firebaseResult.success && firebaseResult.user) {
      const roleMapping: { [key: string]: "admin" | "aasha_worker" | "doctor" | "patient" } = {
        admin: "admin",
        doctor: "doctor",
        patient: "patient",
        ashaWorker: "aasha_worker",
      }
      const mappedRole = roleMapping[firebaseResult.user.userType] ?? "patient"

      const safeName = firebaseResult.user.userData?.name || firebaseResult.user.userData?.email || email

      return {
        email: firebaseResult.user.userData?.email || email,
        password,
        role: mappedRole,
        name: safeName,
        id: firebaseResult.user.userData?.id || firebaseResult.user.uid,
      }
    } else {
      const reason = (firebaseResult as any)?.error || "Login failed. Please try again."
      console.error("[v0] Authentication failed:", reason)
      throw new Error(reason)
    }
  } catch (error) {
    console.error("[v0] Authentication error:", error)
    throw error instanceof Error ? error : new Error("Login failed. Please try again.")
  }
}

export const registerNewUser = async (
  email: string,
  password: string,
  userType: "doctor" | "ashaWorker" | "patient",
  userData: any,
): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    const result = await registerUser(email, password, userType, userData)

    if (result.success && result.user) {
      return {
        success: true,
        user: {
          email: result.user.userData.email || email,
          password,
          role: (result.user.userType === "ashaWorker" ? "aasha_worker" : result.user.userType) as
            | "admin"
            | "aasha_worker"
            | "doctor"
            | "patient",
          name: result.user.userData.name,
          id: result.user.userData?.id || result.user.uid,
        },
      }
    } else {
      return {
        success: false,
        error: result.error || "Registration failed",
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    }
  }
}

export const createAdmin = async (adminData: {
  name: string
  email: string
  phone: string
  password: string
  region: string
}): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    const result = await createAdminUser(adminData)

    if (result.success && result.user) {
      return {
        success: true,
        user: {
          email: result.user.userData.email,
          password: adminData.password,
          role: "admin",
          name: result.user.userData.name,
          id: result.user.uid,
        },
      }
    } else {
      return {
        success: false,
        error: result.error || "Admin creation failed",
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Admin creation failed",
    }
  }
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null
  const userData = localStorage.getItem("currentUser")
  return userData ? JSON.parse(userData) : null
}

export const setCurrentUser = (user: User): void => {
  localStorage.setItem("currentUser", JSON.stringify(user))
}

export const logout = (): void => {
  localStorage.removeItem("currentUser")
}

// Central helper to compute dashboard path by role
export const getDashboardPathForRole = (role: User["role"]) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard"
    case "doctor":
      return "/doctor/dashboard"
    case "aasha_worker":
      return "/aasha-worker/dashboard"
    case "patient":
    default:
      return "/patient/dashboard"
  }
}
