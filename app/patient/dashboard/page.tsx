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
import PatientProfile from "@/components/patient/patient-profile"
import ViewReports from "@/components/patient/view-reports"
import VoiceSymptoms from "@/components/patient/voice-symptoms"
import ContactAashaPatient from "@/components/patient/contact-aasha-patient"
import PatientGuidelines from "@/components/patient/patient-guidelines"
import BookAppointment from "@/components/patient/book-appointment"
import { LogOut, User, FileText, Mic, MessageCircle, BookOpen, Calendar } from "lucide-react"

export default function PatientDashboard() {
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
    <AuthGuard allowedRoles={["patient"]}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b" role="banner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{t.patient.dashboard}</h1>
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white" aria-label="Patient dashboard sections">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t.common.profile}
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t.patient.viewReports}
              </TabsTrigger>
              <TabsTrigger value="guidelines" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {t.patient.guidelines}
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                {t.patient.voiceSymptoms}
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {t.patient.contactAasha}
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Appointments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <PatientProfile />
            </TabsContent>

            <TabsContent value="reports">
              <ViewReports />
            </TabsContent>

            <TabsContent value="guidelines">
              <PatientGuidelines />
            </TabsContent>

            <TabsContent value="voice">
              <VoiceSymptoms />
            </TabsContent>

            <TabsContent value="contact">
              <ContactAashaPatient />
            </TabsContent>

            <TabsContent value="appointments">
              <BookAppointment />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  )
}
