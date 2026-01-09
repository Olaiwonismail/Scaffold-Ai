import { type NextRequest, NextResponse } from "next/server"
import { BASE_URL } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    const response = await fetch(`${BASE_URL}/tutor`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Tutor request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Tutor error:", error)
    return NextResponse.json({ error: "Failed to get tutor content" }, { status: 500 })
  }
}
