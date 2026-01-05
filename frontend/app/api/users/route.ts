import { NextResponse, type NextRequest } from "next/server"
import { getCollection } from "@/lib/mongodb"

type UserDoc = {
  uid: string
  email: string
  name: string
  analogy?: string
  adaptLevel?: number
  createdAt: string
  updatedAt: string
  // Profile fields
  school?: string
  country?: string
  grade?: string
  bio?: string
  avatarUrl?: string
}

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid")
  if (!uid) {
    return NextResponse.json({ error: "uid is required" }, { status: 400 })
  }

  const users = await getCollection<UserDoc>("users")
  const user = await users.findOne({ uid })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { uid, email, name, analogy = "", adaptLevel = 5, school, country, grade, bio } = body

  if (!uid || !email || !name) {
    return NextResponse.json({ error: "uid, email, and name are required" }, { status: 400 })
  }

  const now = new Date().toISOString()
  const users = await getCollection<UserDoc>("users")

  await users.updateOne(
    { uid },
    { $set: { uid, email, name, analogy, adaptLevel, school, country, grade, bio, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )

  const saved = await users.findOne({ uid })
  return NextResponse.json(saved)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { uid, analogy, adaptLevel, name, school, country, grade, bio } = body

  if (!uid) {
    return NextResponse.json({ error: "uid is required" }, { status: 400 })
  }

  const users = await getCollection<UserDoc>("users")
  const update: Partial<UserDoc> = { updatedAt: new Date().toISOString() }

  if (typeof analogy === "string") update.analogy = analogy
  if (typeof adaptLevel === "number") update.adaptLevel = adaptLevel
  if (typeof name === "string") update.name = name
  if (typeof school === "string") update.school = school
  if (typeof country === "string") update.country = country
  if (typeof grade === "string") update.grade = grade
  if (typeof bio === "string") update.bio = bio

  await users.updateOne({ uid }, { $set: update })
  const saved = await users.findOne({ uid })
  if (!saved) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json(saved)
}
