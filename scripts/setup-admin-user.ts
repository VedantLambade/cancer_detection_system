// Script to create the default admin user in Firebase
import { adminService } from "../lib/firebase-services"

async function setupAdminUser() {
  try {
    console.log("[v0] Setting up admin user...")

    // Check if admin already exists
    const existingAdmin = await adminService.getByEmail("abcd@cancerdetection.com")

    if (existingAdmin) {
      console.log("[v0] Admin user already exists:", existingAdmin)
      return existingAdmin
    }

    // Create the default admin user
    const adminData = {
      name: "ABCD Administrator",
      email: "abcd@cancerdetection.com",
      role: "admin" as const,
      permissions: ["manage_users", "view_analytics", "system_settings"],
      password: "ABCD", // Store password for credential-based login
    }

    const adminId = await adminService.create(adminData)
    console.log("[v0] Created admin user with ID:", adminId)

    // Retrieve the created admin
    const createdAdmin = await adminService.getById(adminId)
    console.log("[v0] Admin user created successfully:", createdAdmin)

    return createdAdmin
  } catch (error) {
    console.error("[v0] Error setting up admin user:", error)
    throw error
  }
}

// Run the setup
setupAdminUser()
  .then(() => {
    console.log("[v0] Admin setup completed successfully")
  })
  .catch((error) => {
    console.error("[v0] Admin setup failed:", error)
  })
