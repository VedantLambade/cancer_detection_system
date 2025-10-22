"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import {
  appointmentService,
  doctorService,
  hospitalService,
  patientService,
  type Appointment,
  type Doctor,
  type Hospital,
} from "@/lib/firebase-services"
import { Calendar, Stethoscope, Building2, Clock, Loader2 } from "lucide-react"

export default function BookAppointment() {
  const { toast } = useToast()
  const user = getCurrentUser()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("")
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [time, setTime] = useState<string>("")
  const [reason, setReason] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        setLoading(true)
        console.log("[v0] BookAppointment loading for user:", user.id)
        const [hs, ds, appts, me] = await Promise.all([
          hospitalService.getAll(),
          doctorService.getAll(),
          appointmentService.getByPatient(user.id),
          patientService.getById(user.id),
        ])
        setHospitals(hs)
        setDoctors(ds)
        const myAppointments = appts.filter((a) => a.patientId === user.id)
        setAppointments(myAppointments)
        if (me?.preferredHospitalId) {
          setSelectedHospitalId(me.preferredHospitalId)
        }
      } catch (e: any) {
        console.error("[v0] BookAppointment load error:", e)
        toast({
          title: "Unable to load",
          description: e?.message || "We couldn't load hospitals, doctors, or appointments.",
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id, toast])

  const filteredDoctors = useMemo(() => {
    if (!selectedHospitalId) return doctors
    const hospital = hospitals.find((h) => h.id === selectedHospitalId)
    if (!hospital) return doctors
    if (!hospital.doctorIds || hospital.doctorIds.length === 0) return []
    const set = new Set(hospital.doctorIds)
    return doctors.filter((d) => d.id && set.has(d.id))
  }, [doctors, hospitals, selectedHospitalId])

  const handleCreate = async () => {
    if (!user?.id) {
      toast({ title: "Authentication required", description: "Please log in again." })
      return
    }
    if (!selectedHospitalId || !selectedDoctorId || !date || !time || !reason.trim()) {
      toast({
        title: "Missing information",
        description: "Please choose hospital, doctor, date, time, and provide a reason.",
      })
      return
    }
    try {
      setSaving(true)
      await appointmentService.create({
        patientId: user.id,
        doctorId: selectedDoctorId,
        hospitalId: selectedHospitalId,
        date,
        time,
        reason: reason.trim(),
        status: "scheduled",
      })
      const appts = await appointmentService.getByPatient(user.id)
      const myAppointments = appts.filter((a) => a.patientId === user.id)
      setAppointments(myAppointments)
      setSelectedDoctorId("")
      setDate("")
      setTime("")
      setReason("")
      toast({
        title: "Appointment booked",
        description: "Your appointment has been scheduled successfully.",
      })
    } catch (e: any) {
      console.error("[v0] Create appointment error:", e)
      toast({
        title: "Could not book",
        description: e?.message || "We couldn't create the appointment. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10" role="status">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading booking data…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book Appointment
          </CardTitle>
          <CardDescription>Choose hospital and doctor, then schedule your visit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Hospital</div>
              <Select value={selectedHospitalId} onValueChange={setSelectedHospitalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((h) => (
                    <SelectItem key={h.id} value={h.id!}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{h.name}</div>
                          <div className="text-xs text-muted-foreground">{h.city}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Doctor</div>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDoctors.map((d) => (
                    <SelectItem key={d.id} value={d.id!}>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{d.name}</div>
                          <div className="text-xs text-muted-foreground">{d.specialization}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Date</div>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Time</div>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <div className="text-sm font-medium">Reason</div>
              <Textarea
                rows={1}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason"
              />
            </div>
          </div>

          <Button className="w-full" onClick={handleCreate} disabled={saving}>
            {saving ? "Booking..." : "Book Appointment"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Appointments
          </CardTitle>
          <CardDescription>Your scheduled visits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No appointments yet.</div>
          ) : (
            appointments.map((a) => {
              const doc = doctors.find((d) => d.id === a.doctorId)
              const hosp = hospitals.find((h) => h.id === a.hospitalId)
              return (
                <div key={a.id} className="border rounded-md p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{doc?.name || "Doctor"}</div>
                    <div className="text-sm text-muted-foreground">{hosp?.name || "Hospital"}</div>
                    <div className="text-sm">
                      {new Date(a.date).toLocaleDateString()} • {a.time}
                    </div>
                  </div>
                  <Badge variant="secondary">{a.status}</Badge>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
