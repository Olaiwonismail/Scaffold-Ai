"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Plus, LogOut, GraduationCap } from "lucide-react"
import { getUser, getCourses, saveCourse, clearUser, clearCourse, generateId, type Course } from "@/lib/storage"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [newCourseTitle, setNewCourseTitle] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    setCourses(getCourses())
  }, [router])

  const handleCreateCourse = () => {
    if (!newCourseTitle.trim()) return
    const newCourse: Course = {
      id: generateId(),
      title: newCourseTitle.trim(),
      modules: [],
      files: [],
      createdAt: new Date().toISOString(),
    }
    saveCourse(newCourse)
    setCourses(getCourses())
    setIsDialogOpen(false)
    setNewCourseTitle("")
    router.push(`/course/${newCourse.id}`)
  }

  const handleLogout = () => {
    clearUser()
    clearCourse()
    router.push("/login")
  }

  const handleEnterCourse = (id: string) => {
    router.push(`/course/${id}`)
  }

  const getCompletionPercentage = (course: Course) => {
    if (!course.modules.length) return 0
    const totalSubmodules = course.modules.reduce((acc, m) => acc + m.subModules.length, 0)
    if (!totalSubmodules) return 0
    const completedSubmodules = course.modules.reduce(
      (acc, m) => acc + m.subModules.filter((s) => s.completed).length,
      0,
    )
    return Math.round((completedSubmodules / totalSubmodules) * 100)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/40 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Scaffold AI</h1>
              <p className="text-xs text-muted-foreground">Learning Hub</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">Welcome, {user.name.split(" ")[0]}!</h2>
            <p className="text-sm text-muted-foreground mt-1">Continue your learning journey</p>
          </div>

          <div className="grid gap-6">
            {/* Create Course Section */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Your Courses</h3>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Create Course</DialogTitle>
                    <DialogDescription>Give your course a title</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseTitle" className="text-sm">Course Title</Label>
                      <Input
                        id="courseTitle"
                        placeholder="e.g., Advanced Calculus"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateCourse()}
                      />
                    </div>
                    <Button onClick={handleCreateCourse} className="w-full">
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Courses Grid */}
            {courses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => {
                  const courseComplete =
                    course.modules.length > 0 &&
                    course.modules.every((m) => m.completed || m.subModules.every((s) => s.completed))
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => handleEnterCourse(course.id)}
                      className="cursor-pointer"
                    >
                      <Card
                        className={`border-border/30 hover:border-primary/50 transition-colors h-full ${
                          courseComplete ? "border-green-500/60 bg-green-50/60" : ""
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                courseComplete ? "bg-green-100" : "bg-secondary/20"
                              }`}
                            >
                              <GraduationCap
                                className={`w-5 h-5 ${courseComplete ? "text-green-700" : "text-secondary"}`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base truncate flex items-center gap-2">
                                {course.title}
                                {courseComplete && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                    Completed
                                  </span>
                                )}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {course.modules.length} modules
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{getCompletionPercentage(course)}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden bg-secondary/20">
                              <motion.div
                                className={`h-full rounded-full ${
                                  courseComplete ? "bg-green-500" : "bg-secondary"
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${getCompletionPercentage(course)}%` }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                              />
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full text-xs">
                            Open
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <Card className="border-border/20 bg-secondary/5">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-base font-medium text-foreground">No courses yet</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1 mb-4 max-w-sm">
                    Create your first course to get started
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)} size="sm" variant="secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
