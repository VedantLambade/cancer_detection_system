"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, type User } from "@/lib/auth"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: ("admin" | "doctor" | "patient" | "aasha_worker")[]
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()

    if (!currentUser) {
      console.log("[v0] AuthGuard: no currentUser, redirecting to /login")
      router.push("/login")
      return
    }

    setUser(currentUser)
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
