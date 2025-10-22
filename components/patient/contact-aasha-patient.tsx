"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Send, Phone, User, Heart } from "lucide-react"
import { chatService, ashaWorkerService, patientService } from "@/lib/firebase-services"
import { getCurrentUser } from "@/lib/auth"

interface Message {
  id: string
  sender: "aasha" | "patient"
  name: string
  message: string
  time: string
  date: string
}

export default function ContactAashaPatient() {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [ashaWorker, setAshaWorker] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const currentUser = getCurrentUser()

  useEffect(() => {
    const loadChatData = async () => {
      try {
        if (!currentUser) return

        // Get patient data to find assigned ASHA worker
        const patients = await patientService.getAll()
        const currentPatient = patients.find((p) => p.id === currentUser.id)

        if (currentPatient?.ashaWorkerId) {
          const ashaWorkerData = await ashaWorkerService.getById(currentPatient.ashaWorkerId)
          setAshaWorker(ashaWorkerData)

          // Load chat messages between patient and ASHA worker
          const chatMessages = await chatService.getMessages(currentUser.id, undefined, currentPatient.ashaWorkerId)

          // Convert Firebase messages to component format
          const formattedMessages = chatMessages.map((msg) => ({
            id: msg.id!,
            sender: msg.senderType === "patient" ? "patient" : "aasha",
            name: msg.senderType === "patient" ? "You" : ashaWorkerData?.name || "ASHA Worker",
            message: msg.message,
            time: msg.timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            date:
              msg.timestamp.toDate().toDateString() === new Date().toDateString()
                ? "Today"
                : msg.timestamp.toDate().toLocaleDateString(),
          }))

          setMessages(formattedMessages)
        } else {
          // If no assigned ASHA worker, get first available one
          const ashaWorkers = await ashaWorkerService.getAll()
          if (ashaWorkers.length > 0) {
            setAshaWorker(ashaWorkers[0])
          }
        }
      } catch (error) {
        console.error("[v0] Error loading chat data:", error)
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadChatData()
  }, [currentUser, toast])

  const handleSendMessage = async () => {
    if (newMessage.trim() && currentUser && ashaWorker) {
      try {
        const messageId = await chatService.sendMessage({
          patientId: currentUser.id,
          ashaWorkerId: ashaWorker.id,
          senderId: currentUser.id,
          senderType: "patient",
          message: newMessage,
          isRead: false,
        })

        // Add message to local state for immediate UI update
        const message: Message = {
          id: messageId,
          sender: "patient",
          name: "You",
          message: newMessage,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: "Today",
        }
        setMessages([...messages, message])
        setNewMessage("")
        toast({
          title: "Message sent",
          description: "Your message has been sent to your ASHA Worker.",
        })
      } catch (error) {
        console.error("[v0] Error sending message:", error)
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        })
      }
    }
  }

  const handleEmergencyCall = () => {
    toast({
      title: "Emergency call initiated",
      description: "Connecting you with your ASHA Worker...",
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading chat...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aasha Worker Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your ASHA Worker
            </CardTitle>
            <CardDescription>Your dedicated community health supporter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{ashaWorker?.name || "Loading..."}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{ashaWorker?.phone || "Loading..."}</span>
              </div>
              <div className="text-sm text-muted-foreground">{ashaWorker?.address || "Loading..."}</div>
              <div className="text-sm text-muted-foreground">Experience: {ashaWorker?.experience || "Loading..."}</div>
              <Badge variant="default" className="w-fit">
                <Heart className="h-3 w-3 mr-1" />
                Available
              </Badge>
            </div>
            <Button onClick={handleEmergencyCall} variant="destructive" className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              Emergency Call
            </Button>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat with Your ASHA Worker
            </CardTitle>
            <CardDescription>Get support, ask questions, and stay connected with your health journey</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Messages */}
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start a conversation with your ASHA Worker!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "patient" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === "patient" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">{message.name}</div>
                      <div className="text-sm">{message.message}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {message.time} • {message.date}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={2}
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Messages</CardTitle>
          <CardDescription>Common questions and messages you can send quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => setNewMessage("I have some questions about my recent report. Can we discuss?")}
              className="text-left justify-start h-auto p-4"
            >
              <div>
                <div className="font-medium">Ask about report</div>
                <div className="text-sm text-muted-foreground">Questions about your screening results</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setNewMessage("I'm experiencing some symptoms and would like to discuss them with you.")}
              className="text-left justify-start h-auto p-4"
            >
              <div>
                <div className="font-medium">Report symptoms</div>
                <div className="text-sm text-muted-foreground">Share new symptoms or concerns</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setNewMessage("Can you help me schedule my next appointment?")}
              className="text-left justify-start h-auto p-4"
            >
              <div>
                <div className="font-medium">Schedule appointment</div>
                <div className="text-sm text-muted-foreground">Get help booking your next visit</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setNewMessage("I need some emotional support and guidance. Can we talk?")}
              className="text-left justify-start h-auto p-4"
            >
              <div>
                <div className="font-medium">Need support</div>
                <div className="text-sm text-muted-foreground">Get emotional support and guidance</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Remember
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              <span>Your Aasha Worker is here to support you throughout your health journey</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              <span>Don't hesitate to reach out with any questions or concerns, no matter how small</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              <span>Regular communication helps ensure you get the best care possible</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              <span>For medical emergencies, please call emergency services immediately</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
