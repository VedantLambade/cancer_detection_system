"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n-context"
import { useRouter } from "next/navigation"
import { Brain, Users, Mic, ArrowRight, Shield, Clock, Heart } from "lucide-react"

export default function HomePage() {
  const { t } = useI18n()
  const router = useRouter()

  const features = [
    {
      icon: Brain,
      title: t.home.features.aiDetection,
      description: t.home.features.aiDetectionDesc,
      color: "bg-blue-500",
    },
    {
      icon: Users,
      title: t.home.features.multiRole,
      description: t.home.features.multiRoleDesc,
      color: "bg-green-500",
    },
    {
      icon: Mic,
      title: t.home.features.voiceSupport,
      description: t.home.features.voiceSupportDesc,
      color: "bg-purple-500",
    },
  ]

  const stats = [
    { label: "Early Detection Rate", value: "95%", icon: Shield },
    { label: "Response Time", value: "<24h", icon: Clock },
    { label: "Patient Satisfaction", value: "98%", icon: Heart },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">{t.home.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="outline" onClick={() => router.push("/login")} className="hidden sm:flex">
              {t.common.login}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4 text-sm">
            AI-Powered Healthcare Solution
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">{t.home.title}</h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4 font-medium">{t.home.subtitle}</p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto text-pretty">{t.home.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/login")}
              className="bg-blue-700 hover:bg-blue-800 text-white border-0 px-8 py-3 text-lg font-semibold shadow-lg"
            >
              {t.home.getStarted}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/signup")}
              className="px-8 py-3 text-lg border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {t.auth.createAccount}
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-0 shadow-lg bg-white/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Advanced Healthcare Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive cancer detection system with cutting-edge technology and user-friendly interface
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur-sm"
            >
              <CardHeader>
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center border-0 shadow-xl bg-blue-600 rounded-lg overflow-hidden">
          <div className="pt-12 pb-12 px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">{t.home.cta}</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of patients and healthcare providers using our AI-powered system
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/login")}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold border-0 shadow-md"
            >
              {t.home.getStarted}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">{t.home.title}</span>
            </div>
            <div className="text-sm text-gray-600">© 2024 Cancer Detection System. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
