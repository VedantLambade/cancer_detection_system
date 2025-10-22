import { type NextRequest, NextResponse } from "next/server"
import { blobService } from "@/lib/blob-service"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const imageBuffer = await image.arrayBuffer()
    console.log("[v0] Processing image:", image.name, "Size:", image.size, "bytes")

    const imageBlob = new Blob([imageBuffer], { type: image.type })
    const blobUrl = await blobService.uploadCervixImage(imageBlob, "temp-" + Date.now())
    console.log("[v0] Image stored in Blob:", blobUrl)

    // Return immediately with image URL
    return NextResponse.json({
      success: true,
      imageUrl: blobUrl,
      message: "Image uploaded successfully. Prediction will be processed when you submit the form.",
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Failed to process image", details: String(error) }, { status: 500 })
  }
}
