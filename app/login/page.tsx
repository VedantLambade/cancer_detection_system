"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticateUser, setCurrentUser, getDashboardPathForRole } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useI18n()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const user = await authenticateUser(email, password)

      if (user) {
        setCurrentUser(user)
        console.log("[v0] Login: authenticated role=", user.role)
        toast({
          title: t.common.success,
          description: `${t.common.welcome}, ${user.name}!`,
        })

        const path = getDashboardPathForRole(user.role)
        console.log("[v0] Login: redirecting to", path)
        router.replace(path)
      } else {
        toast({
          title: "Login failed",
          description: "We couldn't determine your profile. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      const message = error instanceof Error ? error.message : "An error occurred during login. Please try again."
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="absolute top-4 left-4">
        <Button variant="outline" onClick={() => router.push("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Button>
      </div>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-900">{t.home.title}</CardTitle>
          <CardDescription>{t.auth.loginTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.common.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? t.common.loading : t.auth.signIn}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link href="/signup" className="text-sm text-blue-600 hover:underline">
              {t.auth.createAccount} ({t.auth.admin})
            </Link>
            <br />
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              {t.auth.forgotPassword}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
