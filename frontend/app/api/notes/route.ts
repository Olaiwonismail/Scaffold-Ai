import { NextResponse, type NextRequest } from "next/server"
import { getCollection } from "@/lib/mongodb"

type NoteDoc = {
  uid: string
  courseId: string
  moduleIndex: number
  subModuleIndex: number
  content: string
  createdAt: string
  updatedAt: string
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams
  const uid = search.get("uid")
  const courseId = search.get("courseId")
  const moduleIndexParam = search.get("moduleIndex")
  const subModuleIndexParam = search.get("subModuleIndex")

  if (!uid || !courseId) {
    return NextResponse.json({ error: "uid and courseId are required" }, { status: 400 })
  }

  const filter: Partial<NoteDoc> = { uid, courseId }
  if (moduleIndexParam !== null) {
    const parsed = Number.parseInt(moduleIndexParam, 10)
    if (Number.isNaN(parsed)) return NextResponse.json({ error: "moduleIndex must be a number" }, { status: 400 })
    filter.moduleIndex = parsed
  }
  if (subModuleIndexParam !== null) {
    const parsed = Number.parseInt(subModuleIndexParam, 10)
    if (Number.isNaN(parsed)) return NextResponse.json({ error: "subModuleIndex must be a number" }, { status: 400 })
    filter.subModuleIndex = parsed
  }

  const notes = await getCollection<NoteDoc>("notes")

  if (filter.moduleIndex !== undefined && filter.subModuleIndex !== undefined) {
    const doc = await notes.findOne(filter)
    return NextResponse.json(doc ?? { ...filter, content: "", createdAt: "", updatedAt: "" })
  }

  const allNotes = await notes.find(filter).toArray()
  return NextResponse.json({ notes: allNotes })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { uid, courseId, moduleIndex, subModuleIndex, content = "" } = body

  if (!uid || !courseId) {
    return NextResponse.json({ error: "uid and courseId are required" }, { status: 400 })
  }
  if (typeof moduleIndex !== "number" || typeof subModuleIndex !== "number") {
    return NextResponse.json({ error: "moduleIndex and subModuleIndex must be numbers" }, { status: 400 })
  }

  const now = new Date().toISOString()
  const notes = await getCollection<NoteDoc>("notes")
  const filter = { uid, courseId, moduleIndex, subModuleIndex }

  await notes.updateOne(filter, { $set: { ...filter, content, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true })
  const saved = await notes.findOne(filter)

  return NextResponse.json(saved)
}
