"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
import { BookOpen, Plus, LogOut, GraduationCap, Sparkles, ArrowRight } from "lucide-react"
import {
  getUser,
  getCourses,
  saveCourse,
  generateId,
} from "@/lib/storage"
import type { User, Course } from "@/lib/types"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourseList] = useState<Course[]>([])
  const [newCourseTitle, setNewCourseTitle] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setIsAuthLoading(false)
        router.push("/login")
        return
      }

      try {
        const profile = await getUser(firebaseUser.uid)
        if (profile) {
          setUser(profile)
        }

        const fetchedCourses = await getCourses(firebaseUser.uid)
        setCourseList(fetchedCourses)

      } catch (error) {
        console.error("Failed to load user data", error)
      } finally {
        setIsAuthLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim() || !user) return
    const newCourse: Course = {
      id: generateId(),
      title: newCourseTitle.trim(),
      modules: [],
      files: [],
      createdAt: new Date().toISOString(),
    }

    await saveCourse(user.uid, newCourse)
    const updatedList = await getCourses(user.uid)
    setCourseList(updatedList)

    setIsDialogOpen(false)
    setNewCourseTitle("")
    router.push(`/course/${newCourse.id}`)
  }

  const handleLogout = async () => {
    try {
        await signOut(auth)
        setUser(null)
        setCourseList([])
        router.push("/login")
    } catch (err) {
        console.error("Sign out failed", err)
    }
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

  if (!user || isAuthLoading) return null

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-effect border-b-0">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground tracking-tight">Scaffold AI</h1>
              <p className="text-xs text-muted-foreground font-medium">Learning Hub</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-28 pb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {user.name.split(" ")[0]} <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
              </h2>
              <p className="text-muted-foreground text-lg">Ready to continue your learning journey?</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)} size="lg" className="gap-2 shadow-lg shadow-primary/20">
                  <Plus className="w-5 h-5" />
                  Create New Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Course</DialogTitle>
                  <DialogDescription>What would you like to learn today?</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="space-y-3">
                    <Label htmlFor="courseTitle" className="text-base">Course Title</Label>
                    <Input
                      id="courseTitle"
                      placeholder="e.g., Quantum Physics, Italian Cooking..."
                      value={newCourseTitle}
                      onChange={(e) => setNewCourseTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateCourse()}
                      className="text-lg h-12"
                    />
                  </div>
                  <Button onClick={handleCreateCourse} className="w-full h-12 text-base">
                    Create Course
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-8">
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Your Courses
            </h3>

            {courses.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {courses.map((course, index) => {
                    const courseComplete =
                      course.modules.length > 0 &&
                      course.modules.every((m) => m.completed || m.subModules.every((s) => s.completed))

                    const progress = getCompletionPercentage(course)

                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                        onClick={() => handleEnterCourse(course.id)}
                        className="cursor-pointer group h-full"
                      >
                        <Card className={`h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative ${
                          courseComplete ? "bg-gradient-to-br from-green-50 to-white" : "bg-white"
                        }`}>
                          {/* Decorative accent top bar */}
                          <div className={`absolute top-0 left-0 w-full h-1.5 ${
                            courseComplete ? "bg-green-400" : "bg-gradient-to-r from-primary to-accent"
                          }`} />

                          <CardHeader className="pb-4 pt-8">
                            <div className="flex justify-between items-start gap-4">
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                  courseComplete ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                                }`}
                              >
                                <BookOpen className="w-6 h-6" />
                              </div>
                              {courseComplete && (
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                  Completed
                                </span>
                              )}
                            </div>
                            <CardTitle className="text-xl mt-4 line-clamp-1 group-hover:text-primary transition-colors">
                              {course.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {course.modules.length ? `${course.modules.length} modules to master` : "Ready to start"}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="mt-auto">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                  <span>Progress</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-secondary/20 overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${
                                      courseComplete ? "bg-green-500" : "bg-gradient-to-r from-primary to-accent"
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                  />
                                </div>
                              </div>

                              <Button variant="ghost" className="w-full justify-between hover:bg-primary/5 group/btn">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover/btn:text-primary">Continue Learning</span>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/btn:text-primary transform group-hover/btn:translate-x-1 transition-transform" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full"
              >
                <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-6 animate-float">
                      <Sparkles className="w-10 h-10 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No courses yet</h3>
                    <p className="text-muted-foreground mb-8 max-w-md text-lg">
                      Create your first course to start your personalized learning journey with AI.
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)} size="lg" className="shadow-lg shadow-primary/20">
                      <Plus className="w-5 h-5 mr-2" />
                      Create First Course
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
