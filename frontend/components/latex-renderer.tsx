"use client"

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'

interface LatexRendererProps {
  content: string
  className?: string
}

export function LatexRenderer({ content, className = "" }: LatexRendererProps) {
  // Pre-process content to handle various math notations
  const processedContent = useMemo(() => {
    let processed = content

    // Handle escaped backslashes that might come from JSON
    processed = processed.replace(/\\\\/g, '\\')
    
    // Convert literal \n to actual newlines
    processed = processed.replace(/\\n/g, '\n')
    
    // Convert \[ \] to $$ $$ for display math
    processed = processed.replace(/\\\[/g, '$$')
    processed = processed.replace(/\\\]/g, '$$')
    
    // Convert \( \) to $ $ for inline math
    processed = processed.replace(/\\\(/g, '$')
    processed = processed.replace(/\\\)/g, '$')

    return processed
  }, [content])

  return (
    <div className={`latex-content prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, {
          strict: false,
          throwOnError: false,
          errorColor: '#cc0000',
          macros: {
            "\\RR": "\\mathbb{R}",
            "\\NN": "\\mathbb{N}",
            "\\ZZ": "\\mathbb{Z}",
            "\\QQ": "\\mathbb{Q}",
            "\\CC": "\\mathbb{C}",
            "\\FF": "\\mathbb{F}",
            "\\PP": "\\mathbb{P}",
            "\\eps": "\\varepsilon",
            "\\phi": "\\varphi",
            "\\R": "\\mathbb{R}",
            "\\N": "\\mathbb{N}",
            "\\Z": "\\mathbb{Z}",
            "\\Q": "\\mathbb{Q}",
            "\\C": "\\mathbb{C}",
            "\\F": "\\mathbb{F}",
            "\\P": "\\mathbb{P}",
          },
          trust: true,
        }]]}
        components={{
          // Custom styling for various elements
          p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-inherit">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children, className }) => {
            const isInline = !className
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            ) : (
              <code className={`block bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto ${className}`}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-3">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 py-1 my-3 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
          a: ({ href, children }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full divide-y divide-border">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-sm font-semibold bg-muted">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-sm border-t border-border">{children}</td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

// Simplified inline math component for when full markdown isn't needed
export function InlineMath({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[[rehypeKatex, {
        strict: false,
        throwOnError: false,
        errorColor: '#cc0000',
        macros: {
          "\\RR": "\\mathbb{R}",
          "\\NN": "\\mathbb{N}",
          "\\ZZ": "\\mathbb{Z}",
          "\\QQ": "\\mathbb{Q}",
          "\\CC": "\\mathbb{C}",
          "\\FF": "\\mathbb{F}",
          "\\PP": "\\mathbb{P}",
          "\\eps": "\\varepsilon",
          "\\phi": "\\varphi",
          "\\R": "\\mathbb{R}",
          "\\N": "\\mathbb{N}",
          "\\Z": "\\mathbb{Z}",
          "\\Q": "\\mathbb{Q}",
          "\\C": "\\mathbb{C}",
          "\\F": "\\mathbb{F}",
          "\\P": "\\mathbb{P}",
        },
        trust: true,
      }]]}
    >
      {`$${children}$`}
    </ReactMarkdown>
  )
}

// Display math component
export function DisplayMath({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[[rehypeKatex, {
        strict: false,
        throwOnError: false,
        errorColor: '#cc0000',
        macros: {
          "\\RR": "\\mathbb{R}",
          "\\NN": "\\mathbb{N}",
          "\\ZZ": "\\mathbb{Z}",
          "\\QQ": "\\mathbb{Q}",
          "\\CC": "\\mathbb{C}",
          "\\FF": "\\mathbb{F}",
          "\\PP": "\\mathbb{P}",
          "\\eps": "\\varepsilon",
          "\\phi": "\\varphi",
          "\\R": "\\mathbb{R}",
          "\\N": "\\mathbb{N}",
          "\\Z": "\\mathbb{Z}",
          "\\Q": "\\mathbb{Q}",
          "\\C": "\\mathbb{C}",
          "\\F": "\\mathbb{F}",
          "\\P": "\\mathbb{P}",
        },
        trust: true,
        displayMode: true,
      }]]}
    >
      {`$$${children}$$`}
    </ReactMarkdown>
  )
}
