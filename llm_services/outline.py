from langchain_core.tools import tool
# Keep your existing imports
from tools.outline_tool import DocumentOutline, submit_outline
from tools.model import model
from tools.dynamic_prompt import prompt_with_context
from langchain.agents import create_agent
from typing import Optional
from pydantic import BaseModel, Field

from loaders.multiple_file import chunk_directory
agent = create_agent(model, tools=[submit_outline], middleware=[prompt_with_context])
def create_outline():
    chunk_text = chunk_directory("./documents")
    print('chunk_text')
    agent = create_agent(model, tools=[submit_outline], middleware=[prompt_with_context])

    # chunk_text = "\n\n".join([chunk.page_content for chunk in chunks[:5]])
    # Force the model to use the tool
    query = f"""Analyze the provided document text and extract a HIGH-LEVEL Table of Contents.

IMPORTANT:
1. Use the 'submit_outline' tool.
2. Extract only Topics and Sub-headers.
    
    3. Do NOT reply with conversational text or Markdown. 
    4. Only output the tool call.

    Document:
    {chunk_text}"""

    print("🚀 Agent is running...")
    final_outline = None

    for step in agent.stream(
        {"messages": [{"role": "user", "content": query}]},
        stream_mode="values",
    ):
        last_message = step["messages"][-1]
        
        # 1. Check for Tool Calls (Success Path)
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            print(f"🛠️  Tool Call Detected: {last_message.tool_calls[0]['name']}")
            for tool_call in last_message.tool_calls:
                if tool_call['name'] == 'submit_outline':
                    try:
                        final_outline = DocumentOutline(**tool_call['args'])
                        print("✅ Structure parsed successfully.")
                    except Exception as e:
                        print(f"❌ Parsing Error: {e}")
        
        # 2. Check for Text Content (Failure Path - Debugging)
        elif last_message.content and last_message.type == "ai":
            print("\n⚠️  The Agent replied with text instead of using the tool:")
            print(f"'{last_message.content[:200]}...'") # Print first 200 chars

    # --- Final Output ---
    if final_outline:
        print(final_outline)
        print("\n" + "="*40)
        print("       FINAL EXTRACTED OUTLINE")
        print("="*40)
        for topic in final_outline.topics:
            print(f"\n📌 {topic.title}")
            if topic.subtopics:
                for subtopic in topic.subtopics:
                    print(f"   ├─ {subtopic}")
            else:
                print("   (No subtopics)")
    else:
        print("\n❌ Extraction Failed.") 
        print("If you see text above in the 'The Agent replied...' section, the model ignored the tool.")
    return final_outline
    