"use client"

import { useState } from "react"
import AuthGuard from "@/components/auth-guard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { logout, getCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import AdminProfile from "@/components/admin/admin-profile"
import AddDoctorForm from "@/components/admin/add-doctor-form"
import AddHospitalForm from "@/components/admin/add-hospital-form"
import AddAashaWorkerForm from "@/components/admin/add-aasha-worker-form"
import ManageConnections from "@/components/admin/manage-connections"
import AdminGuidelines from "@/components/admin/admin-guidelines"
import { LogOut, Users, Building2, Stethoscope, Settings, UserPlus } from "lucide-react"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("profile")
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useI18n()
  const user = getCurrentUser()

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of the system.",
    })
    router.push("/login")
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">System Administration</h1>
                <p className="text-sm text-gray-600">
                  {t.common.welcome}, {user?.name} - System Administrator
                </p>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.common.logout}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t.common.profile}
              </TabsTrigger>
              {/* Replaced Providers with Add Doctor */}
              <TabsTrigger value="add-doctor" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Add Doctor
              </TabsTrigger>
              {/* New separate Add Hospital tab */}
              <TabsTrigger value="add-hospital" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Add Hospital
              </TabsTrigger>
              <TabsTrigger value="add-asha-worker" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t.admin.addAshaWorker || "Add ASHA Worker"}
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System Management
              </TabsTrigger>
              {/* guidelines trigger remains below; grid-cols is still 5 overall content-wise since we removed Providers and added two */}
            </TabsList>

            <TabsContent value="profile">
              <AdminProfile />
            </TabsContent>

            <TabsContent value="add-doctor">
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="h-4 w-4" />
                  <h2 className="font-semibold">Add Doctor</h2>
                </div>
                <AddDoctorForm />
              </div>
              <div className="mt-6">
                <ManageConnections />
              </div>
            </TabsContent>

            <TabsContent value="add-hospital">
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4" />
                  <h2 className="font-semibold">Add Hospital</h2>
                </div>
                <AddHospitalForm />
              </div>
              <div className="mt-6">
                <ManageConnections />
              </div>
            </TabsContent>

            <TabsContent value="add-asha-worker">
              <AddAashaWorkerForm />
            </TabsContent>

            <TabsContent value="manage">
              <ManageConnections />
            </TabsContent>

            <TabsContent value="guidelines">
              <AdminGuidelines />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  )
}
