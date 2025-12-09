import { type NextRequest, NextResponse } from "next/server"

const BASE_URL = "http://34.30.193.245:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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
