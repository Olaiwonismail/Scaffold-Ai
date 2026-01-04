"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, BrainCircuit, Sparkles, Zap, ArrowRight, CheckCircle2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar - Conditionally render dashboard button if logged in */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            <span className="font-semibold text-xl tracking-tight">PyMath</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="rounded-full px-6 shadow-lg shadow-primary/20">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-sm font-medium">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="rounded-full px-6 shadow-lg shadow-primary/20">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Gradients/Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 opacity-30 pointer-events-none">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] mix-blend-multiply animate-blob"></div>
           <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
           <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            <span>The Future of Learning is Here</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1]">
            Master Any Subject with <span className="gradient-text">AI-Powered</span> Precision.
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Personalized courses, smart notes, and interactive quizzes tailored to your unique learning style. Experience education reinvented.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
              <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all">
                Start Learning Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg bg-background/50 backdrop-blur-sm border-border hover:bg-background/80">
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="rounded-xl border border-border bg-background/50 backdrop-blur-sm p-2 shadow-2xl lg:rounded-2xl ring-1 ring-white/10">
              <div className="rounded-lg border border-border bg-background overflow-hidden aspect-[16/9] flex items-center justify-center text-muted-foreground relative">
                 <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5"></div>
                 <div className="z-10 text-center">
                    <BrainCircuit className="h-16 w-16 mx-auto mb-4 text-primary/40" />
                    <p>Dashboard Preview UI</p>
                 </div>
              </div>
            </div>
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-primary/10 blur-[100px]"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-secondary/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to excel</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform combines advanced AI with proven learning techniques to help you learn faster and retain more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<BookOpen className="h-8 w-8 text-primary" />}
              title="AI Courses"
              description="Generate custom courses on any topic instantly. Structured curriculums tailored to your goals."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-accent" />}
              title="Smart Notes"
              description="Capture ideas effortlessly. Our AI organizes, summarizes, and connects your notes automatically."
            />
            <FeatureCard
              icon={<BrainCircuit className="h-8 w-8 text-blue-500" />}
              title="Interactive Quizzes"
              description="Test your knowledge with adaptive quizzes that focus on your weak points to ensure mastery."
            />
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold mb-12">Trusted by learners worldwide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Placeholders for logos */}
             <div className="flex items-center justify-center font-bold text-xl">ACME Corp</div>
             <div className="flex items-center justify-center font-bold text-xl">Globex</div>
             <div className="flex items-center justify-center font-bold text-xl">Soylent</div>
             <div className="flex items-center justify-center font-bold text-xl">Initech</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to transform your learning?</h2>
          <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto">
            Join thousands of students and professionals who are leveling up their skills with PyMath.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="rounded-full px-10 h-14 text-lg font-semibold text-primary hover:bg-white">
              Get Started for Free
            </Button>
          </Link>
          <p className="mt-4 text-sm text-white/70">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
               <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs">
                  P
                </div>
                <span className="font-semibold text-lg tracking-tight">PyMath</span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-xs">
                Empowering the next generation of learners with cutting-edge AI technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} PyMath. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-foreground">Privacy</Link>
              <Link href="#" className="hover:text-foreground">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:-translate-y-1">
      <CardHeader>
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}
