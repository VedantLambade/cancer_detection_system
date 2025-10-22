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
import AashaWorkerProfile from "@/components/aasha-worker/aasha-worker-profile"
import AddPatientForm from "@/components/aasha-worker/add-patient-form"
import ContactDoctor from "@/components/aasha-worker/contact-doctor"
import ContactPatients from "@/components/aasha-worker/contact-patients"
import AashaWorkerGuidelines from "@/components/aasha-worker/aasha-worker-guidelines"
import AssignPatient from "@/components/aasha-worker/assign-patient"
import { LogOut, User, UserPlus, BookOpen, MessageCircle, Link2 } from "lucide-react"

export default function AashaWorkerDashboard() {
  const [activeTab, setActiveTab] = useState("add-patient") // set default to add-patient for quicker access
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
    <AuthGuard allowedRoles={["aasha_worker"]}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{t.ashaWorker.dashboard}</h1>
                <p className="text-sm text-gray-600">
                  {t.common.welcome}, {user?.name} - Community Health Worker
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
            <TabsList className="grid w-full grid-cols-6 bg-white">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t.common.profile}
              </TabsTrigger>
              <TabsTrigger value="add-patient" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t.ashaWorker.addPatient}
              </TabsTrigger>
              <TabsTrigger value="contact-doctor" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {t.ashaWorker.contactDoctor}
              </TabsTrigger>
              <TabsTrigger value="contact-patients" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat with Patients
              </TabsTrigger>
              <TabsTrigger value="guidelines" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {t.ashaWorker.guidelines}
              </TabsTrigger>
              <TabsTrigger value="assign" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Assign
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <AashaWorkerProfile />
            </TabsContent>

            <TabsContent value="add-patient">
              <AddPatientForm />
            </TabsContent>

            <TabsContent value="contact-doctor">
              <ContactDoctor />
            </TabsContent>

            <TabsContent value="contact-patients">
              <ContactPatients />
            </TabsContent>

            <TabsContent value="guidelines">
              <AashaWorkerGuidelines />
            </TabsContent>

            <TabsContent value="assign">
              <AssignPatient />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  )
}
