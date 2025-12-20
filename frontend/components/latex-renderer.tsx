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
      return `<div class="math-display">${formatMath(math.trim())}</div>`
    })

    // Replace inline math ($...$) with styled spans
    processedContent = processedContent.replace(/\$([^$\n]+?)\$/g, (_, math) => {
      return `<span class="math-inline">${formatMath(math.trim())}</span>`
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

// Enhanced math formatter with better symbol support
function formatMath(math: string): string {
  let formatted = math
    // Fractions
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '<span class="frac"><span class="frac-num">$1</span><span class="frac-line"></span><span class="frac-den">$2</span></span>')
    // Square roots
    .replace(/\\sqrt\{([^}]*)\}/g, '<span class="sqrt">√<span class="sqrt-content">$1</span></span>')
    // Summation
    .replace(/\\sum/g, '<span class="big-op">Σ</span>')
    .replace(/\\prod/g, '<span class="big-op">Π</span>')
    .replace(/\\int/g, '<span class="big-op">∫</span>')
    // Greek letters
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\Gamma/g, "Γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\epsilon/g, "ε")
    .replace(/\\varepsilon/g, "ε")
    .replace(/\\theta/g, "θ")
    .replace(/\\Theta/g, "Θ")
    .replace(/\\pi/g, "π")
    .replace(/\\Pi/g, "Π")
    .replace(/\\sigma/g, "σ")
    .replace(/\\Sigma/g, "Σ")
    .replace(/\\omega/g, "ω")
    .replace(/\\Omega/g, "Ω")
    .replace(/\\phi/g, "φ")
    .replace(/\\Phi/g, "Φ")
    .replace(/\\psi/g, "ψ")
    .replace(/\\Psi/g, "Ψ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\Lambda/g, "Λ")
    .replace(/\\mu/g, "μ")
    .replace(/\\nu/g, "ν")
    .replace(/\\xi/g, "ξ")
    .replace(/\\rho/g, "ρ")
    .replace(/\\tau/g, "τ")
    .replace(/\\chi/g, "χ")
    .replace(/\\eta/g, "η")
    .replace(/\\kappa/g, "κ")
    .replace(/\\zeta/g, "ζ")
    // Math operators and symbols
    .replace(/\\infty/g, "∞")
    .replace(/\\cdot/g, "·")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\mp/g, "∓")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\equiv/g, "≡")
    .replace(/\\sim/g, "∼")
    .replace(/\\propto/g, "∝")
    // Arrows
    .replace(/\\rightarrow/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\Rightarrow/g, "⇒")
    .replace(/\\Leftarrow/g, "⇐")
    .replace(/\\leftrightarrow/g, "↔")
    .replace(/\\Leftrightarrow/g, "⇔")
    // Sets
    .replace(/\\in/g, "∈")
    .replace(/\\notin/g, "∉")
    .replace(/\\subset/g, "⊂")
    .replace(/\\supset/g, "⊃")
    .replace(/\\subseteq/g, "⊆")
    .replace(/\\supseteq/g, "⊇")
    .replace(/\\cup/g, "∪")
    .replace(/\\cap/g, "∩")
    .replace(/\\emptyset/g, "∅")
    .replace(/\\forall/g, "∀")
    .replace(/\\exists/g, "∃")
    // Superscripts with proper handling
    .replace(/\^{([^}]*)}/g, "<sup>$1</sup>")
    .replace(/\^(\w)/g, "<sup>$1</sup>")
    // Subscripts with proper handling
    .replace(/_{([^}]*)}/g, "<sub>$1</sub>")
    .replace(/_(\w)/g, "<sub>$1</sub>")
    // Remove any remaining LaTeX commands
    .replace(/\\[a-zA-Z]+/g, "")
    // Clean up extra spaces
    .replace(/\s+/g, " ")
    .trim()

  return formatted
}
