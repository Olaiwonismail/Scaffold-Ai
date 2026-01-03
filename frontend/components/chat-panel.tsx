"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { sendChatMessage } from "@/lib/api"
import { LatexRenderer } from "./latex-renderer"
import type { Message } from "@/lib/types"

interface ChatPanelProps {
  initialMessages?: Message[]
  onMessagesChange?: (messages: Message[]) => void
}

export function ChatPanel({ initialMessages = [], onMessagesChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // If we have initial messages, use them.
    // If empty, allow adding a default welcome message if truly empty (not just uninitialized)
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
    } else if (messages.length === 0) {
       setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hi! I'm your study assistant. Feel free to ask me any questions about the material you're learning. I'm here to help clarify concepts and answer your doubts!",
        },
      ])
    }
  }, [initialMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const updateMessages = (newMessages: Message[]) => {
      setMessages(newMessages)
      if (onMessagesChange) {
          onMessagesChange(newMessages)
      }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    const newMessages = [...messages, userMessage]
    updateMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await sendChatMessage(input.trim())
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.replace(/^"|"$/g, ""), // Remove surrounding quotes if present
      }
      updateMessages([...newMessages, assistantMessage])
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
      }
      updateMessages([...newMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-card/30 rounded-lg border border-border/50">
      <div className="p-3 border-b border-border/50">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          Study Assistant
        </h3>
        <p className="text-xs text-muted-foreground">Ask questions or clarify doubts</p>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-lg text-sm ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground"
                  }`}
                >
                  <LatexRenderer content={message.content} />
                </div>
                {message.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
              </div>
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border/50">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-background/50"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
