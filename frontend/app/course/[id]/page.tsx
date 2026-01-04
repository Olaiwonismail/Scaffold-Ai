"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Upload, FileText, ChevronRight, Home, Trash2, Play, List, File, Menu, X } from "lucide-react"
import { getCourseById, saveCourse, getUser } from "@/lib/storage"
import type { Course, Module, UploadedFile } from "@/lib/types"
import { uploadPDFs } from "@/lib/api"
import { LoadingScreen } from "@/components/loading-screen"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth } from "@/lib/firebase"

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [urls, setUrls] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const loadCourse = async () => {
      const currentUser = auth.currentUser
      // We rely on auth state. If not ready, we might want to listen to onAuthStateChanged,
      // but usually the user should be logged in to reach here.
      // However, on refresh, auth.currentUser might be null initially.
      // Let's assume the parent layout or context handles auth check or we check it here properly.

      if (!currentUser) {
         // Optionally wait or redirect.
         // For robustness, let's use a small delay or check storage/auth listener if this was a real production app.
         // Here, assuming dashboard redirects if not logged in.
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
     const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
        if (user) {
             const existingCourse = await getCourseById(user.uid, params.id as string)
             if (existingCourse) {
               setCourse(existingCourse)
             } else {
               router.push("/dashboard")
             }
        } else {
            router.push("/login")
        }
    })

    return () => unsubscribe()
  }, [params.id, router])

  const handleFileUpload = useCallback(
    async (files: FileList | File[], providedUrls?: string[]) => {
      const currentUser = auth.currentUser
      if (!currentUser) return

      setUploadError("")
      const fileArray = Array.from(files)
      const urlArray = providedUrls || (urls ? urls.split(",").map((u) => u.trim()).filter((u) => u) : [])

      if (fileArray.length > 0) {
        const nonPdfFiles = fileArray.filter((f) => f.type !== "application/pdf")
        if (nonPdfFiles.length > 0) {
          setUploadError("Only PDF files are supported.")
          return
        }
      }

      if (fileArray.length === 0 && urlArray.length === 0) {
        setUploadError("Please provide at least one file or URL.")
        return
      }

      setIsUploading(true)
      setIsProcessing(true)

      try {
        const response = await uploadPDFs(fileArray, urlArray)

        const newFiles: UploadedFile[] = fileArray.map((f) => ({
          name: f.name,
          size: f.size,
          uploadedAt: new Date().toISOString(),
        }))

        const newModules: Module[] = response.topics.map((topic) => ({
          title: topic.title,
          summary: topic.summary,
          subtopics: topic.subtopics,
          subModules: topic.subtopics.map((sub) => ({
            title: sub,
            completed: false,
            slides: undefined,
          })),
          completed: false,
        }))

        const updatedCourse: Course = {
          ...course!, // course should be loaded by now
          files: [...(course?.files || []), ...newFiles],
          modules: [...(course?.modules || []), ...newModules],
        }

        await saveCourse(currentUser.uid, updatedCourse)
        setCourse(updatedCourse)
        setUrls("")
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to process files/URLs. Please try again."
        setUploadError(message)
        console.error(error)
      } finally {
        setIsUploading(false)
        setIsProcessing(false)
      }
    },
    [course, urls],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files)
      }
    },
    [handleFileUpload],
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

  const handleStartLearning = (moduleIndex: number, subModuleIndex: number) => {
    router.push(`/course/${params.id}/learn?module=${moduleIndex}&submodule=${subModuleIndex}`)
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
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
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
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">Upload your study materials</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground text-center mb-4 max-w-sm">
                          Upload PDF files to generate your course outline and start learning
                        </p>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            multiple
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                          />
                          <Button asChild className="text-xs sm:text-sm h-9 sm:h-10">
                            <span>
                              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Upload PDFs
                            </span>
                          </Button>
                        </label>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
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
                            This course covers {course?.modules.length || 0} main topics, each broken down into submodules for
                            easier learning. Click on any submodule to start learning.
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
                              <Card className={`border-border/50 bg-card/50 ${allCompleted ? "border-success/50" : ""}`}>
                                <CardHeader>
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div
                                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        allCompleted ? "bg-success/10" : "bg-primary/10"
                                      }`}
                                    >
                                      <span className={`font-bold text-xs sm:text-sm ${allCompleted ? "text-success" : "text-primary"}`}>
                                        {moduleIndex + 1}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className={`text-sm sm:text-lg ${allCompleted ? "text-success" : ""}`}>
                                        {module.title}
                                      </CardTitle>
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
                                      <motion.button
                                        key={subModule.title}
                                        whileHover={{ x: 4 }}
                                        onClick={() => handleStartLearning(moduleIndex, subIndex)}
                                        className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors ${
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
                                            className={`text-xs sm:text-sm truncate ${subModule.completed ? "text-success font-medium" : "text-foreground"}`}
                                          >
                                            {subModule.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                          {subModule.completed ? (
                                            <span className="text-xs text-success">Done</span>
                                          ) : (
                                            <Play className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                          )}
                                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                        </div>
                                      </motion.button>
                                    ))}
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
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-colors ${
                      dragActive ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <Upload className={`w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm sm:text-base text-foreground font-medium mb-1 sm:mb-2">Drag and drop PDF files here</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">or</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        disabled={isUploading}
                      />
                      <Button variant="secondary" disabled={isUploading} className="text-xs sm:text-sm h-9 sm:h-10">
                        {isUploading ? "Uploading..." : "Browse Files"}
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-2 sm:mt-4">PDF files only. No size limits.</p>
                  </div>

                  {/* New URL Input Section */}
                  <div className="space-y-4">
                    <Label htmlFor="urls">Or provide URLs (e.g., YouTube links, comma-separated)</Label>
                    <Input
                      id="urls"
                      type="text"
                      placeholder="https://example.com/video1, https://example.com/video2"
                      value={urls}
                      onChange={(e) => setUrls(e.target.value)}
                      disabled={isUploading}
                    />
                    <Button
                      onClick={() => handleFileUpload([], urls.split(",").map((u) => u.trim()).filter((u) => u))}
                      disabled={isUploading || !urls.trim()}
                      variant="outline"
                    >
                      Process URLs
                    </Button>
                  </div>

                  {uploadError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive"
                    >
                      {uploadError}
                    </motion.div>
                  )}

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
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
