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
import { BookOpen, Sparkles, ArrowRight, User } from "lucide-react"
import { getUser, saveUser } from "@/lib/storage"

export default function OnboardingPage() {
  const router = useRouter()
  const [analogy, setAnalogy] = useState("")
  const [adaptLevel, setAdaptLevel] = useState([5])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.push("/signup")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const user = getUser()
    if (user) {
      user.analogy = analogy
      user.adaptLevel = adaptLevel[0]
      saveUser(user)
      router.push("/dashboard")
    }
  }

  const getAdaptLabel = (value: number) => {
    if (value <= 2) return "Beginner"
    if (value <= 4) return "Elementary"
    if (value <= 6) return "Intermediate"
    if (value <= 8) return "Advanced"
    return "Expert"
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
          >
            <User className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Tell us about yourself</h1>
          <p className="text-muted-foreground mt-2">{"Let's make this journey fun!"}</p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Personalize Your Learning
            </CardTitle>
            <CardDescription>We use this to create analogies that resonate with your interests</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="analogy" className="text-base">
                  What are your hobbies or interests?
                </Label>
                <Textarea
                  id="analogy"
                  placeholder="I like basketball"
                  value={analogy}
                  onChange={(e) => setAnalogy(e.target.value)}
                  required
                  className="bg-background/50 min-h-[100px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This helps us explain complex concepts using examples you can relate to
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">How fast do you learn</Label>
                  <span className="text-sm font-medium text-primary">{getAdaptLabel(adaptLevel[0])}</span>
                </div>
                <Slider value={adaptLevel} onValueChange={setAdaptLevel} max={10} min={1} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span> </span>
                  <span>Very Fast</span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !analogy.trim()}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.span>
                    Setting up...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
