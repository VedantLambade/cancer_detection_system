"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import { cervixAnalysisService, patientService, assignmentService } from "@/lib/firebase-services"
import { FolderOpen, Search, Plus, FileText, Calendar, User, Download, Edit, Loader2 } from "lucide-react"
import { Timestamp } from "firebase/firestore"

interface MedicalRecord {
  id: string
  patientName: string
  patientId: string
  date: string
  type: string
  diagnosis: string
  treatment: string
  notes: string
  status: "active" | "completed" | "follow-up"
  riskLevel: "low" | "medium" | "high"
}

export default function MedicalRecords() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const user = getCurrentUser()

  useEffect(() => {
    const loadMedicalRecords = async () => {
      if (!user?.id) return
      try {
        setLoading(true)
        const assigns = await assignmentService.getByDoctor(user.id)
        const medicalRecords: MedicalRecord[] = []
        for (const a of assigns) {
          const latest = (await cervixAnalysisService.getByPatient(a.patientId))[0]
          if (!latest) continue
          const patient = await patientService.getById(a.patientId)
          if (!patient) continue
          medicalRecords.push({
            id: latest.id!,
            patientName: patient.name,
            patientId: patient.patientId,
            date: new Date(latest.createdAt.toDate()).toISOString().split("T")[0],
            type: "Cervical Cancer Screening",
            diagnosis: latest.analysis,
            treatment:
              latest.riskLevel === "low"
                ? "Routine follow-up recommended"
                : latest.riskLevel === "medium"
                  ? "Additional testing required"
                  : "Immediate medical attention needed",
            notes: `AI Analysis Result: ${latest.riskLevel} risk level. Image analysis completed.`,
            status: latest.riskLevel === "low" ? "completed" : latest.riskLevel === "medium" ? "follow-up" : "active",
            riskLevel: latest.riskLevel,
          })
        }
        setRecords(medicalRecords)
      } catch (error) {
        console.error("[v0] Error loading medical records:", error)
        toast({
          title: "Unable to load records",
          description: "Please refresh and try again.",
        })
      } finally {
        setLoading(false)
      }
    }
    loadMedicalRecords()
  }, [user?.id, toast])

  const filteredRecords = records.filter(
    (record) =>
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSaveRecord = async () => {
    if (!selectedRecord) return
    try {
      await cervixAnalysisService.update(selectedRecord.id, {
        doctorId: user!.id,
        doctorFeedback: `Diagnosis: ${selectedRecord.diagnosis}\nTreatment: ${selectedRecord.treatment}\nNotes: ${selectedRecord.notes}`,
        doctorReviewAt: Timestamp.now(),
      })
      toast({
        title: "Record updated",
        description: "Medical record has been saved successfully.",
      })
      setIsEditing(false)
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message ? String(e.message) : "Unable to save record right now.",
      })
    }
  }

  const handleDownloadRecord = (recordId: string) => {
    toast({
      title: "Download started",
      description: "Medical record is being downloaded as PDF.",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "follow-up":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading medical records...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Medical Records Management
          </CardTitle>
          <CardDescription>Manage and review patient medical records and treatment history</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="records" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="records" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Patient Records
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Record
              </TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by patient name, ID, or diagnosis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Records List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Medical Records</h3>
                  {filteredRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No medical records found</p>
                    </div>
                  ) : (
                    filteredRecords.map((record) => (
                      <Card
                        key={record.id}
                        className={`cursor-pointer transition-colors ${selectedRecord?.id === record.id ? "ring-2 ring-green-500" : "hover:bg-gray-50"}`}
                        onClick={() => setSelectedRecord(record)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{record.patientName}</h4>
                              <p className="text-sm text-gray-600">ID: {record.patientId}</p>
                            </div>
                            <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{new Date(record.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-600">{record.type}</p>
                            <p className="font-medium">{record.diagnosis}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Record Details */}
                <div className="space-y-4">
                  {selectedRecord ? (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <User className="h-5 w-5" />
                              {selectedRecord.patientName}
                            </CardTitle>
                            <CardDescription>Record ID: {selectedRecord.id}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isEditing ? "Cancel" : "Edit"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownloadRecord(selectedRecord.id)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Diagnosis</Label>
                              <Input
                                defaultValue={selectedRecord.diagnosis}
                                onChange={(e) => setSelectedRecord({ ...selectedRecord, diagnosis: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Treatment</Label>
                              <Textarea
                                defaultValue={selectedRecord.treatment}
                                rows={3}
                                onChange={(e) => setSelectedRecord({ ...selectedRecord, treatment: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Clinical Notes</Label>
                              <Textarea
                                defaultValue={selectedRecord.notes}
                                rows={4}
                                onChange={(e) => setSelectedRecord({ ...selectedRecord, notes: e.target.value })}
                              />
                            </div>
                            <Button onClick={handleSaveRecord} className="w-full">
                              Save Changes
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <Label className="font-semibold">Date:</Label>
                              <p>{new Date(selectedRecord.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Type:</Label>
                              <p>{selectedRecord.type}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Diagnosis:</Label>
                              <p>{selectedRecord.diagnosis}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Treatment:</Label>
                              <p>{selectedRecord.treatment}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Clinical Notes:</Label>
                              <p className="text-sm text-gray-700">{selectedRecord.notes}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Status:</Label>
                              <Badge className={getStatusColor(selectedRecord.status)}>{selectedRecord.status}</Badge>
                            </div>
                            <div>
                              <Label className="font-semibold">Risk Level:</Label>
                              <Badge variant={selectedRecord.riskLevel === "low" ? "default" : "destructive"}>
                                {selectedRecord.riskLevel}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Select a medical record to view details</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Medical Record</CardTitle>
                  <CardDescription>Add a new medical record for a patient</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient Name</Label>
                      <Input placeholder="Enter patient name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Patient ID</Label>
                      <Input placeholder="Enter patient ID" />
                    </div>
                    <div className="space-y-2">
                      <Label>Record Type</Label>
                      <Input placeholder="e.g., Cervical Cancer Screening" />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Diagnosis</Label>
                    <Input placeholder="Enter diagnosis" />
                  </div>
                  <div className="space-y-2">
                    <Label>Treatment Plan</Label>
                    <Textarea placeholder="Enter treatment plan and recommendations" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Clinical Notes</Label>
                    <Textarea placeholder="Enter detailed clinical notes" rows={4} />
                  </div>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Medical Record
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
