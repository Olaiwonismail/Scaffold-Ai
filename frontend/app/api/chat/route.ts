import { type NextRequest, NextResponse } from "next/server"

const BASE_URL = "http://34.41.8.110:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BASE_URL}/chatbot`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.statusText}`)
    }

    const text = await response.text()
    return NextResponse.json({ message: text })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
