

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
. Convert the user's notes into a lesson.
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

### CRITICAL RULES:
1. Use Markdown for text formatting.
2. Use LaTeX for math wrapped in $$.
3. JSON FORMATTING: You MUST double-escape all LaTeX backslashes (e.g., use "\\frac" not "\frac").
"""
        f"\n\n{docs_content}"
    )

    return system_message

@dynamic_prompt
def get_flashcards(request: ModelRequest) -> str:
    """Inject context into state messages for flashcards."""
    
    retrieved_docs = doc['item']
    print(retrieved_docs)

    docs_content = "\n\n".join(doc.page_content for doc in retrieved_docs)

    system_message = (
        """
. Convert the user's notes into a set of flashcards.
Output ONLY valid JSON matching the structure below.

### STRUCTURE:
{
  "topic_title": "Topic Name",
  "flashcards": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct option letter",
      
    }
  ]
}

### CRITICAL RULES:
1. Generate exactly 3 MCQs.
2. Each MCQ must have 4 options.
3. Use Markdown for text formatting if needed.
4. Use LaTeX for any math wrapped in $$ and double-escape backslashes (e.g., "\\frac" not "\frac").
"""
        f"\n\n{docs_content}"
    )

    return system_message
