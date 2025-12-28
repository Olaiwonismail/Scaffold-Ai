"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Home, CheckCircle, Circle, BookOpen, GraduationCap, Menu, X, MessageSquare } from "lucide-react"
import {
  getCourseById,
  saveCourse,
  getUser,
  getSlidesFromCache,
  saveSlidesToCache,
  getCourse,
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
  const [activePanel, setActivePanel] = useState<"notes" | "chat">("notes")

  const loadSlides = useCallback(async (moduleIndex: number, subModuleIndex: number) => {
    const existingCourse = getCourseById(params.id as string)
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
    const existingCourse = getCourseById(params.id as string)
    if (!existingCourse) {
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
          <div className="px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 h-9 sm:h-10"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="Toggle outline sidebar"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span className="text-xs sm:text-sm">Outline</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => router.push(`/course/${params.id}`)} className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                <Home className="w-4 h-4" />
              </Button>
              <div className="hidden sm:block min-w-0">
                <h1 className="font-bold text-foreground text-xs sm:text-sm truncate">{currentModule?.title}</h1>
                <p className="text-xs text-muted-foreground truncate">{currentSubModule?.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {currentSlideIndex + 1}/{slides.length}
              </span>
            </div>
          </div>
          {/* Mobile top toggle */}
          <div className="px-3 sm:px-4 pb-3 sm:hidden flex items-center gap-2">
            <Button
              variant={activePanel === "notes" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setActivePanel("notes")}
            >
              Notes
            </Button>
            <Button
              variant={activePanel === "chat" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setActivePanel("chat")}
            >
              Chatbot
              <MessageSquare className="w-4 h-4 ml-2" />
            </Button>
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
                className="w-56 sm:w-64 border-r border-border/50 bg-card/30 flex-shrink-0 absolute md:relative z-30 h-full backdrop-blur-sm"
              >
                <ScrollArea className="h-full">
                  <div className="p-3 sm:p-4">
                    <h2 className="font-semibold text-foreground text-sm mb-3 sm:mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="leading-tight break-words line-clamp-2">Course Outline</span>
                    </h2>
                    <div className="space-y-3 sm:space-y-4">
                      {course.modules.map((module, moduleIdx) => {
                        const allComplete = module.subModules.every((s) => s.completed)
                        return (
                          <div key={module.title}>
                            <div
                              className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 flex items-center gap-2 ${
                                allComplete ? "text-success" : "text-foreground"
                              }`}
                            >
                              {allComplete ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> : <Circle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
                              <span className="leading-tight break-words line-clamp-2">{module.title}</span>
                            </div>
                            <div className="ml-4 space-y-0.5 sm:space-y-1">
                              {module.subModules.map((subModule, subIdx) => (
                                <button
                                  key={subModule.title}
                                  onClick={() => handleSelectSubModule(moduleIdx, subIdx)}
                                  className={`w-full text-left text-xs p-1.5 sm:p-2 rounded-md transition-colors flex items-center gap-1.5 sm:gap-2 ${
                                    moduleIdx === currentModuleIndex && subIdx === currentSubModuleIndex
                                      ? "bg-primary/10 text-primary"
                                      : subModule.completed
                                      ? "text-success hover:bg-success/10"
                                      : "text-muted-foreground hover:bg-secondary/50"
                                  }`}
                                >
                                  {subModule.completed ? (
                                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                  )}
                                  <span className="leading-snug break-words line-clamp-2">{subModule.title}</span>
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
            <div className={`flex-1 overflow-y-auto p-3 sm:p-6 ${activePanel === "chat" ? "hidden lg:block" : ""}`}>
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
                    <div className="mb-3 sm:mb-6">
                      <span className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                        <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        {currentSlide.phase_name}
                      </span>
                    </div>

                    {/* Content */}
                    {currentSlide.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="space-y-3 sm:space-y-6">
                        {/* Narration */}
                        <div className="bg-card/50 rounded-xl p-3 sm:p-6 border border-border/50">
                          <p className="text-xs sm:text-base text-foreground leading-relaxed">
                            <LatexRenderer content={step.narration} />
                          </p>
                        </div>

                        {/* Board */}
                        <div className="bg-secondary/30 rounded-xl p-3 sm:p-6 border border-border/50">
                          <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-4 flex items-center gap-2">
                            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            Key Points
                          </h4>
                          <div className="text-xs sm:text-base text-foreground font-mono">
                            <LatexRenderer content={step.board} />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Slide Images */}
                    {currentSlide.images?.length ? (
                      <div className="mt-3 sm:mt-6 grid gap-2 sm:gap-4 sm:grid-cols-2">
                        {currentSlide.images.map((src, idx) => (
                          <div
                            key={idx}
                            className="border border-border/50 rounded-lg overflow-hidden bg-card/40 flex items-center justify-center"
                          >
                            <img
                              src={src}
                              alt={`Slide image ${idx + 1}`}
                              className="w-full h-full object-contain max-h-48 sm:max-h-64"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Chat view */}
            <div className={`flex-1 overflow-hidden ${activePanel === "chat" ? "block" : "hidden"} lg:hidden`}>
              <ChatPanel />
            </div>

            {/* Navigation */}
            <div className="border-t border-border/50 p-2.5 sm:p-4 flex items-center justify-between bg-card/30 flex-shrink-0 gap-2">
              <Button variant="outline" onClick={handlePrevSlide} disabled={currentSlideIndex === 0} size="sm" className="h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-3">
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <div className="flex gap-1">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                      idx === currentSlideIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <Button onClick={handleNextSlide} size="sm" className="h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-3">
                {isLastSlide ? (
                  <>
                    <span className="hidden sm:inline">Quiz</span>
                    <span className="sm:hidden">Q</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-1" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">→</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-1" />
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

        {/* Mobile bottom toggle */}
        <div className="lg:hidden border-t border-border/50 bg-card/60 backdrop-blur-sm p-2 flex gap-2">
          <Button
            variant={activePanel === "notes" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setActivePanel("notes")}
          >
            Notes
          </Button>
          <Button
            variant={activePanel === "chat" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setActivePanel("chat")}
          >
            Chatbot
            <MessageSquare className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </>
  )
}