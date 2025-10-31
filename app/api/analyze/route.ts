import { type NextRequest, NextResponse } from "next/server";

const MODEL_API_URL =
  process.env.MODEL_API_URL || "https://cancer-detection-1-2uz2.onrender.com/predict";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let imageBlob: Blob | null = null;

    // 🧩 Case 1: JSON body with imageUrl
    if (contentType.includes("application/json")) {
      const { imageUrl } = await request.json();
      if (!imageUrl) {
        console.warn("[v0] ❌ No imageUrl provided in JSON.");
        return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
      }

      console.log("[v0] 🔗 Fetching image from:", imageUrl);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) throw new Error("Failed to fetch image from Blob");
      const imageBuffer = await imageResponse.arrayBuffer();
      imageBlob = new Blob([imageBuffer], { type: "image/jpeg" });
    }

    // 🧩 Case 2: FormData with a file (fallback)
    else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        console.warn("[v0] ❌ No file in form-data.");
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      const fileBuffer = await file.arrayBuffer();
      imageBlob = new Blob([fileBuffer], { type: file.type });
    }

    if (!imageBlob) {
      return NextResponse.json(
        { error: "No image found in request" },
        { status: 400 }
      );
    }

    console.log("[v0] ✅ Sending image to model API:", MODEL_API_URL);

    // 🔍 Send to FastAPI model
    const modelForm = new FormData();
    modelForm.append("file", imageBlob, "cervix.jpg");

    const modelResponse = await fetch(MODEL_API_URL, {
      method: "POST",
      body: modelForm,
    });

    if (!modelResponse.ok) {
      const errText = await modelResponse.text();
      console.error("[v0] ❌ Model API error:", errText);
      return NextResponse.json(
        { error: "Model API failed", details: errText },
        { status: modelResponse.status }
      );
    }

    const prediction = await modelResponse.json();
    console.log("[v0] ✅ Model prediction:", prediction);

    return NextResponse.json({
      success: true,
      prediction: prediction.prediction,
      score: prediction.score,
      threshold: prediction.threshold,
      details: prediction,
    });
  } catch (error) {
    console.error("[v0] ❌ Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image", details: String(error) },
      { status: 500 }
    );
  }
}
