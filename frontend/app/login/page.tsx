"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { saveUser } from "@/lib/storage"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password)
      const uid = credentials.user.uid

      const profileResponse = await fetch(`/api/users?uid=${uid}`)
      if (!profileResponse.ok) {
        setError("Account profile not found. Please sign up again.")
        setIsLoading(false)
        return
      }

      const profile = await profileResponse.json()
      saveUser({ ...profile, id: profile.uid })
      router.push("/dashboard")
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Failed to sign in."
      setError(message)
      console.error(loginError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setIsGoogleLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const credentials = await signInWithPopup(auth, provider)
      const { uid, email, displayName } = credentials.user

      if (!email) {
        throw new Error("Google account missing email")
      }

      const profilePayload = {
        uid,
        email,
        name: displayName || email.split("@")[0],
        analogy: "",
        adaptLevel: 5,
        createdAt: new Date().toISOString(),
      }

      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      })

      saveUser({ ...profilePayload, id: uid })
      router.push("/dashboard")
    } catch (googleError) {
      const message = googleError instanceof Error ? googleError.message : "Google sign-in failed."
      setError(message)
      console.error(googleError)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="block text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground">StudyLabs</h1>
          <p className="text-sm text-muted-foreground mt-2">Learn smarter with AI</p>
        </Link>

        <Card className="border-border/40 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription className="text-sm">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive">
                  {error}
                </motion.p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? "Connecting..." : "Continue with Google"}
            </Button>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
