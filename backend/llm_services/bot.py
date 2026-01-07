import json
import re
from tools.model import model, vision_model
from tools.vector_store import search_for_user
from langchain_core.messages import HumanMessage, SystemMessage


def _extract_images_from_docs(retrieved_docs):
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


def _extract_image_data_urls(retrieved_docs):
    """Extract base64 image data URLs from document text content."""
    data_urls = []
    pattern = re.compile(r"(data:image/[^;]+;base64,[A-Za-z0-9+/=]+)")
    for d in retrieved_docs or []:
        if hasattr(d, "page_content") and d.page_content:
            data_urls.extend(pattern.findall(d.page_content))
    return list(dict.fromkeys(data_urls))  # dedupe, preserve order


async def ask_chatbot(query: str, user_id: str):
    """Chat with the AI using user-scoped context."""
    print(f"Chatbot query for user {user_id}: {query}")
    
    # Get user-scoped documents
    retrieved_docs = search_for_user(query, user_id)
    docs_content = "\n\n".join(d.page_content for d in retrieved_docs)
    
    system_message = (
        "You are a helpful assistant. Use the following context in your response:\n\n"
        f"{docs_content}"
    )
    
    response = model.invoke([
        SystemMessage(content=system_message),
        HumanMessage(content=query)
    ])
    return response.content


async def tutor(query: str, adapt: str, analogy: str, user_id: str):
    """Get tutor content using user-scoped context with images sent to vision model."""
    query_text = (
        f"Act as a tutor. The user's understanding out of ten is {adapt} where 10 is firm grasp "
        f"of the concept and 0 is absolutely no idea what the concept is. For analogy here is "
        f"some info about the user: {analogy}. If no info is provided use a suitable one. {query}"
    )
    
    # Get user-scoped documents directly
    retrieved_docs = search_for_user(query_text[:2000], user_id)  # Truncate for embedding
    docs_content = "\n\n".join(d.page_content for d in retrieved_docs)
    
    # Extract images from documents
    images = _extract_images_from_docs(retrieved_docs) or _extract_image_data_urls(retrieved_docs)
    print(f"Retrieved {len(retrieved_docs)} docs with {len(images)} images for user: {user_id}")
    
    # Build the lesson prompt
    system_prompt = '''Convert the user's notes into a lesson.
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
'''
    
    full_prompt = f"{system_prompt}\n\nContext:\n{docs_content}\n\nUser Query: {query_text}"
    
    # If we have images, use vision model
    if images:
        print(f"📷 Sending {len(images)} images to vision model")
        content_parts = [{"type": "text", "text": full_prompt}]
        # Limit to first 5 images to avoid context overflow
        for img_url in images[:5]:
            if img_url.startswith("data:"):
                content_parts.append({
                    "type": "image_url",
                    "image_url": {"url": img_url}
                })
        
        try:
            response = vision_model.invoke([HumanMessage(content=content_parts)])
            raw = response.content
        except Exception as e:
            print(f"Vision model error: {e}, falling back to text model")
            response = model.invoke([HumanMessage(content=full_prompt)])
            raw = response.content
    else:
        response = model.invoke([HumanMessage(content=full_prompt)])
        raw = response.content
    
    # Try to inject images into the response
    try:
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        payload = json.loads(cleaned)
        if isinstance(payload, dict) and "lesson_phases" in payload:
            for phase in payload.get("lesson_phases", []):
                if isinstance(phase, dict):
                    phase["images"] = images
            return json.dumps(payload)
    except Exception:
        pass  # fallback to original content on parse issues
    return raw


async def quiz(query: str, user_id: str, question_count: int = 5):
    """Generate quiz using user-scoped context with configurable question count."""
    # Get user-scoped documents
    retrieved_docs = search_for_user(query, user_id, k=8)  # Get more docs for larger quizzes
    
    if not retrieved_docs or len(retrieved_docs) == 0:
        raise ValueError(f"No study materials found for topic '{query}'. Please upload relevant documents first.")
    
    docs_content = "\n\n".join(d.page_content for d in retrieved_docs)
    
    if not docs_content.strip():
        raise ValueError("Retrieved documents have no content. Please upload documents with readable text.")
    
    print(f"Retrieved {len(retrieved_docs)} docs for quiz ({question_count} questions), user: {user_id}")
    
    system_prompt = f'''Convert the user's notes into a set of quizzes.
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
'''
    
    full_prompt = f"{system_prompt}\n\nContext:\n{docs_content}\n\nTopic: {query}"
    
    response = model.invoke([HumanMessage(content=full_prompt)])
    return response.content

