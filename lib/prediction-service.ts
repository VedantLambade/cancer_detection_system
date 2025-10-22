// Service to handle model predictions and save to Firebase
import { Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import { collection, addDoc } from "firebase/firestore"

export interface ModelPrediction {
  id?: string
  patientId: string
  imageUrl: string
  modelClass: "normal" | "abnormal"
  confidence: number
  entropy?: number
  rawPrediction: number
  threshold: number
  ashaWorkerId: string
  createdAt: Timestamp
  modelVersion: string
}

export const predictionService = {
  async savePrediction(prediction: Omit<ModelPrediction, "id" | "createdAt">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "modelPredictions"), {
        ...prediction,
        createdAt: Timestamp.now(),
      })
      console.log("[v0] Prediction saved to Firebase:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("[v0] Error saving prediction:", error)
      throw new Error(`Failed to save prediction: ${error}`)
    }
  },

  async getPredictionsByPatient(patientId: string): Promise<ModelPrediction[]> {
    try {
      const { getDocs, query, where, orderBy } = await import("firebase/firestore")
      const q = query(
        collection(db, "modelPredictions"),
        where("patientId", "==", patientId),
        orderBy("createdAt", "desc"),
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ModelPrediction[]
    } catch (error) {
      console.error("[v0] Error fetching predictions:", error)
      return []
    }
  },
}
