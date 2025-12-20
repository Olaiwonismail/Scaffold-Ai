import { type NextRequest, NextResponse } from "next/server"
import { BASE_URL } from "@/lib/config"

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "100mb",
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files")
    const urls = formData.get("urls")

    const externalFormData = new FormData()

    for (const file of files) {
      if (file instanceof File) {
        // Convert File to Blob with proper filename
        const arrayBuffer = await file.arrayBuffer()
        const blob = new Blob([arrayBuffer], { type: file.type })
        externalFormData.append("files", blob, file.name)
      }
    }
    if (typeof urls === "string" && urls.trim()) {
      externalFormData.append("urls", urls)
    }

    console.log("[v0] Uploading files to external API:", files.length, "files")

    const response = await fetch(`${BASE_URL}upload_pdfs/`, {
      method: "POST",
      headers: {
        accept: "application/json",
      },
      body: externalFormData,
    })

    const responseText = await response.text()
    console.log("[v0] External API response status:", response.status)
    console.log("[v0] External API response:", responseText.substring(0, 200))

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upload failed: ${response.status} - ${responseText}` },
        { status: response.status },
      )
    }

    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: `Invalid JSON response: ${responseText.substring(0, 100)}` }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload files" },
      { status: 500 },
    )
  }
}
