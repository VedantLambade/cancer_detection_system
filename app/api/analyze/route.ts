import { type NextRequest, NextResponse } from "next/server";

const MODEL_API_URL =
  process.env.MODEL_API_URL ||
  "https://cancer-detection-1-2uz2.onrender.com/predict";

export async function POST(request: NextRequest) {
  try {
    // 🧩 Expect a FormData upload directly from frontend
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      console.error("[v0] ❌ No image file found in request.");
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    console.log(`[v0] ✅ Received image: ${file.name} (${file.size} bytes)`);

    // 🧠 Prepare file for model API
    const imageBuffer = await file.arrayBuffer();
    const backendForm = new FormData();
    backendForm.append("file", new Blob([imageBuffer], { type: file.type }), file.name);

    console.log("[v0] 🔗 Sending image to backend model:", MODEL_API_URL);

    const modelResponse = await fetch(MODEL_API_URL, {
      method: "POST",
      body: backendForm,
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
    console.log("[v0] ✅ Prediction received:", prediction);

    return NextResponse.json({
      success: true,
      prediction: prediction.prediction,
      score: prediction.score,
      threshold: prediction.threshold,
      class: prediction.class,
    });
  } catch (error) {
    console.error("[v0] ❌ Analyze route error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image", details: String(error) },
      { status: 500 }
    );
  }
}
