"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Users, Stethoscope, Building2, Eye, Edit, Loader2 } from "lucide-react"
import { patientService, doctorService, ashaWorkerService } from "@/lib/firebase-services"
import type { Patient, Doctor, AshaWorker } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

export default function ManageConnections() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("patients")
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [ashaWorkers, setAshaWorkers] = useState<AshaWorker[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [patientsData, doctorsData, ashaWorkersData] = await Promise.all([
          patientService.getAll(),
          doctorService.getAll(),
          ashaWorkerService.getAll(),
        ])

        setPatients(patientsData)
        setDoctors(doctorsData)
        setAshaWorkers(ashaWorkersData)
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load data from database",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredAshaWorkers = ashaWorkers.filter(
    (worker) =>
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Connections
          </CardTitle>
          <CardDescription>View and manage patients, doctors, and ASHA workers in your network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, address, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Patients ({filteredPatients.length})
              </TabsTrigger>
              <TabsTrigger value="doctors" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Doctors ({filteredDoctors.length})
              </TabsTrigger>
              <TabsTrigger value="ashaWorkers" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                ASHA Workers ({filteredAshaWorkers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patients" className="space-y-4">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No patients found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.patientId}</TableCell>
                        <TableCell>{patient.name}</TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell>{patient.gender}</TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>{patient.address}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="doctors" className="space-y-4">
              {filteredDoctors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Stethoscope className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No doctors found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium">{doctor.name}</TableCell>
                        <TableCell>{doctor.specialization}</TableCell>
                        <TableCell>{doctor.phone}</TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell>{doctor.experience}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="ashaWorkers" className="space-y-4">
              {filteredAshaWorkers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No ASHA workers found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAshaWorkers.map((worker) => (
                      <TableRow key={worker.id}>
                        <TableCell className="font-medium">{worker.name}</TableCell>
                        <TableCell>{worker.phone}</TableCell>
                        <TableCell>{worker.address}</TableCell>
                        <TableCell>{worker.experience}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
