// Re-export types so we don't break imports
export type { User, SubModule, Module, UploadedFile, Course, LessonStep, LessonPhase, QuizQuestion, Quiz } from "./types"
import type { User, Course } from "./types"

// --- API Helpers ---

// User Operations
export const getUser = async (uid: string): Promise<User | null> => {
  try {
    const res = await fetch(`/api/users?uid=${uid}`)
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export const saveUser = async (user: User): Promise<User | null> => {
  try {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
    if (!res.ok) throw new Error("Failed to save user")
    return await res.json()
  } catch (error) {
    console.error("Error saving user:", error)
    return null
  }
}

// Course Operations
export const getCourses = async (uid: string): Promise<Course[]> => {
  try {
    const res = await fetch(`/api/courses?uid=${uid}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.courses || []
  } catch (error) {
    console.error("Error fetching courses:", error)
    return []
  }
}

export const getCourseById = async (uid: string, courseId: string): Promise<Course | null> => {
  try {
    const courses = await getCourses(uid)
    return courses.find((c) => c.id === courseId) || null
  } catch (error) {
    console.error("Error fetching course:", error)
    return null
  }
}

export const saveCourse = async (uid: string, course: Course): Promise<Course | null> => {
  try {
    const currentCourses = await getCourses(uid)
    const idx = currentCourses.findIndex((c) => c.id === course.id)
    let updatedCourses = [...currentCourses]
    if (idx >= 0) {
      updatedCourses[idx] = course
    } else {
      updatedCourses.push(course)
    }

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, courses: updatedCourses }),
    })

    if (!res.ok) throw new Error("Failed to save courses")
    return course
  } catch (error) {
    console.error("Error saving course:", error)
    return null
  }
}

export const deleteCourse = async (uid: string, courseId: string): Promise<void> => {
  try {
    const currentCourses = await getCourses(uid)
    const filtered = currentCourses.filter((c) => c.id !== courseId)

    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, courses: filtered }),
    })
  } catch (error) {
    console.error("Error deleting course:", error)
  }
}

// Helper to generate IDs
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
