import json
from langchain.tools import tool
from langchain.agents.middleware import dynamic_prompt, ModelRequest
from tools.vector_store import vector_store, search_for_user

def extract_images_from_docs(retrieved_docs) -> list:
    """Extract base64 image data URLs from retrieved documents."""
    images = []
    for d in retrieved_docs or []:
        if hasattr(d, "metadata") and isinstance(d.metadata, dict):
            images_val = d.metadata.get("images")
            if images_val:
                if isinstance(images_val, str):
                    try:
                        parsed_images = json.loads(images_val)
                        if isinstance(parsed_images, list):
                            images.extend(parsed_images)
                    except json.JSONDecodeError:
                        pass
                elif isinstance(images_val, list):
                    images.extend(images_val)
    # Deduplicate while preserving order
    return list(dict.fromkeys(images))

@dynamic_prompt
def prompt_with_context(request: ModelRequest) -> str:
    """Inject user-scoped context into state messages."""
    last_query = request.state["messages"][-1].text
    user_id = request.state.get("user_id")
    
    print(f"🔍 last_query (len={len(last_query) if last_query else 0}): {last_query[:500] if last_query else 'None'}...")
    
    # Safety: Truncate query if too long (e.g. if an agent passes a summary as a query)
    # Gemini embeddings will fail on massive inputs (50k+ chars)
    search_query = last_query[:2000] if last_query else ""
    
    if user_id:
        retrieved_docs = search_for_user(search_query, user_id)
    else:
        # Fallback to unfiltered search (should not happen in production)
        print("⚠️ Warning: No user_id provided, using unfiltered search")
        retrieved_docs = vector_store.similarity_search(search_query)

    docs_content = "\n\n".join(doc.page_content for doc in retrieved_docs)

    system_message = (
        "You are a helpful assistant. Use the following context in your response:"
        f"\n\n{docs_content}"
    )

    return system_message

doc = {'item': None, 'images': []}

@dynamic_prompt
def get_lessons(request: ModelRequest) -> str:
    """Inject user-scoped context into state messages for lessons."""
    last_query = request.state["messages"][-1].text
    user_id = request.state.get("user_id")
    
    if user_id:
        retrieved_docs = search_for_user(last_query, user_id)
    else:
        print("⚠️ Warning: No user_id provided, using unfiltered search")
        retrieved_docs = vector_store.similarity_search(last_query)
    
    doc['item'] = retrieved_docs
    # Extract and store images for later use by the LLM
    doc['images'] = extract_images_from_docs(retrieved_docs)
    print(f"Retrieved {len(retrieved_docs)} docs with {len(doc['images'])} images for user: {user_id}")

    docs_content = "\n\n".join(d.page_content for d in retrieved_docs)

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
    """Inject user-scoped context into state messages for quizzes."""
    last_query = request.state["messages"][-1].text
    user_id = request.state.get("user_id")
    question_count = request.state.get("question_count", 5)
    
    if user_id:
        retrieved_docs = search_for_user(last_query, user_id, k=8)  # Get more docs for larger quizzes
    else:
        print("⚠️ Warning: No user_id provided, using unfiltered search")
        retrieved_docs = vector_store.similarity_search(last_query)
    
    print(f"Retrieved {len(retrieved_docs)} docs for quiz ({question_count} questions), user: {user_id}")

    docs_content = "\n\n".join(d.page_content for d in retrieved_docs)

    system_message = (
        f"""
Convert the user's notes into a set of quizzes.
Output ONLY valid JSON matching the structure below.

### STRUCTURE:
{{
  "topic_title": "Topic Name",
  "flashcards": [
    {{
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct option letter"
    }}
  ]
}}

### CRITICAL MATH FORMATTING RULES:
1. ALL math expressions MUST be wrapped in $$ for display or $ for inline
2. ALWAYS double-escape backslashes: \\frac, \\sqrt, \\sum, etc.
3. Example: "What is $$\\frac{{1}}{{2}} + \\frac{{1}}{{3}}$$?"
4. Example inline: "If $x = 2$, what is $x^{{2}}$?"
5. Use proper LaTeX for fractions, roots, powers, Greek letters

### OTHER RULES:
1. Generate exactly {question_count} MCQs
2. Each MCQ must have 4 options
3. Use Markdown for text formatting if needed
4. Make questions varied in difficulty
5. Cover different aspects of the topic
"""
        f"\n\nContext:\n{docs_content}"
    )

    return system_message
