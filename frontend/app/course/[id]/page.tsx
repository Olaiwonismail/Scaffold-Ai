"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Upload, FileText, ChevronRight, Home, Trash2, Play, List, File } from "lucide-react"
import { getCourse, saveCourse, type Course, type Module, type UploadedFile } from "@/lib/storage"
import { uploadPDFs } from "@/lib/api"
import { LoadingScreen } from "@/components/loading-screen"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    const existingCourse = getCourse()
    if (!existingCourse || existingCourse.id !== params.id) {
      router.push("/dashboard")
      return
    }
    setCourse(existingCourse)
  }, [params.id, router])

  const handleFileUpload = useCallback(
    async (files: FileList | File[]) => {
      setUploadError("")
      const fileArray = Array.from(files)

      // Check file sizes
      const oversizedFiles = fileArray.filter((f) => f.size > MAX_FILE_SIZE)
      if (oversizedFiles.length > 0) {
        setUploadError(`Some files exceed the 5MB limit. Due to beta launch constraints, please upload smaller files.`)
        return
      }

      // Check if all files are PDFs
      const nonPdfFiles = fileArray.filter((f) => f.type !== "application/pdf")
      if (nonPdfFiles.length > 0) {
        setUploadError("Only PDF files are supported.")
        return
      }

      setIsUploading(true)
      setIsProcessing(true)

      try {
        const response = await uploadPDFs(fileArray)

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
          ...course!,
          files: [...(course?.files || []), ...newFiles],
          modules: [...(course?.modules || []), ...newModules],
        }

        saveCourse(updatedCourse)
        setCourse(updatedCourse)
      } catch (error) {
        setUploadError("Failed to process files. Please try again.")
        console.error(error)
      } finally {
        setIsUploading(false)
        setIsProcessing(false)
      }
    },
    [course],
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

  const handleDeleteFile = (fileName: string) => {
    if (!course) return
    const updatedCourse: Course = {
      ...course,
      files: course.files.filter((f) => f.name !== fileName),
    }
    saveCourse(updatedCourse)
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
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-foreground">{course.title}</h1>
                <p className="text-xs text-muted-foreground">
                  {course.modules.length} modules • {course.files.length} files
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="outline" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="outline" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Course Outline
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <File className="w-4 h-4" />
                Uploaded Files
              </TabsTrigger>
            </TabsList>

            {/* Outline Tab */}
            <TabsContent value="outline" className="space-y-6">
              {course.modules.length === 0 ? (
                <Card className="border-border/50 bg-card/30 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Upload your study materials</h3>
                    <p className="text-muted-foreground text-center mb-4 max-w-sm">
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
                      <Button asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload PDFs
                        </span>
                      </Button>
                    </label>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Course Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        This course covers {course.modules.length} main topics, each broken down into submodules for
                        easier learning. Click on any submodule to start learning.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Modules */}
                  <div className="space-y-4">
                    {course.modules.map((module, moduleIndex) => {
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
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    allCompleted ? "bg-success/10" : "bg-primary/10"
                                  }`}
                                >
                                  <span className={`font-bold ${allCompleted ? "text-success" : "text-primary"}`}>
                                    {moduleIndex + 1}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <CardTitle className={`text-lg ${allCompleted ? "text-success" : ""}`}>
                                    {module.title}
                                  </CardTitle>
                                  <CardDescription>{module.summary}</CardDescription>
                                </div>
                                {allCompleted && (
                                  <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                                    Completed
                                  </span>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {module.subModules.map((subModule, subIndex) => (
                                  <motion.button
                                    key={subModule.title}
                                    whileHover={{ x: 4 }}
                                    onClick={() => handleStartLearning(moduleIndex, subIndex)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                                      subModule.completed
                                        ? "bg-success/10 hover:bg-success/20"
                                        : "bg-secondary/50 hover:bg-secondary"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                          subModule.completed
                                            ? "bg-success text-success-foreground"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {subIndex + 1}
                                      </div>
                                      <span
                                        className={subModule.completed ? "text-success font-medium" : "text-foreground"}
                                      >
                                        {subModule.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {subModule.completed ? (
                                        <span className="text-xs text-success">Completed</span>
                                      ) : (
                                        <Play className="w-4 h-4 text-muted-foreground" />
                                      )}
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
            <TabsContent value="files" className="space-y-6">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-foreground font-medium mb-2">Drag and drop PDF files here</p>
                <p className="text-sm text-muted-foreground mb-4">or</p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    disabled={isUploading}
                  />
                  <Button variant="secondary" disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Browse Files"}
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-4">Maximum file size: 5MB per file (Beta limitation)</p>
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

              {course.files.length > 0 && (
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
        </main>
      </div>
    </>
  )
}
