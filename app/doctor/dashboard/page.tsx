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
import DoctorProfile from "@/components/doctor/doctor-profile"
import AssignedPatients from "@/components/doctor/assigned-patients"
import TreatmentAnalysis from "@/components/doctor/treatment-analysis"
import ContactAasha from "@/components/doctor/contact-aasha"
import { LogOut, User, Users, FolderOpen, MessageCircle } from "lucide-react"

export default function DoctorDashboard() {
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
    <AuthGuard allowedRoles={["doctor"]}>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{t.doctor.dashboard}</h1>
                <p className="text-sm text-gray-600">
                  {t.common.welcome}, {user?.name}
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
            <TabsList className="grid w-full grid-cols-4 bg-white">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t.common.profile}
              </TabsTrigger>
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t.doctor.assignedPatients}
              </TabsTrigger>
              <TabsTrigger value="treatment" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Treatment/Analysis
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {t.doctor.contactAasha}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <DoctorProfile />
            </TabsContent>

            <TabsContent value="patients">
              <AssignedPatients />
            </TabsContent>

            <TabsContent value="treatment">
              <TreatmentAnalysis />
            </TabsContent>

            <TabsContent value="contact">
              <ContactAasha />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  )
}
