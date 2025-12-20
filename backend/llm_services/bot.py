import json
import re
from tools.model import model
from tools.dynamic_prompt import prompt_with_context, get_lessons, get_quiz, doc
from langchain.agents import create_agent

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


async def ask_chatbot(query: str):
    print(query)
    response = agent.invoke(
        {"messages": [{"role": "user", "content": query}]}
    )
    return response["messages"][1].content


async def tutor(query: str, adapt: str, analogy: str):
    query = (
        f"Act as a tutur the user understanding out of ten is {adapt} where 10 is firm grasp "
        f"of the concept and 0 is absolutely no idea what the concept is for analogy here is "
        f"some info about the user {analogy}  if no info is pprovided use a suitable one {query}"
    )
    result = tutor_agent.invoke({"messages": [{"role": "user", "content": query}]})
    msgs = result["messages"]
    raw = msgs[-1].content

    images = _extract_image_data_urls(doc.get("item"))
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


async def quiz(query: str):
    result = quiz_agent.invoke(
        {"messages": [{"role": "user", "content": {query}}]}
    )
    msgs = result["messages"]
    return msgs[-1].content

