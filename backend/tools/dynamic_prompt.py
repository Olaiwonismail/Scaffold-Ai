from langchain.tools import tool
from langchain.agents.middleware import dynamic_prompt, ModelRequest
from tools.vector_store import vector_store

@dynamic_prompt
def prompt_with_context(request: ModelRequest) -> str:
    """Inject context into state messages."""
    last_query = request.state["messages"][-1].text

    retrieved_docs = vector_store.similarity_search(last_query)

    docs_content = "\n\n".join(doc.page_content for doc in retrieved_docs)

    system_message = (
        "You are a helpful assistant. Use the following context in your response:"
        f"\n\n{docs_content}"
    )

    return system_message

doc = {'item':None}
@dynamic_prompt
def get_lessons(request: ModelRequest) -> str:
    """Inject context into state messages."""
    last_query = request.state["messages"][-1].text
    retrieved_docs = vector_store.similarity_search(last_query)
    doc['item'] = retrieved_docs
    print(retrieved_docs)

    docs_content = "\n\n".join(doc.page_content for doc in retrieved_docs)

    system_message = (
        """
Convert the user's notes into a lesson.
Output ONLY valid JSON matching the structure below.

### STRUCTURE:
{
  "topic_title": "Topic Name",
  "lesson_phases": [
    {
      "phase_name": "one for each of these: 1. Concept (Analogy), 2. Toolkit (Formulas), 3. Simple Example, 4. Complex Example, 5. Summary",
      "steps": [
        {"narration": "Conversational, explaining the 'why'", "board": "Academic content. Use LaTeX inside $$"}
      ],
      "source":"add the exact pages and source info was gotten from"
    }
  ]
}

### CRITICAL MATH FORMATTING RULES:
1. ALL math expressions MUST be wrapped in $$ for display math or $ for inline math
2. ALWAYS double-escape backslashes in JSON: \\frac, \\sqrt, \\sum, etc.
3. Use proper LaTeX syntax: \\frac{numerator}{denominator}, \\sqrt{expression}
4. For superscripts: x^{2} or x^2 (curly braces for multi-char)
5. For subscripts: x_{1} or x_1
6. Common symbols: \\pi, \\theta, \\alpha, \\beta, \\infty, \\sum, \\int
7. Example: "The formula is $$E = mc^{2}$$" or "inline math like $\\pi r^{2}$"

### OTHER RULES:
1. Use Markdown for text formatting (bold, italic, lists)
2. Be consistent with math notation throughout
"""
        f"\n\nContext:\n{docs_content}"
    )

    return system_message

@dynamic_prompt
def get_quiz(request: ModelRequest) -> str:
    """Inject context into state messages for flashcards."""
    last_query = request.state["messages"][-1].text
    retrieved_docs = vector_store.similarity_search(last_query)
    print(retrieved_docs)

    docs_content = "\n\n".join(doc.page_content for doc in retrieved_docs)

    system_message = (
        """
Convert the user's notes into a set of quizzes.
Output ONLY valid JSON matching the structure below.

### STRUCTURE:
{
  "topic_title": "Topic Name",
  "flashcards": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct option letter"
    }
  ]
}

### CRITICAL MATH FORMATTING RULES:
1. ALL math expressions MUST be wrapped in $$ for display or $ for inline
2. ALWAYS double-escape backslashes: \\frac, \\sqrt, \\sum, etc.
3. Example: "What is $$\\frac{1}{2} + \\frac{1}{3}$$?"
4. Example inline: "If $x = 2$, what is $x^{2}$?"
5. Use proper LaTeX for fractions, roots, powers, Greek letters

### OTHER RULES:
1. Generate exactly 3 MCQs
2. Each MCQ must have 4 options
3. Use Markdown for text formatting if needed
"""
        f"\n\nContext:\n{docs_content}"
    )

    return system_message
