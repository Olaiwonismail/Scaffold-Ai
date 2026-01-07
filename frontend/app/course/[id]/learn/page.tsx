"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Home, CheckCircle, Circle, BookOpen, GraduationCap, Menu, X, MessageSquare, Sparkles } from "lucide-react"
import {
  getCourseById,
  saveCourse,
  getUser,
} from "@/lib/storage"
import type { Course, LessonPhase, Message } from "@/lib/types"
import { getTutorContent } from "@/lib/api"
import { LoadingScreen } from "@/components/loading-screen"
import { ChatPanel } from "@/components/chat-panel"
import { LatexRenderer } from "@/components/latex-renderer"
import { auth } from "@/lib/firebase"

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
  const [activePanel, setActivePanel] = useState<"notes" | "chat" | null>(null)
  const [noteContent, setNoteContent] = useState("")
  const [isNoteLoading, setIsNoteLoading] = useState(false)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [noteStatus, setNoteStatus] = useState<string | null>(null)

  const loadSlides = useCallback(async (moduleIndex: number, subModuleIndex: number) => {
    // Need fresh course data because previous updates might have saved slides to it
    const currentUser = auth.currentUser
    if (!currentUser) return

    // We fetch the course from DB to check if slides exist
    const existingCourse = await getCourseById(currentUser.uid, params.id as string)
    if (!existingCourse) return

    const module = existingCourse.modules[moduleIndex]
    if (!module) return

    const subModule = module.subModules[subModuleIndex]
    if (!subModule) return

    // Check if slides are already saved in the course object
    if (subModule.slides && subModule.slides.length > 0) {
      setSlides(subModule.slides)
      setIsLoading(false)
      // Update local state course just in case
      setCourse(existingCourse)
      return
    }

    // Fetch from API
    setIsLoading(true)
    try {
      const userProfile = await getUser(currentUser.uid)
      const response = await getTutorContent(
        module.title,
        subModule.title,
        userProfile?.adaptLevel || 5,
        userProfile?.analogy || "general learning",
        currentUser.uid,
      )

      setSlides(response.lesson_phases)

      // Save the generated slides to the course object in MongoDB
      const updatedCourse = { ...existingCourse }
      updatedCourse.modules[moduleIndex].subModules[subModuleIndex].slides = response.lesson_phases

      await saveCourse(currentUser.uid, updatedCourse)
      setCourse(updatedCourse) // Update local state

    } catch (error) {
      console.error("Failed to load slides:", error)
      setSlides([])
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  const loadNote = useCallback(async () => {
    const user = auth.currentUser
    if (!user || !course?.id) return

    setIsNoteLoading(true)
    setNoteStatus(null)
    setNoteContent("")

    try {
      const params = new URLSearchParams({
        uid: user.uid,
        courseId: course.id,
        moduleIndex: currentModuleIndex.toString(),
        subModuleIndex: currentSubModuleIndex.toString(),
      })

      const response = await fetch(`/api/notes?${params.toString()}`)
      if (response.ok) {
        const payload = await response.json()
        setNoteContent(payload.content ?? "")
      } else {
        console.error("Failed to fetch notes:", response.status)
        setNoteStatus("Failed to load")
      }
    } catch (error) {
      console.error("Failed to load notes", error)
      setNoteStatus("Unable to load notes")
    } finally {
      setIsNoteLoading(false)
    }
  }, [course?.id, currentModuleIndex, currentSubModuleIndex])

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

      setCurrentModuleIndex(moduleIdx)
      setCurrentSubModuleIndex(subModuleIdx)
      setCurrentSlideIndex(0)

      // We need to call loadSlides, but loadSlides depends on auth.currentUser which is available here
      // However, loadSlides is a useCallback that we will invoke.
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

             setCurrentModuleIndex(moduleIdx)
             setCurrentSubModuleIndex(subModuleIdx)
             setCurrentSlideIndex(0)

             // Now trigger slide loading and note loading
             loadSlides(moduleIdx, subModuleIdx)
             loadNote()

        } else {
             router.push("/login")
        }
    })

    return () => unsubscribe()
  }, [params.id, searchParams, router, loadSlides, loadNote])

  // Also reload notes when module/submodule changes after initial load
  useEffect(() => {
    if (!course || !auth.currentUser) return
    void loadNote()
  }, [currentModuleIndex, currentSubModuleIndex])

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

  const markSubModuleComplete = async () => {
    if (!course || !auth.currentUser) return

    const updatedCourse = { ...course }
    updatedCourse.modules[currentModuleIndex].subModules[currentSubModuleIndex].completed = true

    // Check if all submodules in module are complete
    const allSubModulesComplete = updatedCourse.modules[currentModuleIndex].subModules.every((s) => s.completed)
    if (allSubModulesComplete) {
      updatedCourse.modules[currentModuleIndex].completed = true
    }

    await saveCourse(auth.currentUser.uid, updatedCourse)
    setCourse(updatedCourse)
  }

  const handleSelectSubModule = (moduleIdx: number, subModuleIdx: number) => {
    setCurrentModuleIndex(moduleIdx)
    setCurrentSubModuleIndex(subModuleIdx)
    setCurrentSlideIndex(0)
    setNoteContent("")
    loadSlides(moduleIdx, subModuleIdx)
    router.replace(`/course/${params.id}/learn?module=${moduleIdx}&submodule=${subModuleIdx}`)
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleSaveNote = async () => {
    const user = auth.currentUser
    if (!user) {
      router.push("/login")
      return
    }

    if (!course) return

    setIsSavingNote(true)
    setNoteStatus(null)

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          courseId: course.id,
          moduleIndex: currentModuleIndex,
          subModuleIndex: currentSubModuleIndex,
          content: noteContent,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save note: ${response.status}`)
      }

      const saved = await response.json()
      setNoteContent(saved.content ?? noteContent)
      setNoteStatus("Saved")
    } catch (error) {
      console.error("Failed to save notes", error)
      setNoteStatus("Unable to save notes")
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleChatMessagesChange = async (newMessages: Message[]) => {
      if (!course || !auth.currentUser) return

      const updatedCourse = { ...course }
      updatedCourse.modules[currentModuleIndex].subModules[currentSubModuleIndex].chatHistory = newMessages

      // Save efficiently - maybe we should debounce this if it happens a lot?
      // For now, save on every message update (simplest).
      await saveCourse(auth.currentUser.uid, updatedCourse)
      setCourse(updatedCourse)
  }

  if (!course) return null

  const currentModule = course.modules[currentModuleIndex]
  const currentSubModule = currentModule?.subModules[currentSubModuleIndex]
  const currentSlide = slides[currentSlideIndex]
  const isLastSlide = currentSlideIndex === slides.length - 1

  const NotesPanel = () => (
    <div className="h-full flex flex-col gap-2 sm:gap-3 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Notes</p>
          <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2">
            {currentModule?.title} • {currentSubModule?.title}
          </p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {isNoteLoading ? "Loading..." : noteStatus ?? ""}
        </span>
      </div>
      <Textarea
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="Capture your takeaways..."
        disabled={isNoteLoading || isSavingNote}
        className="flex-1 min-h-[80px] sm:min-h-[160px] resize-none"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground line-clamp-1"></p>
        <Button size="sm" onClick={handleSaveNote} disabled={isSavingNote || isNoteLoading}>
          {isSavingNote ? "Saving..." : "Save notes"}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {isLoading && <LoadingScreen message="Generating your personalized lesson" />}

      <div className="h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm flex-shrink-0 z-40">
          <div className="px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 h-8 sm:h-10 px-2 sm:px-3"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="Toggle outline sidebar"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span className="hidden sm:inline text-xs sm:text-sm">Outline</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => router.push(`/course/${params.id}`)} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <Home className="w-4 h-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-foreground text-xs sm:text-sm truncate">{currentModule?.title}</h1>
                <p className="text-xs text-muted-foreground truncate hidden sm:block">{currentSubModule?.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {currentSlideIndex + 1}/{slides.length}
              </span>
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
                              {module.isNew && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full flex-shrink-0 animate-pulse">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  NEW
                                </span>
                              )}
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
                                  {subModule.isNew && (
                                    <span className="inline-flex items-center text-[8px] font-semibold text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 px-1 py-0.5 rounded-full flex-shrink-0">
                                      NEW
                                    </span>
                                  )}
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
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Slide Content - visible on desktop always, on mobile only when not in chat mode */}
            {/* On mobile with notes active, limit height to allow notes panel to show */}
            <div className={`overflow-y-auto p-3 sm:p-6 ${activePanel === "chat" ? "hidden lg:block lg:flex-1" : activePanel === "notes" ? "flex-1 lg:flex-1 min-h-[40vh]" : "flex-1"}`}>
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

              {!isLoading && !currentSlide && (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
                  <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg font-semibold mb-2">No content available</p>
                  <p className="text-sm mb-4">Could not load the lesson content. Please check if the backend is running.</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Retry
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Notes view - shown when notes panel is active, limited height so it doesn't block content */}
            <div className={`lg:hidden overflow-y-auto max-h-[40vh] ${activePanel === "notes" ? "block" : "hidden"} border-t border-border/50 bg-card/40`}>
              <NotesPanel />
            </div>

            {/* Mobile Chat view - takes remaining height when active */}
            <div className={`flex-1 overflow-hidden lg:hidden ${activePanel === "chat" ? "flex flex-col" : "hidden"}`}>
              <ChatPanel
                  initialMessages={currentSubModule?.chatHistory || []}
                  onMessagesChange={handleChatMessagesChange}
                  userId={auth.currentUser?.uid || ""}
              />
            </div>

            {/* Navigation - always visible */}
            <div className="border-t border-border/50 p-2 sm:p-4 flex items-center justify-between bg-card/30 flex-shrink-0 gap-2">
              <Button variant="outline" onClick={handlePrevSlide} disabled={currentSlideIndex === 0} size="sm" className="h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-3">
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>

              <div className="flex gap-1 flex-wrap justify-center max-w-[120px] sm:max-w-none">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors flex-shrink-0 ${
                      idx === currentSlideIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <Button onClick={handleNextSlide} size="sm" className="h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-3">
                {isLastSlide ? (
                  <>
                    <span className="hidden sm:inline">Quiz</span>
                    <span className="sm:hidden">Quiz</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-1" />
                  </>
                )}
              </Button>
            </div>
          </main>

          {/* Right Sidebar - Notes / Chat */}
          <aside className="w-80 border-l border-border/50 hidden lg:block">
            <div className="h-full flex flex-col">
              <div className="p-3 border-b border-border/50 flex gap-2">
                <Button
                  variant={activePanel === "notes" || activePanel === null ? "default" : "outline"}
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
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                {activePanel === "chat" ? <ChatPanel
                  initialMessages={currentSubModule?.chatHistory || []}
                  onMessagesChange={handleChatMessagesChange}
                  userId={auth.currentUser?.uid || ""}
                /> : <NotesPanel />}
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile bottom toggle for Notes/Chat */}
        <div className="lg:hidden border-t border-border/50 bg-card/60 backdrop-blur-sm p-2 flex gap-2 flex-shrink-0">
          <Button
            variant={activePanel === "notes" ? "default" : "outline"}
            size="sm"
            className="flex-1 h-9"
            onClick={() => setActivePanel(activePanel === "notes" ? null : "notes")}
          >
            Notes
          </Button>
          <Button
            variant={activePanel === "chat" ? "default" : "outline"}
            size="sm"
            className="flex-1 h-9"
            onClick={() => setActivePanel(activePanel === "chat" ? null : "chat")}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Chat
          </Button>
        </div>
      </div>
    </>
  )
}
