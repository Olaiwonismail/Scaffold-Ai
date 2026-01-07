import json
import re
from tools.model import model, vision_model
from tools.dynamic_prompt import prompt_with_context, get_lessons, get_quiz, doc
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage

agent = create_agent(model, tools=[], middleware=[prompt_with_context])
tutor_agent = create_agent(model, tools=[], middleware=[get_lessons])
quiz_agent = create_agent(model, tools=[], middleware=[get_quiz])


def _extract_image_data_urls(retrieved_docs):
    data_urls = []
    
    # Extract from metadata
    for d in retrieved_docs or []:
        if hasattr(d, "metadata") and isinstance(d.metadata, dict):
            images_val = d.metadata.get("images")
            if images_val:
                if isinstance(images_val, str):
                    try:
                        images = json.loads(images_val)
                        if isinstance(images, list):
                            data_urls.extend(images)
                    except json.JSONDecodeError:
                        pass
                elif isinstance(images_val, list):
                    data_urls.extend(images_val)

    # Extract from text (fallback)
    pattern = re.compile(r"(data:image/[^;]+;base64,[A-Za-z0-9+/=]+)")
    for d in retrieved_docs or []:
        if hasattr(d, "page_content") and d.page_content:
            data_urls.extend(pattern.findall(d.page_content))
            
    return list(dict.fromkeys(data_urls))  # dedupe, preserve order


async def ask_chatbot(query: str, user_id: str):
    """Chat with the AI using user-scoped context."""
    print(f"Chatbot query for user {user_id}: {query}")
    response = agent.invoke(
        {"messages": [{"role": "user", "content": query}], "user_id": user_id}
    )
    return response["messages"][1].content


async def tutor(query: str, adapt: str, analogy: str, user_id: str):
    """Get tutor content using user-scoped context with images sent to vision model."""
    query_text = (
        f"Act as a tutur the user understanding out of ten is {adapt} where 10 is firm grasp "
        f"of the concept and 0 is absolutely no idea what the concept is for analogy here is "
        f"some info about the user {analogy}  if no info is pprovided use a suitable one {query}"
    )
    
    # First, get the context via the middleware
    result = tutor_agent.invoke(
        {"messages": [{"role": "user", "content": query_text}], "user_id": user_id}
    )
    msgs = result["messages"]
    raw = msgs[-1].content

    # Get images from the retrieved documents
    images = doc.get("images", []) or _extract_image_data_urls(doc.get("item"))
    
    # If we have images, re-invoke with the vision model including images
    if images:
        print(f"📷 Sending {len(images)} images to vision model")
        # Build multimodal content
        content_parts = [{"type": "text", "text": query_text}]
        # Limit to first 5 images to avoid context overflow
        for img_url in images[:5]:
            if img_url.startswith("data:"):
                content_parts.append({
                    "type": "image_url",
                    "image_url": {"url": img_url}
                })
        
        try:
            vision_response = vision_model.invoke([HumanMessage(content=content_parts)])
            raw = vision_response.content
        except Exception as e:
            print(f"Vision model error, using text response: {e}")
    
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
    # Append question count instruction to the query
    enhanced_query = f"{query}\n\nIMPORTANT: Generate exactly {question_count} quiz questions."
    
    result = quiz_agent.invoke(
        {"messages": [{"role": "user", "content": enhanced_query}], "user_id": user_id, "question_count": question_count}
    )
    msgs = result["messages"]
    return msgs[-1].content

