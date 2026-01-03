export interface User {
  uid: string
  id: string
  email: string
  name: string
  analogy: string // User's interests/hobbies for personalized learning
  adaptLevel: number // 1-10 slider value
  createdAt: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
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

export interface SubModule {
  title: string
  completed: boolean
  slides?: LessonPhase[]
  quiz?: Quiz
  chatHistory?: Message[]
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
