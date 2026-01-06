"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { getUser } from "@/lib/storage"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function OnboardingPage() {
  const router = useRouter()
  const [analogy, setAnalogy] = useState("")
  const [adaptLevel, setAdaptLevel] = useState([5])
  const [isLoading, setIsLoading] = useState(false)
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/signup")
        return
      }
      setUid(currentUser.uid)
      
      // Load existing user preferences if available
      try {
        const profile = await getUser(currentUser.uid)
        if (profile) {
          setAnalogy(profile.analogy || "")
          setAdaptLevel([profile.adaptLevel || 5])
        }
      } catch (error) {
        console.error("Failed to load user profile", error)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid) {
      router.push("/signup")
      return
    }
    
    setIsLoading(true)

    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, analogy, adaptLevel: adaptLevel[0] }),
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to save onboarding preferences", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-primary mb-4">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground">Personalize Learning</h1>
          <p className="text-sm text-muted-foreground mt-2">Help us tailor your experience</p>
        </div>

        <Card className="border-border/40 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Your preferences</CardTitle>
            <CardDescription className="text-sm">We'll use this to customize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="analogy" className="text-sm font-medium">What are your interests?</Label>
                <Textarea
                  id="analogy"
                  placeholder="e.g., I learn best with step-by-step breakdowns..."
                  value={analogy}
                  onChange={(e) => setAnalogy(e.target.value)}
                  required
                  className="min-h-24 resize-none"
                />
                <p className="text-xs text-muted-foreground">We'll use these to explain concepts with relevant examples</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Learning pace</Label>
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
                  <span>Descriptive</span>
                  <span>Concise</span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !analogy.trim()}>
                {isLoading ? "Setting up..." : "Continue to Dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
