"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  BookOpen, 
  Sparkles, 
  Brain, 
  Target, 
  Upload, 
  GraduationCap, 
  MessageSquare, 
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Users
} from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function LandingPage() {
  const router = useRouter()
  // Optimization: Removed blocking loading state to show landing page immediately
  // while checking auth in background.
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.push("/dashboard")
      }
    })

    return () => unsubscribe()
  }, [router])

  const features = [
    {
      icon: Upload,
      title: "Upload Any Material",
      description: "PDFs, YouTube videos, or web links - we process them all into structured courses.",
      color: "text-white",
      bgColor: "bg-blue-500",
    },
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Our AI understands your content and creates personalized learning paths.",
      color: "text-white",
      bgColor: "bg-purple-500",
    },
    {
      icon: Target,
      title: "Adaptive Difficulty",
      description: "Content adjusts to your learning level - from beginner to expert.",
      color: "text-white",
      bgColor: "bg-green-500",
    },
    {
      icon: MessageSquare,
      title: "Interactive Tutor",
      description: "Ask questions anytime. Get instant, contextual answers.",
      color: "text-white",
      bgColor: "bg-orange-500",
    },
    {
      icon: GraduationCap,
      title: "Smart Quizzes",
      description: "Test your knowledge with AI-generated quizzes tailored to you.",
      color: "text-white",
      bgColor: "bg-pink-500",
    },
    {
      icon: Sparkles,
      title: " Personalized Examples",
      description: "Concepts explained using examples from your interests.",
      color: "text-white",
      bgColor: "bg-amber-500",
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Upload Your Materials",
      description: "Drop in your PDFs, paste YouTube links, or add web URLs. We handle the rest.",
    },
    {
      number: "02",
      title: "AI Creates Your Course",
      description: "Our AI analyzes content and creates a structured course outline with modules.",
    },
    {
      number: "03",
      title: "Learn at Your Pace",
      description: "Interactive lessons, quizzes, and an AI tutor help you master each topic.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg">StudyLabs</h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Learn Smarter</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 gradient-bg" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Learning Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Transform Any Content Into
              <span className="text-primary"> Personalized Courses</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Upload your study materials, and let our AI create interactive lessons tailored to your learning style. 
              Master any subject with personalized examples and adaptive difficulty.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-base px-8">
                  Start Learning Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-base px-8">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 mt-12 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Learn Effectively
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powered by cutting-edge AI to make learning faster, more engaging, and personalized to you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-border/30 hover:border-primary/30 transition-colors h-full bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes. No complex setup required.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-primary/50" />
                )}
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of learners who are mastering new skills with AI-powered personalization.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-base px-10">
                  Get Started for Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="https://chat.whatsapp.com/BMn1yvMBQVAL4O09x8yJNl" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-base px-8 border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
                  <Users className="w-5 h-5 mr-2" />
                  Join Community
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 bg-card/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">StudyLabs</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 StudyLabs. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
