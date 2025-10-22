// Firebase service functions for CRUD operations
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "./firebase"

// Types for our data structures
export interface Patient {
  id?: string
  patientId: string
  name: string
  age: number
  gender: string
  phone: string
  address: string
  medicalHistory: string
  ashaWorkerId: string
  email?: string
  password?: string // legacy
  preferredHospitalId?: string // ASHA-set default hospital
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AshaWorker {
  id?: string
  name: string
  phone: string
  address: string
  experience: string
  username: string
  email?: string
  password?: string // legacy
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Doctor {
  id?: string
  name: string
  specialization: string
  phone: string
  email: string
  hospitalId?: string
  experience: string
  username: string
  password: string
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy?: string
}

export interface CervixAnalysis {
  id?: string
  patientId: string
  imageUrl: string
  analysis: string
  riskLevel: "low" | "medium" | "high"
  doctorId?: string
  ashaWorkerId: string
  createdAt: Timestamp
  // Doctor review additions
  doctorFeedback?: string
  nextSteps?: string
  doctorReviewAt?: Timestamp
}

export interface ChatMessage {
  id?: string
  patientId: string
  doctorId?: string
  ashaWorkerId?: string
  senderId: string
  senderType: "doctor" | "patient" | "ashaWorker"
  message: string
  timestamp: Timestamp
  isRead: boolean
}

export interface VideoCall {
  id?: string
  patientId: string
  doctorId: string
  callId: string
  status: "ongoing" | "completed" | "missed"
  startTime: Timestamp
  endTime?: Timestamp
  duration?: number
}

export interface Appointment {
  id?: string
  patientId: string
  doctorId: string
  hospitalId: string
  date: string
  time: string
  reason: string
  symptoms?: string
  status: "scheduled" | "completed" | "cancelled"
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Hospital {
  id?: string
  name: string
  type: "Government" | "Private"
  city: string
  address: string
  phone: string
  doctorIds: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy?: string
}

export interface Admin {
  id?: string
  name: string
  email: string
  role: "admin" | "superadmin"
  permissions: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AshaDoctorLink {
  id?: string
  ashaWorkerId: string
  doctorId: string
  createdAt: Timestamp
}

export interface PatientDoctorAssignment {
  id?: string
  patientId: string
  doctorId: string
  ashaWorkerId: string
  createdAt: Timestamp
}

// Patient Services
export const patientService = {
  async create(patient: Omit<Patient, "id" | "createdAt" | "updatedAt">) {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, "patients"), {
      ...patient,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async getAll() {
    const querySnapshot = await getDocs(collection(db, "patients"))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Patient[]
  },

  async getByAshaWorker(ashaWorkerId: string) {
    const q = query(collection(db, "patients"), where("ashaWorkerId", "==", ashaWorkerId))
    const querySnapshot = await getDocs(q)
    const patients = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Patient[]

    // Sort newest first without using Firestore orderBy to avoid composite index
    patients.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    return patients
  },

  async getById(id: string) {
    const docRef = doc(db, "patients", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Patient
    }
    return null
  },

  async update(id: string, updates: Partial<Patient>) {
    const docRef = doc(db, "patients", id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string) {
    await deleteDoc(doc(db, "patients", id))
  },

  async getByCredentials(username: string, password: string) {
    const q = query(collection(db, "patients"), where("patientId", "==", username), where("password", "==", password))
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as Patient
    }
    return null
  },

  async getByPatientId(patientId: string) {
    const q = query(collection(db, "patients"), where("patientId", "==", patientId))
    const qs = await getDocs(q)
    if (qs.empty) return null
    const d = qs.docs[0]
    return { id: d.id, ...d.data() } as Patient
  },
}

// ASHA Worker Services
export const ashaWorkerService = {
  async create(ashaWorker: Omit<AshaWorker, "id" | "createdAt" | "updatedAt">) {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, "ashaWorkers"), {
      ...ashaWorker,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async getAll() {
    const querySnapshot = await getDocs(collection(db, "ashaWorkers"))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AshaWorker[]
  },

  async getById(id: string) {
    const docRef = doc(db, "ashaWorkers", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AshaWorker
    }
    return null
  },

  async getByCredentials(username: string, password: string) {
    const q = query(collection(db, "ashaWorkers"), where("username", "==", username), where("password", "==", password))
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as AshaWorker
    }
    return null
  },

  async update(id: string, updates: Partial<AshaWorker>) {
    const docRef = doc(db, "ashaWorkers", id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string) {
    await deleteDoc(doc(db, "ashaWorkers", id))
  },
}

// Doctor Services
export const doctorService = {
  async create(doctor: Omit<Doctor, "id" | "createdAt" | "updatedAt">) {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, "doctors"), {
      ...doctor,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async getAll() {
    const querySnapshot = await getDocs(collection(db, "doctors"))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Doctor[]
  },

  async getById(id: string) {
    const docRef = doc(db, "doctors", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Doctor
    }
    return null
  },

  async getByCredentials(username: string, password: string) {
    const q = query(collection(db, "doctors"), where("username", "==", username), where("password", "==", password))
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as Doctor
    }
    return null
  },

  async update(id: string, updates: Partial<Doctor>) {
    const docRef = doc(db, "doctors", id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string) {
    await deleteDoc(doc(db, "doctors", id))
  },

  async getByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [] as Doctor[]
    // Avoid N gets by reading all and filtering (small dataset expected in preview)
    const all = await this.getAll()
    const set = new Set(ids)
    return all.filter((d) => d.id && set.has(d.id))
  },
}

// Cervix Analysis Services
export const cervixAnalysisService = {
  async create(analysis: Omit<CervixAnalysis, "id" | "createdAt">) {
    const docRef = await addDoc(collection(db, "cervixAnalyses"), {
      ...analysis,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  },

  async getAll() {
    const q = query(collection(db, "cervixAnalyses"), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CervixAnalysis[]
  },

  async getByPatient(patientId: string) {
    const q = query(collection(db, "cervixAnalyses"), where("patientId", "==", patientId))
    const querySnapshot = await getDocs(q)
    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CervixAnalysis[]
    // newest first without Firestore orderBy
    items.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    return items
  },

  async getByAshaWorker(ashaWorkerId: string) {
    const q = query(collection(db, "cervixAnalyses"), where("ashaWorkerId", "==", ashaWorkerId))
    const querySnapshot = await getDocs(q)
    const analyses = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CervixAnalysis[]

    // Sort newest first without Firestore orderBy
    analyses.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    return analyses
  },

  async delete(id: string) {
    await deleteDoc(doc(db, "cervixAnalyses", id))
  },

  async update(id: string, updates: Partial<CervixAnalysis>) {
    const ref = doc(db, "cervixAnalyses", id)
    await updateDoc(ref, {
      ...updates,
      // no updatedAt here; createdAt is immutable, we mark doctorReviewAt when publishing
    })
  },
}

// Image Upload Service
export const imageService = {
  async uploadCervixImage(file: Blob | File, patientId: string): Promise<string> {
    const timestamp = Date.now()
    const fileName = `cervix-images/${patientId}/${timestamp}-${(file as any).name || "cervix.jpg"}`
    const storageRef = ref(storage, fileName)

    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  },

  async deleteImage(imageUrl: string) {
    const imageRef = ref(storage, imageUrl)
    await deleteObject(imageRef)
  },
}

// Chat Services
export const chatService = {
  async sendMessage(message: Omit<ChatMessage, "id" | "timestamp">) {
    const docRef = await addDoc(collection(db, "chats"), {
      ...message,
      timestamp: Timestamp.now(),
    })
    return docRef.id
  },

  async getMessages(patientId: string, doctorId?: string, ashaWorkerId?: string) {
    // Query only by patientId to avoid composite index requirement
    const q = query(collection(db, "chats"), where("patientId", "==", patientId))
    const querySnapshot = await getDocs(q)

    let messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[]

    if (doctorId) {
      messages = messages.filter((m) => m.doctorId === doctorId)
    } else if (ashaWorkerId) {
      messages = messages.filter((m) => m.ashaWorkerId === ashaWorkerId)
    }

    // Sort by timestamp ascending on the client to replace orderBy("timestamp", "asc")
    messages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())

    return messages
  },

  async markAsRead(messageId: string) {
    const docRef = doc(db, "chats", messageId)
    await updateDoc(docRef, { isRead: true })
  },
}

// Video Call Services
export const callService = {
  async createCall(call: Omit<VideoCall, "id" | "startTime">) {
    const docRef = await addDoc(collection(db, "calls"), {
      ...call,
      startTime: Timestamp.now(),
    })
    return docRef.id
  },

  async endCall(callId: string, duration: number) {
    const docRef = doc(db, "calls", callId)
    await updateDoc(docRef, {
      status: "completed",
      endTime: Timestamp.now(),
      duration,
    })
  },

  async getCallHistory(patientId?: string, doctorId?: string) {
    let q
    if (patientId && doctorId) {
      q = query(
        collection(db, "calls"),
        where("patientId", "==", patientId),
        where("doctorId", "==", doctorId),
        orderBy("startTime", "desc"),
      )
    } else if (patientId) {
      q = query(collection(db, "calls"), where("patientId", "==", patientId), orderBy("startTime", "desc"))
    } else if (doctorId) {
      q = query(collection(db, "calls"), where("doctorId", "==", doctorId), orderBy("startTime", "desc"))
    } else {
      q = query(collection(db, "calls"), orderBy("startTime", "desc"))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as VideoCall[]
  },
}

// Appointment Services
export const appointmentService = {
  async create(appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">) {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, "appointments"), {
      ...appointment,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async getAll() {
    const q = query(collection(db, "appointments"), orderBy("date", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Appointment[]
  },

  async getByPatient(patientId: string) {
    const q = query(collection(db, "appointments"), where("patientId", "==", patientId))
    const querySnapshot = await getDocs(q)
    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Appointment[]
    items.sort((a, b) => {
      // sort by date desc, then time desc (assumes 24h/consistent human string slots)
      if (a.date === b.date) return (b.time || "").localeCompare(a.time || "")
      return (b.date || "").localeCompare(a.date || "")
    })
    return items
  },

  async getByDoctor(doctorId: string) {
    const q = query(collection(db, "appointments"), where("doctorId", "==", doctorId))
    const querySnapshot = await getDocs(q)
    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Appointment[]
    items.sort((a, b) => {
      if (a.date === b.date) return (b.time || "").localeCompare(a.time || "")
      return (b.date || "").localeCompare(a.date || "")
    })
    return items
  },

  async updateStatus(id: string, status: Appointment["status"]) {
    const docRef = doc(db, "appointments", id)
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string) {
    await deleteDoc(doc(db, "appointments", id))
  },
}

// Hospital Services
export const hospitalService = {
  async create(hospital: Omit<Hospital, "id" | "createdAt" | "updatedAt">) {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, "hospitals"), {
      ...hospital,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async getAll() {
    const querySnapshot = await getDocs(collection(db, "hospitals"))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Hospital[]
  },

  async getById(id: string) {
    const docRef = doc(db, "hospitals", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Hospital
    }
    return null
  },

  async update(id: string, updates: Partial<Hospital>) {
    const docRef = doc(db, "hospitals", id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string) {
    await deleteDoc(doc(db, "hospitals", id))
  },
}

// Admin Services
export const adminService = {
  async create(admin: Omit<Admin, "id" | "createdAt" | "updatedAt">) {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, "admins"), {
      ...admin,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async getAll() {
    const querySnapshot = await getDocs(collection(db, "admins"))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Admin[]
  },

  async getById(id: string) {
    const docRef = doc(db, "admins", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Admin
    }
    return null
  },

  async getByEmail(email: string) {
    const q = query(collection(db, "admins"), where("email", "==", email))
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as Admin
    }
    return null
  },

  // Admin authentication is now handled directly in firebase-auth.ts with hardcoded credentials

  async update(id: string, updates: Partial<Admin>) {
    const docRef = doc(db, "admins", id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string) {
    await deleteDoc(doc(db, "admins", id))
  },
}

// ASHA ↔ Doctor Linking Service
export const ashaDoctorLinkService = {
  async linkDoctor(ashaWorkerId: string, doctorId: string) {
    const now = Timestamp.now()
    // prevent duplicates on client: read current and check
    const q = query(
      collection(db, "ashaDoctorLinks"),
      where("ashaWorkerId", "==", ashaWorkerId),
      where("doctorId", "==", doctorId),
    )
    const existing = await getDocs(q)
    if (!existing.empty) return existing.docs[0].id

    const ref = await addDoc(collection(db, "ashaDoctorLinks"), {
      ashaWorkerId,
      doctorId,
      createdAt: now,
    })
    return ref.id
  },

  async unlinkDoctor(linkId: string) {
    await deleteDoc(doc(db, "ashaDoctorLinks", linkId))
  },

  async getDoctorIdsForAsha(ashaWorkerId: string) {
    const q = query(collection(db, "ashaDoctorLinks"), where("ashaWorkerId", "==", ashaWorkerId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AshaDoctorLink, "id">) })) as Array<
      AshaDoctorLink & { id: string }
    >
  },

  async getDoctorsForAsha(ashaWorkerId: string) {
    const links = await this.getDoctorIdsForAsha(ashaWorkerId)
    const doctorIds = links.map((l) => l.doctorId)
    const doctors = await doctorService.getByIds(doctorIds)
    // attach linkId for easy removal
    const linkByDoctor = new Map(links.map((l) => [l.doctorId, l.id!]))
    return doctors.map((d) => ({ ...d, _linkId: d.id ? linkByDoctor.get(d.id) : undefined })) as (Doctor & {
      _linkId?: string
    })[]
  },
}

// Patient → Doctor Assignment Service
export const assignmentService = {
  async create(assignment: Omit<PatientDoctorAssignment, "id" | "createdAt">) {
    const ref = await addDoc(collection(db, "patientDoctorAssignments"), {
      ...assignment,
      createdAt: Timestamp.now(),
    })
    return ref.id
  },

  async getByAshaWorker(ashaWorkerId: string) {
    const q = query(collection(db, "patientDoctorAssignments"), where("ashaWorkerId", "==", ashaWorkerId))
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PatientDoctorAssignment[]
    // newest first, client-side sort to avoid composite index
    items.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    return items
  },

  async getByDoctor(doctorId: string) {
    const q = query(collection(db, "patientDoctorAssignments"), where("doctorId", "==", doctorId))
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PatientDoctorAssignment[]
    items.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    return items
  },

  async delete(id: string) {
    await deleteDoc(doc(db, "patientDoctorAssignments", id))
  },
}
