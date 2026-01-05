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
    const userId = formData.get("user_id")
    const existingOutline = formData.get("existing_outline")

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    if (!existingOutline || typeof existingOutline !== "string") {
      return NextResponse.json({ error: "existing_outline is required" }, { status: 400 })
    }

    const externalFormData = new FormData()

    for (const file of files) {
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer()
        const blob = new Blob([arrayBuffer], { type: file.type })
        externalFormData.append("files", blob, file.name)
      }
    }
    if (typeof urls === "string" && urls.trim()) {
      externalFormData.append("urls", urls)
    }
    externalFormData.append("user_id", userId)
    externalFormData.append("existing_outline", existingOutline)

    console.log("[v0] Updating outline for user:", userId)

    const response = await fetch(`${BASE_URL}update_outline/`, {
      method: "POST",
      headers: {
        accept: "application/json",
      },
      body: externalFormData,
    })

    const responseText = await response.text()
    console.log("[v0] External API response status:", response.status)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Update outline failed: ${response.status} - ${responseText}` },
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
    console.error("[v0] Update outline error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update outline" },
      { status: 500 },
    )
  }
}
