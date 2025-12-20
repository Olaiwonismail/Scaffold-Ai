export interface User {
  id: string
  email: string
  name: string
  analogy: string // User's interests/hobbies for personalized learning
  adaptLevel: number // 1-10 slider value
  createdAt: string
}

export interface SubModule {
  title: string
  completed: boolean
  slides?: LessonPhase[]
}

export interface Module {
  title: string
  summary: string
  subtopics: string[]
  subModules: SubModule[]
  completed: boolean
}

export interface UploadedFile {
  name: string
  size: number
  uploadedAt: string
}

export interface Course {
  id: string
  title: string
  modules: Module[]
  files: UploadedFile[]
  createdAt: string
}

export interface LessonStep {
  narration: string
  board: string
}

export interface LessonPhase {
  phase_name: string
  steps: LessonStep[]
  source: string
  images?: string[] // Optional images (data URLs) attached to the slide
}

export interface QuizQuestion {
  question: string
  options: string[]
  answer: string
}

export interface Quiz {
  topic_title: string
  flashcards: QuizQuestion[]
}

// Storage keys
const STORAGE_KEYS = {
  USER: "studysmart_user",
  COURSE: "studysmart_course",
  SLIDES_CACHE: "studysmart_slides_cache",
  QUIZ_CACHE: "studysmart_quiz_cache",
}

// User operations
export const saveUser = (user: User) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  }
}

export const getUser = (): User | null => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(STORAGE_KEYS.USER)
    return data ? JSON.parse(data) : null
  }
  return null
}

export const clearUser = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.USER)
  }
}

// Course operations (multi-course support)
const parseCourses = (): Course[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.COURSE)
  if (!data) return []
  try {
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === "object") return [parsed as Course]
  } catch {
    return []
  }
  return []
}

export const getCourses = (): Course[] => parseCourses()

export const getCourseById = (id: string): Course | null => {
  return parseCourses().find((c) => c.id === id) || null
}

// Keeps compatibility; returns the first course if present
export const getCourse = (): Course | null => {
  const courses = parseCourses()
  return courses.length ? courses[0] : null
}

export const saveCourse = (course: Course) => {
  if (typeof window === "undefined") return
  const courses = parseCourses()
  const idx = courses.findIndex((c) => c.id === course.id)
  if (idx >= 0) {
    courses[idx] = course
  } else {
    courses.push(course)
  }
  localStorage.setItem(STORAGE_KEYS.COURSE, JSON.stringify(courses))
}

export const deleteCourse = (id: string) => {
  if (typeof window === "undefined") return
  const filtered = parseCourses().filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEYS.COURSE, JSON.stringify(filtered))
}

export const clearCourse = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.COURSE)
  }
}

// Slides cache operations
export const saveSlidesToCache = (key: string, slides: LessonPhase[]) => {
  if (typeof window !== "undefined") {
    const cache = getSlidesCache()
    cache[key] = slides
    localStorage.setItem(STORAGE_KEYS.SLIDES_CACHE, JSON.stringify(cache))
  }
}

export const getSlidesFromCache = (key: string): LessonPhase[] | null => {
  if (typeof window !== "undefined") {
    const cache = getSlidesCache()
    return cache[key] || null
  }
  return null
}

export const getSlidesCache = (): Record<string, LessonPhase[]> => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(STORAGE_KEYS.SLIDES_CACHE)
    return data ? JSON.parse(data) : {}
  }
  return {}
}

// Quiz cache operations
export const saveQuizToCache = (key: string, quiz: Quiz) => {
  if (typeof window !== "undefined") {
    const cache = getQuizCache()
    cache[key] = quiz
    localStorage.setItem(STORAGE_KEYS.QUIZ_CACHE, JSON.stringify(cache))
  }
}

export const getQuizFromCache = (key: string): Quiz | null => {
  if (typeof window !== "undefined") {
    const cache = getQuizCache()
    return cache[key] || null
  }
  return null
}

export const getQuizCache = (): Record<string, Quiz> => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(STORAGE_KEYS.QUIZ_CACHE)
    return data ? JSON.parse(data) : {}
  }
  return {}
}

// Generate unique ID
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
