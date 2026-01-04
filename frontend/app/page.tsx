"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BookOpen, Sparkles, Brain, Target, ArrowRight, Zap, CheckCircle2 } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function LandingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    // Safety timeout in case Firebase hangs (e.g. invalid config)
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) return false
        return prev
      })
    }, 1500)

    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] opacity-60" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-white/20">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">Scaffold AI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            {!loading && (
              user ? (
                <Button onClick={() => router.push("/dashboard")} className="shadow-lg shadow-primary/20">
                  Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary hidden sm:block">
                    Sign in
                  </Link>
                  <Button onClick={() => router.push("/signup")} className="shadow-lg shadow-primary/20">
                    Get Started
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-6 mb-32 text-center relative">
          <motion.div
            style={{ opacity, scale }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white/50 shadow-sm mb-8 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-muted-foreground">AI-Powered Learning Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
              Master any subject with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-accent">
                personalized AI tutors
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your documents, and let our AI create structured courses, quizzes, and summaries tailored to your unique learning style.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => router.push("/signup")} className="h-14 px-8 text-lg rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                Start Learning for Free
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-2xl bg-white/50 border-white/60 hover:bg-white transition-colors">
                View Demo
              </Button>
            </div>

            {/* Hero Visual */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="mt-20 relative z-10"
            >
              <div className="rounded-3xl border border-white/40 bg-white/30 backdrop-blur-md p-4 shadow-2xl shadow-primary/10">
                <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-gradient-to-br from-gray-50 to-white border border-white/50 flex items-center justify-center relative">
                  {/* Abstract UI Representation */}
                   <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <div className="grid grid-cols-3 gap-8 w-full max-w-3xl px-8">
                         <div className="h-40 bg-primary rounded-2xl"></div>
                         <div className="h-40 bg-secondary rounded-2xl"></div>
                         <div className="h-40 bg-accent rounded-2xl"></div>
                      </div>
                   </div>
                   <p className="text-muted-foreground font-medium flex items-center gap-2">
                      <Zap className="w-5 h-5 text-accent" />
                      AI Generating Course Structure...
                   </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why learn with Scaffold?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We combine cognitive science with advanced AI to help you learn faster and retain more.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Brain className="w-8 h-8 text-primary" />,
                title: "Adaptive Learning Paths",
                desc: "Our AI analyzes your documents and creates a custom curriculum that evolves as you progress."
              },
              {
                icon: <Zap className="w-8 h-8 text-accent" />,
                title: "Instant Quizzes",
                desc: "Test your knowledge immediately after every module with auto-generated quizzes and feedback."
              },
              {
                icon: <Target className="w-8 h-8 text-secondary-foreground" />,
                title: "Goal Tracking",
                desc: "Set learning goals and visualize your progress with beautiful, intuitive dashboards."
              }
            ].map((feature, i) => (
              <motion.div key={i} variants={itemVariants} className="group">
                <div className="glass-panel p-8 rounded-3xl h-full hover:-translate-y-2 transition-transform duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-white/50 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="container mx-auto px-6 mb-32">
          <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-[2.5rem] p-8 md:p-16 border border-white/40 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 blur-3xl rounded-full pointer-events-none -mr-20 -mt-20" />

            <div className="text-center mb-16 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">From PDF to Mastery in Minutes</h2>
              <p className="text-muted-foreground text-lg">Three simple steps to supercharge your learning.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
               {[
                 { step: "01", title: "Upload", desc: "Drag and drop your textbooks, papers, or notes (PDF)." },
                 { step: "02", title: "Generate", desc: "AI builds a structured course with summaries and key concepts." },
                 { step: "03", title: "Learn", desc: "Read, take quizzes, and track your progress to mastery." }
               ].map((item, i) => (
                 <div key={i} className="text-center relative">
                    <div className="text-6xl font-bold text-white/40 mb-4">{item.step}</div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 mb-20">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">Ready to transform how you learn?</h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of students and professionals using Scaffold AI to stay ahead.
            </p>
            <Button size="lg" onClick={() => router.push("/signup")} className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/25 hover:shadow-2xl hover:-translate-y-1 transition-all">
              Get Started Now <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="mt-6 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-500" /> Free to start
              <span className="mx-2">•</span>
              <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-500" /> No credit card required
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-white/40 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xl">Scaffold AI</span>
                </div>
                <p className="text-muted-foreground max-w-xs">
                  Empowering learners with personalized, AI-driven education tools.
                </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">Testimonials</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground pt-8 border-t border-white/10">
            © {new Date().getFullYear()} Scaffold AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
