import { NextResponse, type NextRequest } from "next/server"
import { getCollection } from "@/lib/mongodb"

type CourseDoc = {
  uid: string
  courses: unknown[]
  updatedAt: string
}

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid")
  if (!uid) {
    return NextResponse.json({ error: "uid is required" }, { status: 400 })
  }

  const courses = await getCollection<CourseDoc>("courses")
  const doc = await courses.findOne({ uid })
  return NextResponse.json(doc ?? { uid, courses: [], updatedAt: new Date().toISOString() })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { uid, courses } = body

  if (!uid || !Array.isArray(courses)) {
    return NextResponse.json({ error: "uid and courses array are required" }, { status: 400 })
  }

  const now = new Date().toISOString()
  const collection = await getCollection<CourseDoc>("courses")

  await collection.updateOne({ uid }, { $set: { uid, courses, updatedAt: now } }, { upsert: true })
  const saved = await collection.findOne({ uid })

  return NextResponse.json(saved)
}
