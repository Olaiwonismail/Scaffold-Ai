from langchain_core.tools import tool
from tools.outline_tool import DocumentOutline, submit_outline
from tools.model import model
from tools.dynamic_prompt import prompt_with_context
from langchain.agents import create_agent
from loaders.multiple_file import chunk_directory
from typing import Optional,List
import asyncio
from tqdm.asyncio import tqdm

# Create agent ONCE globally
agent = create_agent(model, tools=[submit_outline], middleware=[prompt_with_context])

async def create_outline(dir: str, youtube_urls: List[str] = None) -> Optional[DocumentOutline]:
    """✅ Creates ONE master outline from ALL files in directory"""
    print("🚀 Processing ALL files...")
    
    # Get ALL file chunks
    all_chunks = await chunk_directory(dir, youtube_urls)
    print(f'Found {len(all_chunks)} files')
    
    # ✅ COMBINE ALL FILES INTO ONE MASTER TEXT
    master_text = ""
    for filename, chunk_text in all_chunks.items():
        master_text += f"\n\n=== {filename} ===\n{chunk_text}"  # Truncate per file
    
    print(f"📚 Combined {len(all_chunks)} files into master document ({len(master_text)/1000:.1f}K tokens)")
    
    # ✅ ONE LLM CALL for master outline
    query = f"""Analyze ALL documents and create a NEW unified Table of Contents scheme.

IMPORTANT:
1. Use the 'submit_outline' tool.
2. Create NEW topics that organize content ACROSS all files
3. Merge similar topics from different files
4. Extract cross-file themes and relationships
5. Create a summary of the entire collection
6. Do NOT reply with conversational text or Markdown. 
7. Only output the tool call.

FILES ({len(all_chunks)} total):
{list(all_chunks.keys())}

MASTER DOCUMENT CONTENT:
{master_text}"""

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
                        print("✅ Master structure parsed successfully.")
                    except Exception as e:
                        print(f"❌ Parsing Error: {e}")
        
        # 2. Check for Text Content (Failure Path - Debugging)
        elif last_message.content and last_message.type == "ai":
            print("\n⚠️  The Agent replied with text instead of using the tool:")
            print(f"'{last_message.content[:200]}...'")

    # --- Final Output ---
    if final_outline:
        print(final_outline)
        print("\n" + "="*60)
        print("       MASTER OUTLINE FROM ALL FILES")
        print("="*60)
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