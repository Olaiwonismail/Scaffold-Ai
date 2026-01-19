import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })

export const metadata: Metadata = {
  metadataBase: new URL('https://studylabs.vercel.app'),
  title: {
    default: "StudyLabs - The Best AI App to Help University Students Study",
    template: "%s | StudyLabs"
  },
  description:
    "Looking for an app to help you study? StudyLabs is the ultimate AI study companion for university students. Upload PDFs, generate quizzes, and master your exams with personalized AI tutoring.",
  keywords: [
    "app to help me study",
    "AI study app",
    "university study tool",
    "exam prep",
    "PDF to quiz",
    "AI tutor",
    "study companion",
    "interactive learning",
    "StudyLabs"
  ],
  authors: [{ name: "StudyLabs Team" }],
  creator: "StudyLabs",
  publisher: "StudyLabs",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://studylabs.vercel.app",
    title: "StudyLabs - The Best AI App to Help University Students Study",
    description: "Transform your study materials into interactive lessons. StudyLabs is the ultimate AI study companion. Upload PDFs, get quizzes, and ace your exams.",
    siteName: "StudyLabs",
    images: [
      {
        url: "/og-image.png", // Assuming we might add one later, or it uses a default Vercel one.
        width: 1200,
        height: 630,
        alt: "StudyLabs - AI Powered Learning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyLabs - AI Study App for University Students",
    description: "The best app to help you study. Turn notes into quizzes and get instant AI help.",
    // images: ["/twitter-image.png"], // Optional
  },
  alternates: {
    canonical: "https://studylabs.vercel.app",
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <div className="fixed inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="fixed inset-0 -z-20 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(198,177,240,0.3),rgba(255,255,255,0))]"></div>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
