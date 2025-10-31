import { type NextRequest, NextResponse } from "next/server"

const MODEL_API_URL =
  process.env.MODEL_API_URL || "https://cancer-detection-1-2uz2.onrender.com/predict"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] 🔥 Analyze API triggered")

    const { imageUrl } = await request.json().catch(() => ({}))
    if (!imageUrl) {
      console.error("[v0] ❌ No imageUrl provided in body")
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 })
    }

    console.log("[v0] 📸 Fetching image from Blob:", imageUrl)
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      console.error("[v0] ❌ Failed to fetch image:", imageResponse.status, imageResponse.statusText)
      return NextResponse.json(
        { error: "Failed to fetch image from Blob", status: imageResponse.status },
        { status: 400 }
      )
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" })

    console.log("[v0] 🚀 Sending image to model:", MODEL_API_URL)

    const formData = new FormData()
    formData.append("file", imageBlob, "cervix.jpg")

    const modelResponse = await fetch(MODEL_API_URL, {
      method: "POST",
      body: formData,
    })

    if (!modelResponse.ok) {
      const text = await modelResponse.text()
      console.error("[v0] ❌ Model API error:", modelResponse.status, text)
      return NextResponse.json(
        { error: "Model API failed", details: text },
        { status: modelResponse.status }
      )
    }

    const prediction = await modelResponse.json()
    console.log("[v0] ✅ Model prediction:", prediction)

    return NextResponse.json({
      success: true,
      prediction,
    })
  } catch (error) {
    console.error("[v0] 💥 Fatal analyze error:", error)
    return NextResponse.json(
      { error: "Failed to analyze image", details: String(error) },
      { status: 500 }
    )
  }
}
