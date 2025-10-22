"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore"

type Step = "email" | "otp"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<Step>("email")
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const { toast } = useToast()

  const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" })
      return
    }
    setIsSending(true)
    try {
      const normalized = email.trim().toLowerCase()
      const code = generateOtp()
      const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)) // 10 minutes

      await setDoc(
        doc(db, "passwordResets", normalized),
        {
          email: normalized,
          code,
          createdAt: serverTimestamp(),
          expiresAt,
          attempts: 0,
        },
        { merge: true },
      )

      toast({
        title: "OTP sent",
        description: `For preview use only. Your OTP is ${code}. It expires in 10 minutes.`,
      })
      setStep("otp")
    } catch (err) {
      toast({
        title: "Could not send OTP",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyOtpAndSendReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code sent to your email.",
        variant: "destructive",
      })
      return
    }
    setIsVerifying(true)
    try {
      const normalized = email.trim().toLowerCase()
      const snap = await getDoc(doc(db, "passwordResets", normalized))
      if (!snap.exists()) {
        throw new Error("No OTP request found. Please request a new OTP.")
      }
      const data = snap.data() as { code: string; expiresAt?: Timestamp; attempts?: number }
      const now = new Date()
      if (!data?.code) throw new Error("No OTP code found. Please request a new OTP.")
      if (data?.expiresAt?.toDate && data.expiresAt.toDate() < now) {
        throw new Error("OTP expired. Please request a new code.")
      }
      if (data.code !== otp) {
        throw new Error("Incorrect OTP. Please try again.")
      }

      await sendPasswordResetEmail(auth, normalized)

      await setDoc(
        doc(db, "passwordResets", normalized),
        { consumedAt: serverTimestamp(), lastVerifiedAt: serverTimestamp() },
        { merge: true },
      )

      toast({
        title: "OTP verified",
        description: "A password reset link has been sent to your email.",
      })
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-900">
            {step === "email" ? "Reset Password" : "Verify OTP"}
          </CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email to receive a one-time passcode (OTP)."
              : "Enter the 6-digit OTP sent to your email. After verification, we'll email you a reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSending}>
                {isSending ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtpAndSendReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp} containerClassName="w-full justify-center">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isVerifying}>
                {isVerifying ? "Verifying..." : "Verify OTP & Send Reset Link"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-sm text-blue-600 hover:underline"
                  disabled={isSending}
                >
                  {isSending ? "Resending..." : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
