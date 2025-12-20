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
import { BookOpen, Plus, LogOut, User, Sparkles, FolderOpen, GraduationCap } from "lucide-react"
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
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Scaffold AI</h1>
              <p className="text-xs text-muted-foreground">Personalized Learning</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{user.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Welcome back, {user.name.split(" ")[0]}!</h2>
            <p className="text-muted-foreground mt-2">{"Ready to continue your learning journey?"}</p>
          </div>

          {/* Course Section */}
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Your Courses</h3>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>Give your course a title to get started</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseTitle">Course Title</Label>
                      <Input
                        id="courseTitle"
                        placeholder="e.g., Complex Analysis"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateCourse()
                        }}
                      />
                    </div>
                    <Button onClick={handleCreateCourse} className="w-full">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Course
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {courses.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => handleEnterCourse(course.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{course.title}</CardTitle>
                              <CardDescription>
                                {course.modules.length} modules • {course.files.length} files
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">{getCompletionPercentage(course)}%</span>
                          </div>
                          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${getCompletionPercentage(course)}%` }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            />
                          </div>
                          <Button className="w-full mt-4" onClick={() => handleEnterCourse(course.id)}>
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Enter Course
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-border/50 bg-card/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No courses yet</h3>
                  <p className="text-muted-foreground text-center mb-4 max-w-sm">
                    {"Let's create a course to start your personalized learning journey"}
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Course
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
