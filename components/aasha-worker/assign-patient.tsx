"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import {
  patientService,
  doctorService,
  ashaDoctorLinkService,
  assignmentService,
  hospitalService, // to let ASHA assign hospital
  type Patient,
  type Doctor,
  type PatientDoctorAssignment,
  type Hospital, //
} from "@/lib/firebase-services"
import { Plus, Link2, Unlink, User, Stethoscope, CheckCircle2, Loader2 } from "lucide-react"

export default function AssignPatient() {
  const { toast } = useToast()
  const currentUser = getCurrentUser()
  const ashaId = currentUser?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [patients, setPatients] = useState<Patient[]>([])
  const [linkedDoctors, setLinkedDoctors] = useState<(Doctor & { _linkId?: string })[]>([])
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([])
  const [assignments, setAssignments] = useState<PatientDoctorAssignment[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([]) // hospitals list for assignment

  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [selectedDoctor, setSelectedDoctor] = useState<string>("")
  const [doctorToLink, setDoctorToLink] = useState<string>("")
  const [selectedPatientForHospital, setSelectedPatientForHospital] = useState<string>("") //
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("") //

  useEffect(() => {
    const load = async () => {
      if (!ashaId) return
      try {
        setLoading(true)
        const [myPatients, myDoctors, availableDoctors, myAssignments, allHospitals] = await Promise.all([
          patientService.getByAshaWorker(ashaId),
          ashaDoctorLinkService.getDoctorsForAsha(ashaId),
          doctorService.getAll(),
          assignmentService.getByAshaWorker(ashaId),
          hospitalService.getAll(), //
        ])
        setPatients(myPatients)
        setLinkedDoctors(myDoctors)
        setAllDoctors(availableDoctors)
        setAssignments(myAssignments)
        setHospitals(allHospitals) //
      } catch (err: any) {
        console.error("[v0] Failed loading assign data:", err)
        toast({
          title: "Could not load data",
          description:
            err?.message || "We couldn’t load patients or doctors. Please check your connection and try again.",
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ashaId, toast])

  const unlinkedDoctors = useMemo(() => {
    const linkedIds = new Set(linkedDoctors.map((d) => d.id))
    return allDoctors.filter((d) => d.id && !linkedIds.has(d.id))
  }, [allDoctors, linkedDoctors])

  const patientNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of patients) {
      if (p.id) m.set(p.id, p.name)
    }
    return m
  }, [patients])

  const doctorNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const d of allDoctors) {
      if (d.id) m.set(d.id, d.name)
    }
    return m
  }, [allDoctors])

  const handleLinkDoctor = async () => {
    if (!ashaId || !doctorToLink) {
      toast({
        title: "Select a doctor",
        description: "Please choose a doctor to add to your list.",
      })
      return
    }
    try {
      setSaving(true)
      await ashaDoctorLinkService.linkDoctor(ashaId, doctorToLink)
      const myDoctors = await ashaDoctorLinkService.getDoctorsForAsha(ashaId)
      setLinkedDoctors(myDoctors)
      setDoctorToLink("")
      toast({
        title: "Doctor added to your list",
        description: "You can now assign your patients to this doctor.",
      })
    } catch (err: any) {
      console.error("[v0] Error linking doctor:", err)
      toast({
        title: "Could not add doctor",
        description: err?.message || "Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUnlinkDoctor = async (linkId?: string) => {
    if (!ashaId || !linkId) return
    try {
      setSaving(true)
      await ashaDoctorLinkService.unlinkDoctor(linkId)
      const myDoctors = await ashaDoctorLinkService.getDoctorsForAsha(ashaId)
      setLinkedDoctors(myDoctors)
      toast({
        title: "Doctor removed",
        description: "This doctor is no longer on your list.",
      })
    } catch (err: any) {
      console.error("[v0] Error unlinking doctor:", err)
      toast({
        title: "Could not remove doctor",
        description: err?.message || "Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async () => {
    if (!ashaId) {
      toast({ title: "Authentication required", description: "Please log in again." })
      return
    }
    if (!selectedPatient || !selectedDoctor) {
      toast({
        title: "Complete selection",
        description: "Choose both a patient and a doctor from your lists.",
      })
      return
    }
    try {
      setSaving(true)
      await assignmentService.create({
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        ashaWorkerId: ashaId,
      })
      const myAssignments = await assignmentService.getByAshaWorker(ashaId)
      setAssignments(myAssignments)
      setSelectedPatient("")
      setSelectedDoctor("")
      toast({
        title: "Patient assigned",
        description: "The patient has been assigned to the selected doctor.",
      })
    } catch (err: any) {
      console.error("[v0] Error assigning patient:", err)
      toast({
        title: "Could not assign",
        description: err?.message || "We couldn’t complete the assignment. Please verify selections and try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAssignHospital = async () => {
    if (!ashaId) {
      toast({ title: "Authentication required", description: "Please log in again." })
      return
    }
    if (!selectedPatientForHospital || !selectedHospitalId) {
      toast({
        title: "Complete selection",
        description: "Choose both a patient and a hospital.",
      })
      return
    }
    try {
      setSaving(true)
      await patientService.update(selectedPatientForHospital, { preferredHospitalId: selectedHospitalId })
      setSelectedPatientForHospital("")
      setSelectedHospitalId("")
      toast({
        title: "Hospital set for patient",
        description: "The selected hospital will be suggested when booking appointments.",
      })
    } catch (err: any) {
      console.error("[v0] Error assigning hospital:", err)
      toast({
        title: "Could not assign hospital",
        description: err?.message || "We couldn’t save the selection. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading your patients and doctors…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Manage My Doctors
          </CardTitle>
          <CardDescription>Add doctors to your list to enable assignments and chat access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Select value={doctorToLink} onValueChange={setDoctorToLink}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor to add" />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedDoctors.map((d) => (
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
            <Button onClick={handleLinkDoctor} disabled={saving || !doctorToLink} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add to My Doctors
            </Button>
          </div>

          {linkedDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {linkedDoctors.map((d) => (
                <div key={d.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.specialization}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleUnlinkDoctor(d._linkId)} disabled={saving}>
                    <Unlink className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No doctors in your list yet.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Assign Patient to Doctor
          </CardTitle>
          <CardDescription>You can only assign patients you added to doctors in your list.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div aria-busy={saving}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Patient</div>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id!}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.patientId}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Doctor</div>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedDoctors.map((d) => (
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

            <Button onClick={handleAssign} disabled={saving || !selectedPatient || !selectedDoctor} className="w-full">
              {saving ? "Assigning..." : "Assign Patient"}
            </Button>

            {assignments.length > 0 && (
              <div className="pt-4">
                <div className="text-sm font-medium mb-2">Recent Assignments</div>
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <div key={a.id} className="text-sm text-muted-foreground">
                      {`Patient ${patientNameById.get(a.patientId) || a.patientId} → Doctor ${doctorNameById.get(a.doctorId) || a.doctorId}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {/* Re-using icon style */}
            <CheckCircle2 className="h-5 w-5" />
            Assign Patient to Hospital
          </CardTitle>
          <CardDescription>Set a default hospital for patients you added. This helps during booking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div aria-busy={saving}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Patient</div>
                <Select value={selectedPatientForHospital} onValueChange={setSelectedPatientForHospital}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id!}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.patientId}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Hospital</div>
                <Select value={selectedHospitalId} onValueChange={setSelectedHospitalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((h) => (
                      <SelectItem key={h.id} value={h.id!}>
                        {h.name} <span className="text-xs text-muted-foreground">• {h.city}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleAssignHospital}
              disabled={saving || !selectedPatientForHospital || !selectedHospitalId}
              className="w-full"
            >
              {saving ? "Saving..." : "Set Default Hospital"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
