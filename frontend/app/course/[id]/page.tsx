"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BookOpen,
  Upload,
  FileText,
  ChevronRight,
  Home,
  Trash2,
  Play,
  List,
  File,
  Menu,
  X,
  Sparkles,
  GraduationCap,
  Plus,
} from "lucide-react"
import { getCourseById, saveCourse } from "@/lib/storage"
import type { Course, Module, UploadedFile } from "@/lib/types"
import { uploadPDFs } from "@/lib/api"
import { LoadingScreen } from "@/components/loading-screen"
import { UploadDialog } from "@/components/upload-dialog"
import { auth } from "@/lib/firebase"

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNewContentBanner, setShowNewContentBanner] = useState(true)

  useEffect(() => {
    const loadCourse = async () => {
      const currentUser = auth.currentUser
      if (!currentUser) {
        return
      }

      const existingCourse = await getCourseById(currentUser.uid, params.id as string)
      if (existingCourse) {
        setCourse(existingCourse)
      } else {
        router.push("/dashboard")
      }
    }

    // Add listener for auth state to be safe on refresh
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const existingCourse = await getCourseById(user.uid, params.id as string)
        if (existingCourse) {
          // Clear isNew flags on refresh - new content indicators are session-only
          const clearedCourse = {
            ...existingCourse,
            modules: existingCourse.modules.map((m) => ({
              ...m,
              isNew: false,
              subModules: m.subModules.map((sub) => ({ ...sub, isNew: false })),
            })),
          }
          await saveCourse(user.uid, clearedCourse)
          setCourse(clearedCourse)
        } else {
          router.push("/dashboard")
        }
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [params.id, router])

  const handleUploadConfirm = useCallback(
    async (files: File[], urls: string[]) => {
      const currentUser = auth.currentUser
      if (!currentUser || !course) {
        console.error("Attempted upload without logged in user or course context")
        return
      }

      console.log("Starting upload for user:", currentUser.uid)

      setIsUploading(true)
      setIsProcessing(true)
      setUploadDialogOpen(false)

      try {
        const response = await uploadPDFs(files, urls, currentUser.uid)

        // Prevent duplicate file entries by checking if name already exists
        const existingFileNames = new Set(course.files.map((f) => f.name))
        const newFiles: UploadedFile[] = files
          .filter((f) => !existingFileNames.has(f.name))
          .map((f) => ({
            name: f.name,
            size: f.size,
            uploadedAt: new Date().toISOString(),
          }))

        const addedAt = new Date().toISOString()

        // Prevent duplicate modules by checking if title already exists
        const existingModuleTitles = new Set(course.modules.map((m) => m.title))

        const newModules: Module[] = response.topics
          .filter((topic) => !existingModuleTitles.has(topic.title))
          .map((topic) => ({
            title: topic.title,
            summary: topic.summary,
            subtopics: topic.subtopics,
            subModules: topic.subtopics.map((sub) => ({
              title: sub,
              completed: false,
              slides: undefined,
              isNew: true,
              addedAt: addedAt,
            })),
            completed: false,
            isNew: true,
            addedAt: addedAt,
          }))

        if (newModules.length === 0) {
          console.log("No new unique modules found from response")
        }

        const updatedCourse: Course = {
          ...course,
          files: [...(course.files || []), ...newFiles],
          modules: [...(course.modules || []), ...newModules],
        }

        await saveCourse(currentUser.uid, updatedCourse)
        setCourse(updatedCourse)
      } catch (error) {
        console.error("Upload failed:", error)
      } finally {
        setIsUploading(false)
        setIsProcessing(false)
      }
    },
    [course],
  )

  const handleDeleteFile = async (fileName: string) => {
    if (!course || !auth.currentUser) return
    const updatedCourse: Course = {
      ...course,
      files: course.files.filter((f) => f.name !== fileName),
    }
    await saveCourse(auth.currentUser.uid, updatedCourse)
    setCourse(updatedCourse)
  }

  const handleStartLearning = async (moduleIndex: number, subModuleIndex: number) => {
    // Clear the isNew flag when user starts learning
    if (course && auth.currentUser) {
      const module = course.modules[moduleIndex]
      const subModule = module?.subModules[subModuleIndex]

      if (module?.isNew || subModule?.isNew) {
        const updatedCourse = { ...course }
        updatedCourse.modules[moduleIndex].subModules[subModuleIndex].isNew = false

        // If all submodules in this module have been viewed, mark module as not new
        const allSubmodulesViewed = updatedCourse.modules[moduleIndex].subModules.every((sub) => !sub.isNew)
        if (allSubmodulesViewed) {
          updatedCourse.modules[moduleIndex].isNew = false
        }

        await saveCourse(auth.currentUser.uid, updatedCourse)
        setCourse(updatedCourse)
      }
    }

    router.push(`/course/${params.id}/learn?module=${moduleIndex}&submodule=${subModuleIndex}`)
  }

  const handleStartQuiz = (moduleIndex: number, subModuleIndex?: number) => {
    if (subModuleIndex !== undefined) {
      router.push(`/course/${params.id}/quiz?module=${moduleIndex}&submodule=${subModuleIndex}`)
    } else {
      router.push(`/course/${params.id}/quiz?module=${moduleIndex}&submodule=0`)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  if (!course) return null

  return (
    <>
      {isProcessing && <LoadingScreen message="Analyzing your documents" />}

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
              >
                <Home className="w-4 h-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-foreground truncate">{course.title}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {course.modules.length} modules • {course.files.length} files
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </header>

        {/* Main Content with Sidebar */}
        <div className="flex relative min-h-[calc(100vh-4rem)]">
          {/* Sidebar Overlay for Mobile */}
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 sm:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: sidebarOpen ? 0 : "-100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-56 border-r border-border/50 bg-card/50 backdrop-blur-sm absolute sm:static z-40 h-full sm:h-auto sm:translate-x-0"
          >
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                <div>
                  <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Course Info
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {course?.modules.length || 0} modules • {course?.files.length || 0} files
                  </p>
                </div>
              </div>
            </ScrollArea>
          </motion.aside>

          {/* Main Content */}
          <main className="flex-1 w-full">
            <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
              <Tabs defaultValue="outline" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="outline" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <List className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Course </span>Outline
                  </TabsTrigger>
                  <TabsTrigger value="files" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <File className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Uploaded </span>Files
                  </TabsTrigger>
                </TabsList>

                {/* Outline Tab */}
                <TabsContent value="outline" className="space-y-4 sm:space-y-6">
                  {course && course.modules.length === 0 ? (
                    <Card className="border-border/50 bg-card/30 border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-3 sm:mb-4">
                          <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                          Upload your study materials
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground text-center mb-4 max-w-sm">
                          Upload PDF files or add YouTube links to generate your course outline and start learning
                        </p>
                        <Button onClick={() => setUploadDialogOpen(true)} className="text-xs sm:text-sm h-9 sm:h-10">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Add Materials
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {/* New Content Banner */}
                      {showNewContentBanner && course?.modules.some((m) => m.isNew) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-lg border border-blue-500 bg-blue-500 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-sm sm:text-base">New Content Added! 🎉</h3>
                              <p className="text-xs sm:text-sm text-white/90">
                                {course.modules.filter((m) => m.isNew).length} new module
                                {course.modules.filter((m) => m.isNew).length > 1 ? "s" : ""} available. Look for the{" "}
                                <span className="inline-flex items-center gap-1 mx-1">
                                  <span className="w-2 h-2 rounded-full bg-white"></span> blue dot
                                </span>{" "}
                                indicator.
                              </p>
                            </div>
                            <button
                              onClick={() => setShowNewContentBanner(false)}
                              className="p-1.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                              aria-label="Dismiss"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Summary */}
                      <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            Course Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            This course covers {course?.modules.length || 0} main topics, each broken down into
                            submodules for easier learning. Click on any submodule to start learning.
                          </p>
                        </CardContent>
                      </Card>

                      {/* Modules */}
                      <div className="space-y-3 sm:space-y-4">
                        {course?.modules.map((module, moduleIndex) => {
                          const allCompleted = module.subModules.every((s) => s.completed)
                          return (
                            <motion.div
                              key={module.title}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: moduleIndex * 0.1 }}
                            >
                              <Card
                                className={`border-border/50 bg-card/50 ${allCompleted ? "border-success/50" : ""}`}
                              >
                                <CardHeader>
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div
                                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        allCompleted ? "bg-success/10" : "bg-primary/10"
                                      }`}
                                    >
                                      <span
                                        className={`font-bold text-xs sm:text-sm ${allCompleted ? "text-success" : "text-primary"}`}
                                      >
                                        {moduleIndex + 1}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <CardTitle
                                          className={`text-sm sm:text-lg ${allCompleted ? "text-success" : ""}`}
                                        >
                                          {module.title}
                                        </CardTitle>
                                        {module.isNew && (
                                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                                        )}
                                      </div>
                                      <CardDescription className="text-xs sm:text-sm">{module.summary}</CardDescription>
                                    </div>
                                    {allCompleted && (
                                      <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full flex-shrink-0">
                                        Done
                                      </span>
                                    )}
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-1 sm:space-y-2">
                                    {module.subModules.map((subModule, subIndex) => (
                                      <motion.div
                                        key={subModule.title}
                                        whileHover={{ x: 4 }}
                                        onClick={() => handleStartLearning(moduleIndex, subIndex)}
                                        className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors cursor-pointer group ${
                                          subModule.completed
                                            ? "bg-success/10 hover:bg-success/20"
                                            : "bg-secondary/50 hover:bg-secondary"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                          <div
                                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-medium ${
                                              subModule.completed
                                                ? "bg-success text-success-foreground"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                          >
                                            {subIndex + 1}
                                          </div>
                                          <span
                                            className={`text-xs sm:text-sm truncate ${
                                              subModule.completed ? "text-success font-medium" : "text-foreground"
                                            }`}
                                          >
                                            {subModule.title}
                                          </span>
                                          {subModule.isNew && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 sm:h-7 sm:w-7"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleStartQuiz(moduleIndex, subIndex)
                                            }}
                                            title="Take Quiz"
                                          >
                                            <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                          </Button>

                                          {subModule.completed ? (
                                            <span className="text-xs text-success">Done</span>
                                          ) : (
                                            <Play className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                          )}
                                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>

                                  {/* Module-level Quiz Button */}
                                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full bg-transparent"
                                      onClick={() => handleStartQuiz(moduleIndex)}
                                    >
                                      <GraduationCap className="w-4 h-4 mr-2" />
                                      Take Module Quiz
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Files Tab */}
                <TabsContent value="files" className="space-y-4 sm:space-y-6">
                  {/* Upload Button Card */}
                  <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5 border-dashed">
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Add Learning Materials</h3>
                          <p className="text-sm text-muted-foreground">Upload PDFs or add YouTube/web links</p>
                        </div>
                      </div>
                      <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Materials
                      </Button>
                    </CardContent>
                  </Card>

                  {course && course.files.length > 0 && (
                    <Card className="border-border/50 bg-card/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Uploaded Files</CardTitle>
                        <CardDescription>
                          {course.files.length} file{course.files.length !== 1 ? "s" : ""} uploaded
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {course.files.map((file) => (
                              <div
                                key={file.name}
                                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-primary" />
                                  <div>
                                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.name)}>
                                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {course && course.files.length === 0 && (
                    <Card className="border-border/30 bg-card/30">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                          <File className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No files uploaded yet</h3>
                        <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                          Add your study materials to generate course content
                        </p>
                        <Button onClick={() => setUploadDialogOpen(true)} variant="secondary">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Materials
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onConfirm={handleUploadConfirm}
        isUploading={isUploading}
      />
    </>
  )
}