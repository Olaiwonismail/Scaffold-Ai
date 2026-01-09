import { type NextRequest, NextResponse } from "next/server"
import { BASE_URL } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    const response = await fetch(`${BASE_URL}/quizes`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      // Try to get detailed error from backend
      let errorMessage = "Failed to generate quiz"
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage = errorData.detail
        }
      } catch {
        errorMessage = `Quiz request failed: ${response.statusText}`
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Quiz error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to get quiz"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
