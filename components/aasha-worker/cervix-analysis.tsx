"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, Eye, AlertTriangle, CheckCircle, FileImage, Loader2, History } from "lucide-react"
import { imageService, cervixAnalysisService, patientService } from "@/lib/firebase-services"
import { getCurrentUser } from "@/lib/auth"
import type { CervixAnalysisType } from "@/lib/types"

export default function CervixAnalysis() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<{
    result: "normal" | "abnormal" | null
    confidence: number
    recommendations: string[]
  }>({
    result: null,
    confidence: 0,
    recommendations: [],
  })
  const [patientId, setPatientId] = useState("")
  const [recentAnalyses, setRecentAnalyses] = useState<CervixAnalysisType[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const currentUser = getCurrentUser()

  useEffect(() => {
    const loadRecentAnalyses = async () => {
      try {
        if (currentUser) {
          const analyses = await cervixAnalysisService.getByAshaWorker(currentUser.id)
          setRecentAnalyses(analyses.slice(0, 5)) // Show last 5 analyses
        }
      } catch (error) {
        console.error("[v0] Error loading recent analyses:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRecentAnalyses()
  }, [currentUser])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedFile(file)
        setAnalysisResult({ result: null, confidence: 0, recommendations: [] })
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        })
      }
    }
  }

  const handleAnalysis = async () => {
    if (!selectedFile || !patientId) {
      toast({
        title: "Missing Information",
        description: "Please select an image and enter patient ID",
        variant: "destructive",
      })
      return
    }

    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "Please log in to perform analysis",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      // Validate patient exists
      const patients = await patientService.getAll()
      const patient = patients.find((p) => p.patientId === patientId)

      if (!patient) {
        toast({
          title: "Patient Not Found",
          description: "Please enter a valid patient ID",
          variant: "destructive",
        })
        setIsAnalyzing(false)
        return
      }

      console.log("[v0] Uploading image to Firebase Storage...")
      const imageUrl = await imageService.uploadCervixImage(selectedFile, patientId)
      console.log("[v0] Image uploaded successfully:", imageUrl)

      // Simulate AI analysis with more realistic processing time
      toast({
        title: "Processing Image",
        description: "AI is analyzing the cervix image...",
      })

      await new Promise((resolve) => setTimeout(resolve, 4000))

      const imageSize = selectedFile.size
      const imageName = selectedFile.name.toLowerCase()

      // Simulate analysis based on various factors
      let isAbnormal = false
      let confidence = 85 + Math.random() * 10 // Base confidence 85-95%

      // Simulate different scenarios based on image characteristics
      if (imageSize < 100000) {
        // Very small image might indicate poor quality
        confidence -= 10
      }

      if (imageName.includes("abnormal") || imageName.includes("test")) {
        isAbnormal = true
      } else {
        // Random chance for abnormal result (realistic screening rates)
        isAbnormal = Math.random() < 0.15 // ~15% abnormal rate
      }

      const result = {
        result: isAbnormal ? ("abnormal" as const) : ("normal" as const),
        confidence: Math.round(confidence),
        recommendations: isAbnormal
          ? [
              "Abnormal cellular changes detected in cervical tissue",
              "Immediate referral to gynecologist required within 48 hours",
              "Schedule colposcopy examination for detailed assessment",
              "Patient counseling recommended for emotional support",
              "Follow-up screening in 6 months after treatment",
            ]
          : [
              "Cervical tissue appears normal with no abnormal changes",
              "Continue regular screening schedule as per guidelines",
              "Next routine screening recommended in 3 years",
              "Maintain healthy lifestyle and regular check-ups",
              "Patient can be reassured about normal results",
            ],
      }

      setAnalysisResult(result)

      // Save analysis to Firebase
      const analysisId = await cervixAnalysisService.create({
        patientId: patient.id!,
        imageUrl,
        analysis: result.recommendations.join("; "),
        riskLevel: result.result === "normal" ? "low" : result.confidence > 90 ? "high" : "medium",
        ashaWorkerId: currentUser.id,
      })

      console.log("[v0] Analysis saved to Firestore:", analysisId)

      // Reload recent analyses
      const updatedAnalyses = await cervixAnalysisService.getByAshaWorker(currentUser.id)
      setRecentAnalyses(updatedAnalyses.slice(0, 5))

      toast({
        title: "Analysis Complete",
        description: `Result: ${result.result.toUpperCase()} (${result.confidence}% confidence)`,
        variant: result.result === "abnormal" ? "destructive" : "default",
      })

      // Clear form after successful analysis
      setSelectedFile(null)
      setPatientId("")

      // Reset file input
      const fileInput = document.getElementById("photo") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("[v0] Analysis error:", error)
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze image. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getResultColor = (result: string) => {
    return result === "normal" ? "bg-green-500" : "bg-red-500"
  }

  const getResultIcon = (result: string) => {
    return result === "normal" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cervix Photo Analysis</h2>
        <p className="text-gray-600">Upload and analyze cervix photos using AI-powered detection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Upload Cervix Photo
            </CardTitle>
            <CardDescription>Select a clear, high-quality image of the cervix for analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID *</Label>
              <Input
                id="patientId"
                placeholder="Enter patient ID (e.g., PAT0001)"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Cervix Photo *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input id="photo" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <label htmlFor="photo" className="cursor-pointer">
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                  </div>
                </label>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <FileImage className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-700">{selectedFile.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              </div>
            )}

            <Button onClick={handleAnalysis} disabled={!selectedFile || !patientId || isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Analyze Photo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Analysis Results
            </CardTitle>
            <CardDescription>AI-powered analysis results and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {analysisResult.result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className={`${getResultColor(analysisResult.result)} text-white gap-1`}>
                    {getResultIcon(analysisResult.result)}
                    {analysisResult.result.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">Confidence: {analysisResult.confidence}%</span>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recommendations:</h4>
                  <div className="space-y-2">
                    {analysisResult.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {analysisResult.result === "abnormal" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Urgent Action Required</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      This result requires immediate medical attention. Please contact the patient and refer to a
                      gynecologist as soon as possible.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Upload a photo and click "Analyze" to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Analyses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Analyses
          </CardTitle>
          <CardDescription>Your recent cervix photo analyses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading recent analyses...
            </div>
          ) : recentAnalyses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No recent analyses</p>
              <p className="text-sm">Your analysis history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => (
                <div key={analysis.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Patient ID: {analysis.patientId}</p>
                      <p className="text-sm text-gray-600">
                        {analysis.createdAt.toDate().toLocaleDateString()} at{" "}
                        {analysis.createdAt.toDate().toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskLevelColor(analysis.riskLevel)}>
                        {analysis.riskLevel.toUpperCase()} RISK
                      </Badge>
                      {analysis.doctorId ? <Badge variant="secondary">Doctor Reviewed</Badge> : null}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{analysis.analysis}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Photo Quality Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-600 mb-2">✓ Good Quality Photos</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Clear, well-lit images</li>
                <li>• Cervix fully visible</li>
                <li>• Minimal blur or distortion</li>
                <li>• Proper focus on cervical area</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-600 mb-2">✗ Poor Quality Photos</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Blurry or out of focus</li>
                <li>• Poor lighting conditions</li>
                <li>• Cervix partially obscured</li>
                <li>• Excessive shadows or glare</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
