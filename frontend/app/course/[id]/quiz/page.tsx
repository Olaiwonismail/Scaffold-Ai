"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Home, CheckCircle, XCircle, RotateCcw, BookOpen, Trophy, ArrowRight } from "lucide-react"
import { getCourseById, saveCourse, getUser } from "@/lib/storage"
import type { Course, Quiz } from "@/lib/types"
import { getQuiz } from "@/lib/api"
import { LoadingScreen } from "@/components/loading-screen"
import { LatexRenderer } from "@/components/latex-renderer"
import { auth } from "@/lib/firebase"

export default function QuizPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [moduleIndex, setModuleIndex] = useState(0)
  const [subModuleIndex, setSubModuleIndex] = useState(0)

  const loadQuiz = useCallback(async (moduleIdx: number, subModuleIdx: number) => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    const existingCourse = await getCourseById(currentUser.uid, params.id as string)
    if (!existingCourse) return

    const module = existingCourse.modules[moduleIdx]
    if (!module) return

    const subModule = module.subModules[subModuleIdx]
    if (!subModule) return

    // Check if quiz already exists in course
    if (subModule.quiz) {
       setQuiz(subModule.quiz)
       setIsLoading(false)
       setCourse(existingCourse)
       return
    }

    setIsLoading(true)
    try {
      const response = await getQuiz(module.title, subModule.title, currentUser.uid)
      setQuiz(response)

      // Save quiz to DB
      const updatedCourse = { ...existingCourse }
      updatedCourse.modules[moduleIdx].subModules[subModuleIdx].quiz = response
      await saveCourse(currentUser.uid, updatedCourse)
      setCourse(updatedCourse)

    } catch (error) {
      console.error("Failed to load quiz:", error)
      setQuiz(null)
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    const hydrateCourse = async () => {
      const currentUser = auth.currentUser
      if (!currentUser) {
          // Wait for auth or redirect
          return
      }

      const existingCourse = await getCourseById(currentUser.uid, params.id as string)

      if (!existingCourse) {
        router.push("/dashboard")
        return
      }

      setCourse(existingCourse)

      const moduleParam = searchParams.get("module")
      const subModuleParam = searchParams.get("submodule")

      const moduleIdx = moduleParam ? Number.parseInt(moduleParam) : 0
      const subModuleIdx = subModuleParam ? Number.parseInt(subModuleParam) : 0

      setModuleIndex(moduleIdx)
      setSubModuleIndex(subModuleIdx)
      loadQuiz(moduleIdx, subModuleIdx)
    }

    // Auth listener wrapper
     const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
             const existingCourse = await getCourseById(user.uid, params.id as string)
             if (!existingCourse) {
                 router.push("/dashboard")
                 return
             }
             setCourse(existingCourse)

             const moduleParam = searchParams.get("module")
             const subModuleParam = searchParams.get("submodule")
             const moduleIdx = moduleParam ? Number.parseInt(moduleParam) : 0
             const subModuleIdx = subModuleParam ? Number.parseInt(subModuleParam) : 0

             setModuleIndex(moduleIdx)
             setSubModuleIndex(subModuleIdx)
             loadQuiz(moduleIdx, subModuleIdx)

        } else {
             router.push("/login")
        }
    })

    return () => unsubscribe()
  }, [params.id, searchParams, router, loadQuiz])

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer) return // Already answered
    setSelectedAnswer(answer)
    setAnswers({ ...answers, [currentQuestionIndex]: answer })
  }

  const handleNextQuestion = () => {
    if (!quiz) return

    if (currentQuestionIndex < quiz.flashcards.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
    } else {
      // Mark submodule as complete
      markSubModuleComplete()
      setShowResults(true)
    }
  }

  const markSubModuleComplete = async () => {
    if (!course || !auth.currentUser) return

    const updatedCourse = { ...course }
    updatedCourse.modules[moduleIndex].subModules[subModuleIndex].completed = true

    // Check if all submodules in module are complete
    const allSubModulesComplete = updatedCourse.modules[moduleIndex].subModules.every((s) => s.completed)
    if (allSubModulesComplete) {
      updatedCourse.modules[moduleIndex].completed = true
    }

    await saveCourse(auth.currentUser.uid, updatedCourse)
    setCourse(updatedCourse)
  }

  const getAnswerLetter = (index: number) => {
    return String.fromCharCode(65 + index) // A, B, C, D
  }

  const isCorrect = (questionIdx: number) => {
    if (!quiz) return false
    const question = quiz.flashcards[questionIdx]
    const userAnswer = answers[questionIdx]
    const correctIndex = question.answer.charCodeAt(0) - 65 // Convert A, B, C, D to 0, 1, 2, 3
    return userAnswer === question.options[correctIndex]
  }

  const calculateScore = () => {
    if (!quiz) return 0
    let correct = 0
    quiz.flashcards.forEach((_, idx) => {
      if (isCorrect(idx)) correct++
    })
    return Math.round((correct / quiz.flashcards.length) * 100)
  }

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setAnswers({})
    setShowResults(false)
    loadQuiz(moduleIndex, subModuleIndex)
  }

  const handleBackToSlides = () => {
    router.push(`/course/${params.id}/learn?module=${moduleIndex}&submodule=${subModuleIndex}`)
  }

  const handleContinue = () => {
    if (!course) return

    // Find next incomplete submodule
    for (let m = moduleIndex; m < course.modules.length; m++) {
      const startSubIdx = m === moduleIndex ? subModuleIndex + 1 : 0
      for (let s = startSubIdx; s < course.modules[m].subModules.length; s++) {
        if (!course.modules[m].subModules[s].completed) {
          router.push(`/course/${params.id}/learn?module=${m}&submodule=${s}`)
          return
        }
      }
    }

    // All complete, go to course overview
    router.push(`/course/${params.id}`)
  }

  if (!course) return null

  const currentModule = course.modules[moduleIndex]
  const currentSubModule = currentModule?.subModules[subModuleIndex]
  const currentQuestion = quiz?.flashcards[currentQuestionIndex]

  return (
    <>
      {isLoading && <LoadingScreen message="Generating your quiz" />}

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/course/${params.id}`)}>
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-foreground">Quiz</h1>
                <p className="text-xs text-muted-foreground">
                  {currentModule?.title} - {currentSubModule?.title}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <AnimatePresence mode="wait">
            {showResults ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-border/50 bg-card/50 text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4">
                      {calculateScore() >= 70 ? (
                        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                          <Trophy className="w-10 h-10 text-success" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-primary" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-2xl">
                      {calculateScore() >= 70 ? "Great Job!" : "Keep Learning!"}
                    </CardTitle>
                    <CardDescription>You scored {calculateScore()}% on this quiz</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Your Score</span>
                        <span className="font-medium text-foreground">{calculateScore()}%</span>
                      </div>
                      <Progress value={calculateScore()} className="h-3" />
                    </div>

                    {/* Question Review */}
                    <div className="space-y-3 text-left">
                      {quiz?.flashcards.map((q, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg flex items-start gap-3 ${
                            isCorrect(idx)
                              ? "bg-success/10 border border-success/20"
                              : "bg-destructive/10 border border-destructive/20"
                          }`}
                        >
                          {isCorrect(idx) ? (
                            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          )}
                          <div className="text-sm">
                            <p className="text-foreground">
                              <LatexRenderer content={q.question} />
                            </p>
                            {!isCorrect(idx) && (
                              <p className="text-muted-foreground mt-1">
                                Correct answer: {q.options[q.answer.charCodeAt(0) - 65]}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button variant="outline" onClick={handleBackToSlides} className="flex-1 bg-transparent">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Back to Slides
                      </Button>
                      <Button variant="outline" onClick={handleRetakeQuiz} className="flex-1 bg-transparent">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retake Quiz
                      </Button>
                      <Button onClick={handleContinue} className="flex-1">
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Progress */}
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Question {currentQuestionIndex + 1} of {quiz?.flashcards.length || 0}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(((currentQuestionIndex + 1) / (quiz?.flashcards.length || 1)) * 100)}%
                    </span>
                  </div>
                  <Progress value={((currentQuestionIndex + 1) / (quiz?.flashcards.length || 1)) * 100} />
                </div>

                {/* Question Card */}
                <Card className="border-border/50 bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-lg leading-relaxed">
                      <LatexRenderer content={currentQuestion?.question || ""} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentQuestion?.options.map((option, idx) => {
                      const letter = getAnswerLetter(idx)
                      const isSelected = selectedAnswer === option
                      const correctIndex = currentQuestion.answer.charCodeAt(0) - 65
                      const isCorrectOption = idx === correctIndex
                      const showFeedback = selectedAnswer !== null

                      return (
                        <motion.button
                          key={idx}
                          whileHover={!selectedAnswer ? { scale: 1.01 } : {}}
                          whileTap={!selectedAnswer ? { scale: 0.99 } : {}}
                          onClick={() => handleSelectAnswer(option)}
                          disabled={selectedAnswer !== null}
                          className={`w-full p-4 rounded-lg text-left flex items-start gap-3 transition-colors ${
                            showFeedback
                              ? isCorrectOption
                                ? "bg-success/10 border-2 border-success"
                                : isSelected
                                  ? "bg-destructive/10 border-2 border-destructive"
                                  : "bg-secondary/30 border-2 border-transparent"
                              : isSelected
                                ? "bg-primary/10 border-2 border-primary"
                                : "bg-secondary/50 border-2 border-transparent hover:bg-secondary"
                          }`}
                        >
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-medium ${
                              showFeedback
                                ? isCorrectOption
                                  ? "bg-success text-success-foreground"
                                  : isSelected
                                    ? "bg-destructive text-destructive-foreground"
                                    : "bg-muted text-muted-foreground"
                                : isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="text-foreground pt-1">
                            <LatexRenderer content={option} />
                          </span>
                          {showFeedback && isCorrectOption && (
                            <CheckCircle className="w-5 h-5 text-success ml-auto flex-shrink-0 mt-1" />
                          )}
                          {showFeedback && isSelected && !isCorrectOption && (
                            <XCircle className="w-5 h-5 text-destructive ml-auto flex-shrink-0 mt-1" />
                          )}
                        </motion.button>
                      )
                    })}

                    {selectedAnswer && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
                        <Button onClick={handleNextQuestion} className="w-full">
                          {currentQuestionIndex < (quiz?.flashcards.length || 0) - 1 ? (
                            <>
                              Next Question
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          ) : (
                            <>
                              See Results
                              <Trophy className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  )
}
