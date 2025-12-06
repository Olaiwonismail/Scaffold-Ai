"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Home, CheckCircle, Circle, BookOpen, GraduationCap, Menu, X } from "lucide-react"
import {
  getCourse,
  saveCourse,
  getUser,
  getSlidesFromCache,
  saveSlidesToCache,
  type Course,
  type LessonPhase,
} from "@/lib/storage"
import { getTutorContent } from "@/lib/api"
import { LoadingScreen } from "@/components/loading-screen"
import { ChatPanel } from "@/components/chat-panel"
import { LatexRenderer } from "@/components/latex-renderer"

export default function LearnPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [currentSubModuleIndex, setCurrentSubModuleIndex] = useState(0)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [slides, setSlides] = useState<LessonPhase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const loadSlides = useCallback(async (moduleIndex: number, subModuleIndex: number) => {
    const existingCourse = getCourse()
    if (!existingCourse) return

    const module = existingCourse.modules[moduleIndex]
    if (!module) return

    const subModule = module.subModules[subModuleIndex]
    if (!subModule) return

    const cacheKey = `${module.title}:${subModule.title}`

    // Check cache first
    const cachedSlides = getSlidesFromCache(cacheKey)
    if (cachedSlides) {
      setSlides(cachedSlides)
      setIsLoading(false)
      return
    }

    // Fetch from API
    setIsLoading(true)
    try {
      const user = getUser()
      const response = await getTutorContent(
        module.title,
        subModule.title,
        user?.adaptLevel || 5,
        user?.analogy || "general learning",
      )

      setSlides(response.lesson_phases)
      saveSlidesToCache(cacheKey, response.lesson_phases)
    } catch (error) {
      console.error("Failed to load slides:", error)
      setSlides([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const existingCourse = getCourse()
    if (!existingCourse || existingCourse.id !== params.id) {
      router.push("/dashboard")
      return
    }
    setCourse(existingCourse)

    const moduleParam = searchParams.get("module")
    const subModuleParam = searchParams.get("submodule")

    const moduleIdx = moduleParam ? Number.parseInt(moduleParam) : 0
    const subModuleIdx = subModuleParam ? Number.parseInt(subModuleParam) : 0

    setCurrentModuleIndex(moduleIdx)
    setCurrentSubModuleIndex(subModuleIdx)
    setCurrentSlideIndex(0)
    loadSlides(moduleIdx, subModuleIdx)
  }, [params.id, searchParams, router, loadSlides])

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    } else {
      // Mark submodule as complete and go to quiz
      markSubModuleComplete()
      router.push(`/course/${params.id}/quiz?module=${currentModuleIndex}&submodule=${currentSubModuleIndex}`)
    }
  }

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  const markSubModuleComplete = () => {
    if (!course) return

    const updatedCourse = { ...course }
    updatedCourse.modules[currentModuleIndex].subModules[currentSubModuleIndex].completed = true

    // Check if all submodules in module are complete
    const allSubModulesComplete = updatedCourse.modules[currentModuleIndex].subModules.every((s) => s.completed)
    if (allSubModulesComplete) {
      updatedCourse.modules[currentModuleIndex].completed = true
    }

    saveCourse(updatedCourse)
    setCourse(updatedCourse)
  }

  const handleSelectSubModule = (moduleIdx: number, subModuleIdx: number) => {
    setCurrentModuleIndex(moduleIdx)
    setCurrentSubModuleIndex(subModuleIdx)
    setCurrentSlideIndex(0)
    loadSlides(moduleIdx, subModuleIdx)
    router.replace(`/course/${params.id}/learn?module=${moduleIdx}&submodule=${subModuleIdx}`)
  }

  if (!course) return null

  const currentModule = course.modules[currentModuleIndex]
  const currentSubModule = currentModule?.subModules[currentSubModuleIndex]
  const currentSlide = slides[currentSlideIndex]
  const isLastSlide = currentSlideIndex === slides.length - 1

  return (
    <>
      {isLoading && <LoadingScreen message="Generating your personalized lesson" />}

      <div className="h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm flex-shrink-0 z-40">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/course/${params.id}`)}>
                <Home className="w-5 h-5" />
              </Button>
              <div className="hidden md:block">
                <h1 className="font-bold text-foreground text-sm">{currentModule?.title}</h1>
                <p className="text-xs text-muted-foreground">{currentSubModule?.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Slide {currentSlideIndex + 1} of {slides.length}
              </span>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content - 3 Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Outline */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="w-64 border-r border-border/50 bg-card/30 flex-shrink-0 absolute md:relative z-30 h-full md:h-auto"
              >
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      Course Outline
                    </h2>
                    <div className="space-y-4">
                      {course.modules.map((module, moduleIdx) => {
                        const allComplete = module.subModules.every((s) => s.completed)
                        return (
                          <div key={module.title}>
                            <div
                              className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                                allComplete ? "text-success" : "text-foreground"
                              }`}
                            >
                              {allComplete ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                              <span className="truncate">{module.title}</span>
                            </div>
                            <div className="ml-6 space-y-1">
                              {module.subModules.map((subModule, subIdx) => (
                                <button
                                  key={subModule.title}
                                  onClick={() => handleSelectSubModule(moduleIdx, subIdx)}
                                  className={`w-full text-left text-xs p-2 rounded-md transition-colors flex items-center gap-2 ${
                                    moduleIdx === currentModuleIndex && subIdx === currentSubModuleIndex
                                      ? "bg-primary/10 text-primary"
                                      : subModule.completed
                                        ? "text-success hover:bg-success/10"
                                        : "text-muted-foreground hover:bg-secondary/50"
                                  }`}
                                >
                                  {subModule.completed ? (
                                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-3 h-3 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{subModule.title}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </ScrollArea>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Center - Canvas/Slides */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-6">
              <AnimatePresence mode="wait">
                {currentSlide && (
                  <motion.div
                    key={currentSlideIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="max-w-3xl mx-auto"
                  >
                    {/* Phase Badge */}
                    <div className="mb-6">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        <GraduationCap className="w-4 h-4" />
                        {currentSlide.phase_name}
                      </span>
                    </div>

                    {/* Content */}
                    {currentSlide.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="space-y-6">
                        {/* Narration */}
                        <div className="bg-card/50 rounded-xl p-6 border border-border/50">
                          <p className="text-foreground leading-relaxed">
                            <LatexRenderer content={step.narration} />
                          </p>
                        </div>

                        {/* Board */}
                        <div className="bg-secondary/30 rounded-xl p-6 border border-border/50">
                          <h4 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Key Points
                          </h4>
                          <div className="text-foreground font-mono text-sm">
                            <LatexRenderer content={step.board} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>

            {/* Navigation */}
            <div className="border-t border-border/50 p-4 flex items-center justify-between bg-card/30">
              <Button variant="outline" onClick={handlePrevSlide} disabled={currentSlideIndex === 0}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-1">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentSlideIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <Button onClick={handleNextSlide}>
                {isLastSlide ? (
                  <>
                    Take Quiz
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </main>

          {/* Right Sidebar - Chat */}
          <aside className="w-80 border-l border-border/50 hidden lg:block">
            <ChatPanel />
          </aside>
        </div>
      </div>
    </>
  )
}
