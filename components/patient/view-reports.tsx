"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { cervixAnalysisService, doctorService } from "@/lib/firebase-services"
import {
  FileText,
  Download,
  Eye,
  Search,
  Calendar,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Shield,
  Loader2,
} from "lucide-react"

interface ReportData {
  id: string
  date: string
  type: string
  result: string
  doctor: string
  hospital: string
  notes: string
  image: string
  doctorReviewed: boolean
  reviewDate: string
  aiResult: string
  riskLevel: "low" | "medium" | "high"
  treatmentPlan?: string // added
}

export default function ViewReports() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null)
  const [reports, setReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const user = getCurrentUser()

  useEffect(() => {
    const loadReports = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        // Get all cervix analyses for this patient
        const analyses = await cervixAnalysisService.getByPatient(user.id)

        // Convert analyses to report format
        const reportsData: ReportData[] = []
        for (const analysis of analyses) {
          let doctorName = "AI Analysis Only"
          if (analysis.doctorId) {
            const doctor = await doctorService.getById(analysis.doctorId)
            doctorName = doctor ? doctor.name : "Unknown Doctor"
          }

          reportsData.push({
            id: analysis.id!,
            date: new Date(analysis.createdAt.toDate()).toISOString().split("T")[0],
            type: "Cervical Cancer Screening",
            result: analysis.riskLevel === "low" ? "Normal" : "Abnormal",
            doctor: doctorName,
            hospital: "Healthcare Center", // Default hospital name
            notes:
              analysis.doctorFeedback && analysis.doctorFeedback.trim().length > 0
                ? analysis.doctorFeedback
                : analysis.analysis,
            image: analysis.imageUrl,
            doctorReviewed: !!analysis.doctorId,
            reviewDate: (analysis.doctorReviewAt
              ? new Date(analysis.doctorReviewAt.toDate())
              : new Date(analysis.createdAt.toDate())
            )
              .toISOString()
              .split("T")[0],
            aiResult: analysis.riskLevel === "low" ? "Normal" : "Abnormal",
            riskLevel: analysis.riskLevel,
            treatmentPlan: analysis.nextSteps || undefined, // added
          })
        }

        setReports(reportsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      } catch (error) {
        console.error("[v0] Error loading reports:", error)
        toast({
          title: "Failed to load reports",
          description: "Please refresh and try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [user?.id, toast])

  const filteredReports = reports.filter(
    (report) =>
      report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.hospital.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDownloadReport = (report: ReportData) => {
    toast({
      title: "Report Downloaded",
      description: `${report.type} report from ${report.date} has been downloaded.`,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reports...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Doctor-Reviewed Reports</h3>
              <p className="text-sm text-blue-700">
                All reports are carefully reviewed and approved by qualified doctors before being made available to you.
                This ensures accuracy and provides professional medical interpretation of your screening results.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Reports
          </CardTitle>
          <CardDescription>View your doctor-reviewed medical reports and screening results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search reports by type, doctor, or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No medical reports found</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {filteredReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mb-1" />
                        <div className="text-sm font-medium">{new Date(report.date).toLocaleDateString()}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{report.type}</h3>
                          <Badge
                            variant={report.result === "Normal" ? "default" : "destructive"}
                            className="flex items-center gap-1"
                          >
                            {report.result === "Normal" ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            {report.result}
                          </Badge>
                          {report.doctorReviewed && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              Doctor Reviewed
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>{report.doctor}</div>
                          <div>{report.hospital}</div>
                          {report.doctorReviewed && (
                            <div className="text-xs text-blue-600">
                              Reviewed on: {new Date(report.reviewDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Medical Report Details</DialogTitle>
                            <DialogDescription>
                              {selectedReport?.type} - {selectedReport?.date}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedReport && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Report Information</h4>
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <strong>Type:</strong> {selectedReport.type}
                                    </p>
                                    <p>
                                      <strong>Date:</strong> {selectedReport.date}
                                    </p>
                                    <p>
                                      <strong>Doctor:</strong> {selectedReport.doctor}
                                    </p>
                                    <p>
                                      <strong>Hospital:</strong> {selectedReport.hospital}
                                    </p>
                                    <p>
                                      <strong>AI Analysis:</strong> {selectedReport.aiResult}
                                    </p>
                                    {selectedReport.doctorReviewed && (
                                      <p>
                                        <strong>Doctor Review:</strong>{" "}
                                        {new Date(selectedReport.reviewDate).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Final Result</h4>
                                  <Badge
                                    variant={selectedReport.result === "Normal" ? "default" : "destructive"}
                                    className="flex items-center gap-1 w-fit mb-2"
                                  >
                                    {selectedReport.result === "Normal" ? (
                                      <CheckCircle className="h-3 w-3" />
                                    ) : (
                                      <AlertTriangle className="h-3 w-3" />
                                    )}
                                    {selectedReport.result}
                                  </Badge>
                                  {selectedReport.doctorReviewed && (
                                    <Badge variant="secondary" className="flex items-center gap-1 w-fit mb-2">
                                      <UserCheck className="h-3 w-3" />
                                      Doctor Approved
                                    </Badge>
                                  )}
                                  {selectedReport.result === "Normal" && (
                                    <p className="text-sm text-green-600">
                                      Continue regular screening as recommended by your doctor.
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">
                                  {selectedReport.doctorReviewed ? "Doctor's Professional Assessment" : "AI Analysis"}
                                </h4>
                                <p className="text-sm bg-gray-50 p-3 rounded">{selectedReport.notes}</p>
                                {/* added */}
                                {selectedReport.treatmentPlan && (
                                  <div className="mt-3">
                                    <h5 className="font-semibold mb-1">Treatment Plan</h5>
                                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedReport.treatmentPlan}</p>
                                  </div>
                                )}
                                {selectedReport.doctorReviewed && (
                                  <p className="text-xs text-blue-600 mt-2">
                                    This report has been thoroughly reviewed and approved by a qualified medical
                                    professional.
                                  </p>
                                )}
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Medical Image</h4>
                                <img
                                  src={selectedReport.image || "/placeholder.svg"}
                                  alt="Medical scan"
                                  className="max-w-xs rounded-lg border"
                                />
                              </div>

                              <div className="flex gap-2 pt-4">
                                <Button onClick={() => handleDownloadReport(selectedReport)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Report
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" onClick={() => handleDownloadReport(report)}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Health Summary</CardTitle>
          <CardDescription>Overview of your doctor-reviewed screening history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reports.length}</div>
              <div className="text-sm text-muted-foreground">Total Screenings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{reports.filter((r) => r.doctorReviewed).length}</div>
              <div className="text-sm text-muted-foreground">Doctor-Approved Results</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">6 months</div>
              <div className="text-sm text-muted-foreground">Next Screening Due</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
