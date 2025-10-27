import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 })
    }

    console.log("[v0] Analyzing image from Blob:", imageUrl)

    // Fetch the image from Blob
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image from Blob")
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" })

    // Create FormData for model API
    const formData = new FormData()
    formData.append("file", imageBlob, "cervix.jpg")

    const modelUrl = process.env.MODEL_API_URL ||"https://cancer-detection-1-2uz2.onrender.com/predict"
    console.log("[v0] Sending to model API:", modelUrl)

    const modelResponse = await fetch(modelUrl, {
      method: "POST",
      body: formData,
    })

    if (!modelResponse.ok) {
      console.error("[v0] Model API error:", modelResponse.status)
      throw new Error(`Model API returned ${modelResponse.status}`)
    }

    const prediction = await modelResponse.json()
    console.log("[v0] Model prediction:", prediction)

    return NextResponse.json({
      success: true,
      prediction: prediction.prediction,
      score: prediction.score,
      threshold: prediction.threshold,
    })
  } catch (error) {
    console.error("[v0] Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze image", details: String(error) }, { status: 500 })
  }
}
