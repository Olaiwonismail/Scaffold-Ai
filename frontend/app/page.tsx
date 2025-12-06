"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/storage"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const user = getUser()
    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-foreground">Loading...</div>
    </div>
  )
}
