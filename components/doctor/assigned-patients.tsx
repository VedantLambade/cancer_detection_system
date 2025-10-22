"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import { cervixAnalysisService, patientService, assignmentService } from "@/lib/firebase-services"
import { Search, Eye, Download, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Timestamp } from "firebase/firestore"

interface PatientWithAnalysis {
  id: string
  patientId: string // added
  name: string
  age: number
  address: string
  phone: string
  analysis: {
    id: string
    imageUrl: string
    analysis: string
    riskLevel: "low" | "medium" | "high"
    createdAt: any
  } | null
}

export default function AssignedPatients() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<PatientWithAnalysis | null>(null)
  const [patients, setPatients] = useState<PatientWithAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const user = getCurrentUser()

  useEffect(() => {
    const loadPatients = async () => {
      if (!user?.id) return
      try {
        setLoading(true)
        const assigns = await assignmentService.getByDoctor(user.id)
        const patientsWithAnalysis: PatientWithAnalysis[] = []

        for (const a of assigns) {
          const patient = await patientService.getById(a.patientId)
          if (!patient) continue

          // fetch latest analysis if available, but do not filter out if none exists
          const analyses = await cervixAnalysisService.getByPatient(a.patientId)
          const latest = analyses[0] // may be undefined

          patientsWithAnalysis.push({
            id: patient.id!,
            patientId: patient.patientId, // added
            name: patient.name,
            age: patient.age,
            address: patient.address,
            phone: patient.phone,
            analysis: latest
              ? {
                  id: latest.id!,
                  imageUrl: latest.imageUrl,
                  analysis: latest.analysis,
                  riskLevel: latest.riskLevel,
                  createdAt: latest.createdAt,
                }
              : null,
          })
        }
        setPatients(patientsWithAnalysis)
      } catch (error) {
        console.error("[v0] Error loading patients:", error)
        toast({
          title: "Unable to load patients",
          description: "Please check your connection and try again.",
        })
      } finally {
        setLoading(false)
      }
    }
    loadPatients()
  }, [user?.id, toast])

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDownloadReport = (patient: PatientWithAnalysis) => {
    toast({
      title: "Report Downloaded",
      description: `${patient.name}'s report has been downloaded successfully.`,
    })
  }

  const handleContactAasha = (patient: PatientWithAnalysis) => {
    toast({
      title: "Contacting Aasha Worker",
      description: `Initiating contact regarding ${patient.name}'s case.`,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading patients...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Assigned Patients
          </CardTitle>
          <CardDescription>View and manage patients assigned to you by Aasha Workers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No patients assigned yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead> {/* new column */}
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-mono text-xs">{patient.patientId}</TableCell> {/* show patientId */}
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.address}</TableCell>
                    <TableCell>
                      {patient.analysis ? (
                        <Badge
                          variant={patient.analysis.riskLevel === "low" ? "default" : "destructive"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {patient.analysis.riskLevel === "low" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {patient.analysis.riskLevel === "low" ? "Normal" : "Abnormal"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="w-fit">
                          No analysis yet
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {patient.analysis ? new Date(patient.analysis.createdAt.toDate()).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedPatient(patient)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Patient Details - {patient.name}</DialogTitle>
                              <DialogDescription>
                                Detailed view of patient information{patient.analysis ? " and AI analysis" : ""}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPatient && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Patient Information</h4>
                                    <div className="space-y-1 text-sm">
                                      <p>
                                        <strong>Patient ID:</strong> {selectedPatient.patientId}
                                      </p>
                                      <p>
                                        <strong>Name:</strong> {selectedPatient.name}
                                      </p>
                                      <p>
                                        <strong>Age:</strong> {selectedPatient.age}
                                      </p>
                                      <p>
                                        <strong>Address:</strong> {selectedPatient.address}
                                      </p>
                                      <p>
                                        <strong>Phone:</strong> {selectedPatient.phone}
                                      </p>
                                      {selectedPatient.analysis && (
                                        <p>
                                          <strong>Date:</strong>{" "}
                                          {new Date(selectedPatient.analysis.createdAt.toDate()).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 bg-transparent"
                                      onClick={() => navigator.clipboard.writeText(selectedPatient.patientId)}
                                    >
                                      Copy Patient ID
                                    </Button>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Analysis</h4>
                                    {selectedPatient.analysis ? (
                                      <>
                                        <Badge
                                          variant={
                                            selectedPatient.analysis.riskLevel === "low" ? "default" : "destructive"
                                          }
                                          className="flex items-center gap-1 w-fit mb-2"
                                        >
                                          {selectedPatient.analysis.riskLevel === "low" ? (
                                            <CheckCircle className="h-3 w-3" />
                                          ) : (
                                            <AlertTriangle className="h-3 w-3" />
                                          )}
                                          {selectedPatient.analysis.riskLevel === "low" ? "Normal" : "Abnormal"}
                                        </Badge>
                                        {selectedPatient.analysis.riskLevel !== "low" && (
                                          <p className="text-sm text-red-600">
                                            Requires immediate medical attention and follow-up.
                                          </p>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No analysis uploaded yet.</p>
                                    )}
                                  </div>
                                </div>

                                {selectedPatient.analysis && (
                                  <>
                                    <div>
                                      <h4 className="font-semibold mb-2">Analysis Details</h4>
                                      <p className="text-sm bg-gray-50 p-3 rounded">
                                        {selectedPatient.analysis.analysis}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Uploaded Image</h4>
                                      <img
                                        src={
                                          selectedPatient.analysis.imageUrl ||
                                          "/placeholder.svg?height=240&width=240&query=medical%20scan%20placeholder" ||
                                          "/placeholder.svg"
                                        }
                                        alt="Medical scan"
                                        className="max-w-xs rounded-lg border"
                                      />
                                    </div>
                                  </>
                                )}

                                {/* Feedback form appears only when there is an analysis to review */}
                                {selectedPatient.analysis && (
                                  <div className="pt-2">
                                    <h4 className="font-semibold mb-2">Doctor Feedback & Next Steps</h4>
                                    <div className="space-y-2">
                                      <Label htmlFor="doctorFeedback">Feedback</Label>
                                      <Textarea
                                        id="doctorFeedback"
                                        placeholder="Add your clinical assessment..."
                                        onChange={(e) => ((selectedPatient as any)._feedback = e.target.value)}
                                      />
                                      <Label htmlFor="nextSteps">Next Steps</Label>
                                      <Textarea
                                        id="nextSteps"
                                        placeholder="Tests, medications, referral plan..."
                                        onChange={(e) => ((selectedPatient as any)._nextSteps = e.target.value)}
                                      />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                      <Button
                                        onClick={async () => {
                                          try {
                                            await cervixAnalysisService.update(selectedPatient.analysis!.id, {
                                              doctorId: user!.id,
                                              doctorFeedback: (selectedPatient as any)._feedback || "",
                                              nextSteps: (selectedPatient as any)._nextSteps || "",
                                              doctorReviewAt: Timestamp.now(),
                                            })
                                            toast({
                                              title: "Report published",
                                              description:
                                                "Your feedback is saved and visible to patient and ASHA worker.",
                                            })
                                          } catch (e: any) {
                                            toast({
                                              title: "Save failed",
                                              description: e?.message
                                                ? String(e.message)
                                                : "Unable to save feedback right now.",
                                            })
                                          }
                                        }}
                                      >
                                        Save & Publish
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                  {selectedPatient.analysis && (
                                    <Button onClick={() => handleDownloadReport(selectedPatient)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download Report
                                    </Button>
                                  )}
                                  {!selectedPatient.analysis && (
                                    <Button variant="outline" disabled title="No report available yet">
                                      <Download className="h-4 w-4 mr-2" />
                                      Download Report
                                    </Button>
                                  )}
                                  {selectedPatient.analysis && selectedPatient.analysis.riskLevel !== "low" && (
                                    <Button variant="outline" onClick={() => handleContactAasha(selectedPatient)}>
                                      Contact Aasha Worker
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadReport(patient)}
                          disabled={!patient.analysis}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Normal Cases Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Schedule routine follow-up in 6 months</li>
              <li>• Advise regular self-examination</li>
              <li>• Maintain healthy lifestyle habits</li>
              <li>• Continue regular screening schedule</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Abnormal Cases Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Immediate referral for further testing</li>
              <li>• Contact Aasha Worker for coordination</li>
              <li>• Schedule urgent follow-up appointment</li>
              <li>• Provide patient counseling and support</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
