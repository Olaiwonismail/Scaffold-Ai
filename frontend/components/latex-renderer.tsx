"use client"

import { useMemo } from "react"

interface LatexRendererProps {
  content: string
  className?: string
}

export function LatexRenderer({ content, className = "" }: LatexRendererProps) {
  const renderedContent = useMemo(() => {
    let processedContent = content

    // Replace display math ($$...$$) with styled blocks
    processedContent = processedContent.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      return `<div class="my-4 p-3 bg-muted/50 rounded-lg overflow-x-auto font-mono text-center text-primary">${formatMath(math.trim())}</div>`
    })

    // Replace inline math ($...$) with styled spans
    processedContent = processedContent.replace(/\$([^$\n]+?)\$/g, (_, math) => {
      return `<span class="font-mono text-primary px-1">${formatMath(math.trim())}</span>`
    })

    // Convert newlines to breaks for board content
    processedContent = processedContent.replace(/\n/g, "<br/>")

    // Convert bullet points
    processedContent = processedContent.replace(/^- (.*)$/gm, "<li>$1</li>")
    processedContent = processedContent.replace(/(<li>.*<\/li>)/gs, "<ul class='list-disc ml-4 my-2'>$1</ul>")

    // Bold text with **
    processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    // Italic text with *
    processedContent = processedContent.replace(/\*([^*]+)\*/g, "<em>$1</em>")

    return processedContent
  }, [content])

  return <div className={`latex-content ${className}`} dangerouslySetInnerHTML={{ __html: renderedContent }} />
}

// Simple math formatter that converts LaTeX-like syntax to readable format
function formatMath(math: string): string {
  return math
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^}]*)\}/g, "√($1)")
    .replace(/\\sum/g, "Σ")
    .replace(/\\prod/g, "Π")
    .replace(/\\int/g, "∫")
    .replace(/\\infty/g, "∞")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\theta/g, "θ")
    .replace(/\\pi/g, "π")
    .replace(/\\sigma/g, "σ")
    .replace(/\\omega/g, "ω")
    .replace(/\\phi/g, "φ")
    .replace(/\\psi/g, "ψ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\mu/g, "μ")
    .replace(/\\epsilon/g, "ε")
    .replace(/\\cdot/g, "·")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\rightarrow/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\Rightarrow/g, "⇒")
    .replace(/\\Leftarrow/g, "⇐")
    .replace(/\^{([^}]*)}/g, "<sup>$1</sup>")
    .replace(/\^(\w)/g, "<sup>$1</sup>")
    .replace(/_{([^}]*)}/g, "<sub>$1</sub>")
    .replace(/_(\w)/g, "<sub>$1</sub>")
    .replace(/\\[a-zA-Z]+/g, "") // Remove any remaining LaTeX commands
}
