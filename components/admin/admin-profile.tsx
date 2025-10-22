"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import { User, Phone, MapPin, Edit, Save } from "lucide-react"
import { patientService, doctorService, hospitalService } from "@/lib/firebase-services"

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "System Administrator",
    mobile: "+91 9876543210",
    region: "Nagpur, Maharashtra",
    email: "admin@cancerdetection.gov.in",
  })
  const [counts, setCounts] = useState({ patients: 0, doctors: 0, hospitals: 0 })
  const { toast } = useToast()
  const user = getCurrentUser()

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [patients, doctors, hospitals] = await Promise.all([
          patientService.getAll(),
          doctorService.getAll(),
          hospitalService.getAll(),
        ])
        setCounts({ patients: patients.length, doctors: doctors.length, hospitals: hospitals.length })
      } catch (e) {
        toast({
          title: "Could not load stats",
          description: "We couldn’t fetch live counts. They will appear once data is available.",
        })
      }
    }
    loadCounts()
  }, [toast])

  const handleSave = () => {
    setIsEditing(false)
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Manage your personal information and contact details</CardDescription>
            </div>
            <Button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              variant={isEditing ? "default" : "outline"}
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              {isEditing ? (
                <Input id="name" value={profileData.name} onChange={(e) => handleInputChange("name", e.target.value)} />
              ) : (
                <p className="text-sm font-medium">{profileData.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              {isEditing ? (
                <Input
                  id="mobile"
                  value={profileData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                />
              ) : (
                <p className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {profileData.mobile}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              {isEditing ? (
                <Input
                  id="region"
                  value={profileData.region}
                  onChange={(e) => handleInputChange("region", e.target.value)}
                />
              ) : (
                <p className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {profileData.region}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              ) : (
                <p className="text-sm font-medium">{profileData.email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-live="polite">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{counts.patients}</div>
            <p className="text-xs text-muted-foreground">Patients registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{counts.doctors}</div>
            <p className="text-xs text-muted-foreground">Doctors in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{counts.hospitals}</div>
            <p className="text-xs text-muted-foreground">Hospitals available</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
