"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  School, 
  Globe, 
  GraduationCap, 
  BookOpen,
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { getUser, saveUser } from "@/lib/storage"
import type { User } from "@/lib/types"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", 
  "France", "India", "China", "Japan", "Brazil", "Nigeria", "South Africa",
  "Mexico", "Spain", "Italy", "Netherlands", "Sweden", "Singapore", "Other"
]

const GRADES = [
  "Middle School",
  "High School",
  "Undergraduate",
  "Graduate",
  "PhD",
  "Professional",
  "Self-Learning"
]

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  
  // Form fields
  const [name, setName] = useState("")
  const [school, setSchool] = useState("")
  const [country, setCountry] = useState("")
  const [grade, setGrade] = useState("")
  const [bio, setBio] = useState("")
  const [analogy, setAnalogy] = useState("")
  const [adaptLevel, setAdaptLevel] = useState([5])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login")
        return
      }

      try {
        const profile = await getUser(firebaseUser.uid)
        if (profile) {
          setUser(profile)
          setName(profile.name || "")
          setSchool(profile.school || "")
          setCountry(profile.country || "")
          setGrade(profile.grade || "")
          setBio(profile.bio || "")
          setAnalogy(profile.analogy || "")
          setAdaptLevel([profile.adaptLevel || 5])
        }
      } catch (error) {
        console.error("Failed to load profile", error)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    setSaveStatus("idle")

    try {
      const updatedUser: User = {
        ...user,
        name,
        school,
        country,
        grade,
        bio,
        analogy,
        adaptLevel: adaptLevel[0],
      }

      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          name,
          school,
          country,
          grade,
          bio,
          analogy,
          adaptLevel: adaptLevel[0],
        }),
      })

      await saveUser(updatedUser)
      setUser(updatedUser)
      setSaveStatus("success")
      
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Failed to save profile", error)
      setSaveStatus("error")
    } finally {
      setIsSaving(false)
    }
  }

  const getLevelLabel = (value: number) => {
    const labels = ["Beginner", "Elementary", "Intermediate", "Advanced", "Expert"]
    return labels[Math.floor((value - 1) / 2)] || "Expert"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/40 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Profile Settings</h1>
              <p className="text-xs text-muted-foreground">Manage your account</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>Saving...</>
            ) : saveStatus === "success" ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Save Status Banner */}
          {saveStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                Your profile has been updated successfully!
              </span>
            </motion.div>
          )}

          {saveStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300 text-sm font-medium">
                Failed to save profile. Please try again.
              </span>
            </motion.div>
          )}

          {/* Profile Header Card */}
          <Card className="border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                  {name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground">{name || "User"}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </p>
                  {(school || grade) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <GraduationCap className="w-4 h-4" />
                      {[grade, school].filter(Boolean).join(" at ")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserIcon className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Basic information about you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select your country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  className="min-h-20 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <School className="w-5 h-5 text-secondary" />
                Education
              </CardTitle>
              <CardDescription>Your educational background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="grade">Education Level</Label>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select your level</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school">School/University</Label>
                  <Input
                    id="school"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Your institution"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Preferences */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-accent" />
                Learning Preferences
              </CardTitle>
              <CardDescription>Customize your learning experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="analogy">Interests & Hobbies</Label>
                <Textarea
                  id="analogy"
                  value={analogy}
                  onChange={(e) => setAnalogy(e.target.value)}
                  placeholder="e.g., I like basketball, music, cooking, video games..."
                  className="min-h-24 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  We'll use these to explain concepts with examples you can relate to.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Learning Pace</Label>
                  <span className="text-sm font-medium text-primary px-3 py-1 bg-primary/10 rounded-full">
                    {getLevelLabel(adaptLevel[0])}
                  </span>
                </div>
                <Slider
                  value={adaptLevel}
                  onValueChange={setAdaptLevel}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slower (more detail)</span>
                  <span>Faster (concise)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Save Button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              size="lg"
              className="gap-2"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save All Changes
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
