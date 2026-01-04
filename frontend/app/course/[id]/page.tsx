"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BookOpen, Upload, FileText, ChevronRight, Home, Trash2,
  Play, List, File, Menu, X, CheckCircle2, Circle
} from "lucide-react"
import { getCourseById, saveCourse } from "@/lib/storage"
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
  const [activeTab, setActiveTab] = useState("outline")

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
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
          ...course!,
          files: [...(course?.files || []), ...newFiles],
          modules: [...(course?.modules || []), ...newModules],
        }

        await saveCourse(currentUser.uid, updatedCourse)
        setCourse(updatedCourse)
        setUrls("")
        setActiveTab("outline")
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

      <div className="min-h-screen bg-background relative">
         {/* Decorative Background */}
        <div className="fixed top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="fixed bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <header className="border-b border-white/20 bg-white/60 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                className="h-10 w-10 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex flex-col">
                <h1 className="text-lg font-bold text-foreground truncate leading-tight">{course.title}</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  {course.modules.length} modules
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
               <div className="hidden sm:flex bg-secondary/20 rounded-lg p-1">
                  <Button
                    variant={activeTab === "outline" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("outline")}
                    className={`text-xs ${activeTab === "outline" ? "shadow-sm bg-white text-primary" : "text-muted-foreground"}`}
                  >
                    Outline
                  </Button>
                  <Button
                    variant={activeTab === "files" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("files")}
                    className={`text-xs ${activeTab === "files" ? "shadow-sm bg-white text-primary" : "text-muted-foreground"}`}
                  >
                    Files
                  </Button>
               </div>

               <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden h-10 w-10"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="container mx-auto px-4 py-8 flex items-start gap-8">

          {/* Sidebar (Desktop) / Mobile Drawer */}
          <AnimatePresence>
            {(sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
               <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className={`
                  fixed inset-y-0 left-0 z-30 w-72 bg-white/80 backdrop-blur-xl border-r border-white/20 p-6 shadow-2xl lg:shadow-none lg:static lg:bg-transparent lg:border-none lg:w-80 lg:block
                  ${sidebarOpen ? 'block' : 'hidden lg:block'}
                `}
               >
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Stats</h3>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/50 p-4 rounded-2xl border border-white/40">
                             <div className="text-2xl font-bold text-primary">{course.modules.length}</div>
                             <div className="text-xs text-muted-foreground">Modules</div>
                          </div>
                          <div className="bg-white/50 p-4 rounded-2xl border border-white/40">
                             <div className="text-2xl font-bold text-accent">{course.files.length}</div>
                             <div className="text-xs text-muted-foreground">Files</div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Navigation</h3>
                        <nav className="space-y-2">
                           <Button
                              variant={activeTab === "outline" ? "secondary" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => { setActiveTab("outline"); setSidebarOpen(false); }}
                           >
                              <List className="w-4 h-4 mr-3" />
                              Course Outline
                           </Button>
                           <Button
                              variant={activeTab === "files" ? "secondary" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => { setActiveTab("files"); setSidebarOpen(false); }}
                           >
                              <File className="w-4 h-4 mr-3" />
                              Files & Resources
                           </Button>
                        </nav>
                    </div>
                 </div>
               </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <main className="flex-1 w-full min-w-0">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="outline" className="mt-0 space-y-8">
                   {course.modules.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-12 text-center shadow-sm"
                      >
                         <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Upload className="w-10 h-10 text-primary" />
                         </div>
                         <h2 className="text-2xl font-bold text-foreground mb-3">Let's build your course</h2>
                         <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Upload your study materials (PDFs) and we'll generate a structured learning path for you.
                         </p>
                         <Button onClick={() => setActiveTab("files")} size="lg" className="shadow-lg shadow-primary/20">
                            Go to Uploads
                         </Button>
                      </motion.div>
                   ) : (
                      <div className="relative">
                         {/* Timeline Line */}
                         <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/30 to-transparent hidden md:block" />

                         <div className="space-y-8">
                            {course.modules.map((module, moduleIndex) => {
                               const allCompleted = module.subModules.every((s) => s.completed)
                               return (
                                  <motion.div
                                    key={module.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: moduleIndex * 0.1 }}
                                    className="relative pl-0 md:pl-20"
                                  >
                                     {/* Timeline Node */}
                                     <div className={`absolute left-5 top-6 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 hidden md:block transition-colors duration-500 ${
                                        allCompleted ? "bg-green-500" : "bg-primary"
                                     }`} />

                                     <Card className={`overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 ${
                                        allCompleted ? "bg-gradient-to-br from-green-50/50 to-white" : "bg-white/60 backdrop-blur-md"
                                     }`}>
                                        <CardHeader className="border-b border-black/5 pb-4 bg-white/40">
                                           <div className="flex items-start justify-between gap-4">
                                              <div>
                                                 <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Module {moduleIndex + 1}</div>
                                                 <CardTitle className="text-lg md:text-xl text-foreground">{module.title}</CardTitle>
                                              </div>
                                              {allCompleted && (
                                                <div className="bg-green-100 text-green-700 p-1.5 rounded-full">
                                                   <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                              )}
                                           </div>
                                           <CardDescription>{module.summary}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                           <div className="space-y-2">
                                              {module.subModules.map((subModule, subIndex) => (
                                                 <motion.div
                                                   key={subModule.title}
                                                   whileHover={{ x: 4 }}
                                                   className="group"
                                                 >
                                                    <button
                                                      onClick={() => handleStartLearning(moduleIndex, subIndex)}
                                                      className={`w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all ${
                                                         subModule.completed
                                                            ? "bg-green-50/50 hover:bg-green-50 text-green-800"
                                                            : "bg-white/50 hover:bg-white text-foreground hover:shadow-sm"
                                                      }`}
                                                    >
                                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                                          subModule.completed
                                                             ? "bg-green-200 text-green-700"
                                                             : "bg-secondary/30 text-secondary-foreground group-hover:bg-primary group-hover:text-white"
                                                       }`}>
                                                          {subModule.completed ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                                                       </div>
                                                       <span className="flex-1 text-sm font-medium">{subModule.title}</span>
                                                       <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                 </motion.div>
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

                <TabsContent value="files" className="mt-0">
                   <div className="grid gap-8">
                      <Card className="border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                         <CardContent className="flex flex-col items-center justify-center py-12">
                            <div
                              onDragEnter={handleDrag}
                              onDragLeave={handleDrag}
                              onDragOver={handleDrag}
                              onDrop={handleDrop}
                              className={`w-full text-center space-y-4 ${dragActive ? "opacity-50" : ""}`}
                            >
                               <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto">
                                  <Upload className="w-8 h-8 text-primary" />
                               </div>
                               <div>
                                  <h3 className="text-lg font-semibold text-foreground">Upload Documents</h3>
                                  <p className="text-sm text-muted-foreground mt-1">Drag & drop PDFs here or click to browse</p>
                               </div>

                               <label className="block">
                                  <input
                                    type="file"
                                    multiple
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                                    disabled={isUploading}
                                  />
                                  <Button variant="secondary" disabled={isUploading} className="pointer-events-none">
                                     {isUploading ? "Uploading..." : "Select Files"}
                                  </Button>
                               </label>
                            </div>
                         </CardContent>
                      </Card>

                      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 p-6 shadow-sm">
                         <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-accent rounded-full"/>
                            Or Import from URL
                         </h3>
                         <div className="flex gap-2">
                            <Input
                               placeholder="e.g., YouTube video URL..."
                               value={urls}
                               onChange={(e) => setUrls(e.target.value)}
                               disabled={isUploading}
                               className="bg-white/80"
                            />
                            <Button
                               onClick={() => handleFileUpload([], urls.split(",").map((u) => u.trim()).filter((u) => u))}
                               disabled={isUploading || !urls.trim()}
                            >
                               Import
                            </Button>
                         </div>
                      </div>

                      {uploadError && (
                         <motion.div
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: "auto" }}
                           className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive flex items-center gap-2"
                         >
                            <X className="w-4 h-4" />
                            {uploadError}
                         </motion.div>
                      )}

                      {course.files.length > 0 && (
                         <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-black/5 bg-white/40">
                               <h3 className="font-semibold text-foreground">Uploaded Resources ({course.files.length})</h3>
                            </div>
                            <div className="divide-y divide-black/5">
                               {course.files.map((file) => (
                                  <div key={file.name} className="flex items-center justify-between p-4 hover:bg-white/50 transition-colors">
                                     <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0">
                                           <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                           <p className="font-medium text-sm text-foreground truncate">{file.name}</p>
                                           <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                        </div>
                                     </div>
                                     <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.name)} className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                     </Button>
                                  </div>
                               ))}
                            </div>
                         </div>
                      )}
                   </div>
                </TabsContent>
             </Tabs>
          </main>
        </div>
      </div>
    </>
  )
}
