"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { chatService, patientService, type Patient } from "@/lib/firebase-services"
import { getCurrentUser } from "@/lib/auth"
import { MessageCircle, Send, Users, User } from "lucide-react"

interface MessageVM {
  id: string
  sender: "aasha" | "patient"
  name: string
  message: string
  time: string
  date: string
}

export default function ContactPatients() {
  const { toast } = useToast()
  const currentUser = getCurrentUser()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [messages, setMessages] = useState<MessageVM[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false) // new

  const userId = currentUser?.id

  useEffect(() => {
    const load = async () => {
      try {
        if (!userId) return
        const items = await patientService.getByAshaWorker(userId)
        setPatients(items)
        // only set default selected patient if not already set or changed
        if (items.length > 0 && selectedPatientId !== items[0].id) {
          setSelectedPatientId(items[0].id!)
        }
      } catch (error) {
        console.error("[v0] Error loading patients for ASHA:", error)
        toast({
          title: "Unable to load patients",
          description: (error as any)?.message || "Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]) // depend on userId only

  const selectedPatient = useMemo(() => patients.find((p) => p.id === selectedPatientId), [patients, selectedPatientId])

  useEffect(() => {
    const loadChat = async () => {
      try {
        if (!userId || !selectedPatientId) return
        setMessagesLoading(true)
        const msgs = await chatService.getMessages(selectedPatientId, undefined, userId)
        const patientName = selectedPatient?.name || "Patient" // safe to read; not a dependency
        const vm: MessageVM[] = msgs.map((m) => ({
          id: m.id!,
          sender: m.senderType === "ashaWorker" ? "aasha" : "patient",
          name: m.senderType === "ashaWorker" ? "You" : patientName,
          message: m.message,
          time: m.timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date:
            m.timestamp.toDate().toDateString() === new Date().toDateString()
              ? "Today"
              : m.timestamp.toDate().toLocaleDateString(),
        }))
        setMessages(vm)
      } catch (error) {
        console.error("[v0] Error loading patient chat:", error)
        toast({
          title: "Unable to load chat",
          description: (error as any)?.message || "Please try again.",
        })
      } finally {
        setMessagesLoading(false)
      }
    }
    // clear messages when switching active patient
    setMessages([])
    loadChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedPatientId]) // stable deps

  const handleSend = async () => {
    if (!newMessage.trim() || !userId || !selectedPatientId) return
    try {
      const id = await chatService.sendMessage({
        patientId: selectedPatientId,
        ashaWorkerId: userId,
        senderId: userId,
        senderType: "ashaWorker",
        message: newMessage,
        isRead: false,
      })
      setMessages((prev) => [
        ...prev,
        {
          id,
          sender: "aasha",
          name: "You",
          message: newMessage,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: "Today",
        },
      ])
      setNewMessage("")
      toast({ title: "Message sent", description: "Your message has been sent to the patient." })
    } catch (error) {
      console.error("[v0] Error sending patient message:", error)
      toast({
        title: "Message not sent",
        description: (error as any)?.message || "We couldn’t send your message. Please try again.",
      })
    }
  }

  if (loading) return <div className="flex items-center justify-center p-8">Loading patients...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Patients list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Patients
          </CardTitle>
          <CardDescription>Patients assigned to you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {patients.length === 0 ? (
            <div className="text-sm text-muted-foreground">No patients assigned yet.</div>
          ) : (
            patients.map((p) => (
              <button
                key={p.id}
                type="button" // ensure button does not submit any parent form
                onClick={() => {
                  setSelectedPatientId(p.id!)
                  setMessages([])
                }}
                className={`w-full text-left px-3 py-2 rounded border ${
                  selectedPatientId === p.id ? "bg-gray-100" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.phone}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Chat */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {selectedPatient ? `Chat with ${selectedPatient.name}` : "Select a patient to chat"}
          </CardTitle>
          <CardDescription>Coordinate care and guidance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {messagesLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading conversation…</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No messages yet.</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "aasha" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      m.sender === "aasha" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">{m.name}</div>
                    <div className="text-sm">{m.message}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {m.time} • {m.date}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              rows={2}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <Button onClick={handleSend} disabled={!newMessage.trim() || !selectedPatientId}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
