export interface TopicResponse {
  topics: {
    title: string
    summary: string
    subtopics: string[]
  }[]
}

export interface TutorResponse {
  topic_title: string
  lesson_phases: {
    phase_name: string
    steps: {
      narration: string
      board: string
    }[]
    source: string
  }[]
}

export interface QuizResponse {
  topic_title: string
  flashcards: {
    question: string
    options: string[]
    answer: string
  }[]
}

// Retry wrapper for API calls
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn()
      if (result === null || result === undefined) {
        throw new Error("Null response")
      }
      return result
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error("Max retries exceeded")
}

// Upload PDFs - using local API route
export async function uploadPDFs(files: File[]): Promise<TopicResponse> {
  return withRetry(async () => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append("files", file)
    })

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  })
}

// Get tutor content for a submodule - using local API route
export async function getTutorContent(
  moduleTitle: string,
  submoduleTitle: string,
  adaptLevel: number,
  analogy: string,
): Promise<TutorResponse> {
  return withRetry(async () => {
    const response = await fetch("/api/tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `${moduleTitle}:${submoduleTitle}`,
        adapt: adaptLevel.toString(),
        analogy: analogy,
      }),
    })

    if (!response.ok) {
      throw new Error(`Tutor request failed: ${response.statusText}`)
    }

    return response.json()
  })
}

// Get quiz for a submodule - using local API route
export async function getQuiz(moduleTitle: string, submoduleTitle: string): Promise<QuizResponse> {
  return withRetry(async () => {
    const response = await fetch("/api/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `${moduleTitle}:${submoduleTitle}`,
      }),
    })

    if (!response.ok) {
      throw new Error(`Quiz request failed: ${response.statusText}`)
    }

    return response.json()
  })
}

// Chat with AI - using local API route
export async function sendChatMessage(message: string): Promise<string> {
  return withRetry(async () => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message,
      }),
    })

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.message
  })
}
