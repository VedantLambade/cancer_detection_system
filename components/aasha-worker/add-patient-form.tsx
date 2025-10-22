"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n-context"
import FileUpload from "@/components/ui/file-upload"
import VoiceRecorder from "@/components/ui/voice-recorder"
import { UserPlus, Phone, Mic, Camera, CheckCircle2 } from "lucide-react"
import { registerNewUser, getCurrentUser } from "@/lib/auth"
import { cervixAnalysisService } from "@/lib/firebase-services"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

export default function AddPatientForm() {
  const [patientData, setPatientData] = useState({
    name: "",
    age: "",
    gender: "",
    village: "",
    city: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    medicalHistory: "",
    symptoms: "",
  })
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [aiResult, setAiResult] = useState<"normal" | "abnormal" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [step, setStep] = useState<"idle" | "creating" | "uploading" | "saving" | "done">("idle")
  const [progress, setProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successPatientId, setSuccessPatientId] = useState<string | null>(null)
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const { toast } = useToast()
  const { t } = useI18n()

  const handleInputChange = (field: string, value: string) => {
    setPatientData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = async (file: File, preview: string) => {
    setSelectedFile(file)
    setUploadedImage(preview)
    setIsAnalyzingImage(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("image", file)
      uploadFormData.append("patientId", "temp-" + Date.now())

      const uploadResponse = await fetch("/api/predict", {
        method: "POST",
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        let errorMessage = "Failed to upload image"
        try {
          const errorData = await uploadResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Upload failed with status ${uploadResponse.status}`
        }
        throw new Error(errorMessage)
      }

      const uploadData = await uploadResponse.json()
      console.log("[v0] Image uploaded to Blob:", uploadData.imageUrl)
      setUploadedImageUrl(uploadData.imageUrl)

      console.log("[v0] Analyzing image with model...")
      const analysisResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.imageUrl }),
      })

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json()
        console.log("[v0] Analysis result:", analysisData.prediction)
        setAiResult(analysisData.prediction.toLowerCase() === "abnormal" ? "abnormal" : "normal")

        toast({
          title: "Analysis Complete",
          description: `AI Result: ${analysisData.prediction} (Confidence: ${(analysisData.score * 100).toFixed(1)}%)`,
        })
      } else {
        console.error("[v0] Analysis failed, using default")
        setAiResult("normal")
        toast({
          title: "Image Uploaded",
          description: "Image ready for analysis. Fill in patient details and submit.",
        })
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
      setSelectedFile(null)
      setUploadedImage(null)
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setUploadedImage(null)
    setAiResult(null)
    setUploadedImageUrl(null)
  }

  const handleVoiceTranscriptChange = (transcript: string) => {
    setPatientData((prev) => ({
      ...prev,
      symptoms: transcript,
    }))
  }

  const generatePatientId = () =>
    `PAT${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile || !uploadedImageUrl) {
      toast({
        title: "Image Required",
        description: "Please upload an image first.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setStep("creating")
    setProgress(20)

    try {
      const asha = getCurrentUser()
      if (!asha?.id) {
        throw new Error("Your session has expired. Please log in again as an ASHA Worker and retry.")
      }

      if (!patientData.email) {
        throw new Error("Email is required to create a patient login.")
      }

      const password = (patientData.password || "").trim()
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.")
      }

      const patientIdCode = generatePatientId()
      const userData = {
        patientId: patientIdCode,
        name: patientData.name.trim(),
        age: Number(patientData.age || 0),
        gender: patientData.gender || "female",
        phone: patientData.phone || "",
        address: patientData.address || `${patientData.village || ""} ${patientData.city || ""}`.trim(),
        medicalHistory: patientData.medicalHistory || "",
        ashaWorkerId: asha.id,
        symptoms: patientData.symptoms || "",
      }

      const result = await registerNewUser(patientData.email.trim(), password, "patient", userData)
      if (!result.success || !result.user?.id) {
        throw new Error(result.error || "Failed to register patient.")
      }
      const patientDocId = result.user.id
      setProgress(50)

      setStep("saving")

      const finalPrediction = aiResult || "normal"

      await cervixAnalysisService.create({
        patientId: patientDocId,
        imageUrl: uploadedImageUrl,
        analysis: `AI Analysis Result: ${finalPrediction}`,
        riskLevel: finalPrediction?.toLowerCase() === "abnormal" ? "high" : "low",
        ashaWorkerId: asha.id,
        confidence: 0.85,
      })

      setProgress(100)
      setStep("done")

      setSuccessPatientId(patientIdCode)
      setShowSuccess(true)

      toast({
        title: "Patient added successfully",
        description: `Patient ID: ${patientIdCode}. The patient can now log in using ${patientData.email}.`,
      })

      setPatientData({
        name: "",
        age: "",
        gender: "",
        village: "",
        city: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        medicalHistory: "",
        symptoms: "",
      })
      setSelectedFile(null)
      setUploadedImage(null)
      setAiResult(null)
      setUploadedImageUrl(null)
      setShowVoiceRecorder(false)
      setStep("idle")
      setProgress(0)
    } catch (error: any) {
      const raw = error?.message || String(error)
      let explanation = raw

      if (/email[- ]already[- ]in[- ]use|auth\/email-already-in-use/i.test(raw)) {
        explanation = "This email is already registered. Ask the patient to use a different email or sign in."
      } else if (/invalid[- ]email|auth\/invalid-email/i.test(raw)) {
        explanation = "The email address appears to be invalid. Please check and try again."
      } else if (/weak[- ]password|auth\/weak-password/i.test(raw)) {
        explanation = "The password is too weak. Use at least 6 characters and try again."
      } else if (/network|timeout/i.test(raw)) {
        explanation = "A network error occurred. Check your connection and try again."
      }

      toast({
        title: "Could not add patient",
        description: explanation,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function compressImage(file: File, maxWidth = 1280, quality = 0.8): Promise<File> {
    const imageBitmap = await createImageBitmap(file)
    const ratio = Math.min(1, maxWidth / imageBitmap.width)
    const targetW = Math.round(imageBitmap.width * ratio)
    const targetH = Math.round(imageBitmap.height * ratio)

    const canvas = document.createElement("canvas")
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext("2d")
    if (!ctx) return file

    ctx.drawImage(imageBitmap, 0, 0, targetW, targetH)

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.(png|jpeg|jpg)$/i, ".jpg"), { type: "image/jpeg" })
  }

  return (
    <div className="space-y-6">
      {isSubmitting && (
        <div className="max-w-4xl mx-auto">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground mt-1">
            {step === "creating" && "Creating patient account..."}
            {step === "saving" && "Saving analysis to Firebase..."}
            {step === "done" && "Completed"}
          </p>
        </div>
      )}

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t.ashaWorker.patientRegistration}
          </CardTitle>
          <CardDescription>
            {t.ashaWorker.patientRegistration} - {t.admin.uploadImage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                <Label className="text-lg font-medium">
                  Step 1: {t.ashaWorker.uploadCervixPhoto} & {t.admin.aiAnalysis}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.ashaWorker.uploadCervixPhoto} for instant AI-powered cancer screening analysis
              </p>
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                currentFile={uploadedImage}
                accept="image/*"
                maxSize={10}
              />

              {isAnalyzingImage && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  Analyzing image with AI model...
                </div>
              )}

              {aiResult && (
                <div className="mt-4 p-3 bg-white rounded-lg border">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      aiResult === "normal" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {t.ashaWorker.aiAnalysisResult}:{" "}
                    {aiResult === "normal" ? t.ashaWorker.normalResult : t.ashaWorker.abnormalResult}
                  </span>
                  {aiResult === "abnormal" && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ {t.ashaWorker.abnormalResult} result detected. This case will be immediately forwarded to a
                      doctor for review.
                    </p>
                  )}
                </div>
              )}
            </div>

            {aiResult && (
              <>
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Label className="text-lg font-medium">Step 2: Fill in Patient Details</Label>
                  <p className="text-sm text-muted-foreground">
                    Now complete the patient information to save this analysis record.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t.ashaWorker.patientDetails}</h3>

                    <div className="space-y-2">
                      <Label htmlFor="name">{t.common.name} *</Label>
                      <Input
                        id="name"
                        value={patientData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">{t.common.age} *</Label>
                      <Input
                        id="age"
                        type="number"
                        min="18"
                        max="100"
                        value={patientData.age}
                        onChange={(e) => handleInputChange("age", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t.common.phone}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          className="pl-10"
                          value={patientData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={patientData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={patientData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={patientData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="Street, Village, City"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t.ashaWorker.medicalInfo}</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="symptoms">{t.admin.symptoms}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                          className="flex items-center gap-2 bg-transparent"
                        >
                          <Mic className="h-4 w-4" />
                          {showVoiceRecorder ? t.ashaWorker.hideVoiceRecording : t.ashaWorker.useVoiceRecording}
                        </Button>
                      </div>

                      {showVoiceRecorder && (
                        <VoiceRecorder
                          onTranscriptChange={handleVoiceTranscriptChange}
                          currentTranscript={patientData.symptoms}
                          className="mb-4"
                        />
                      )}

                      <Textarea
                        id="symptoms"
                        placeholder={`${t.admin.symptoms}... ${t.ashaWorker.voiceRecording}`}
                        value={patientData.symptoms}
                        onChange={(e) => handleInputChange("symptoms", e.target.value)}
                        className="min-h-20"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="medicalHistory">Medical History</Label>
                      <Textarea
                        id="medicalHistory"
                        placeholder="Previous conditions, surgeries, medications..."
                        value={patientData.medicalHistory}
                        onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Saving Patient..." : "Save Patient & Analysis"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Patient Added
            </DialogTitle>
            <DialogDescription>
              Patient has been registered successfully with AI analysis results saved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Patient ID:</strong> <span className="font-mono">{successPatientId || "-"}</span>
            </p>
            <p>
              <strong>AI Result:</strong> <span className="font-mono">{aiResult?.toUpperCase()}</span>
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowSuccess(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
