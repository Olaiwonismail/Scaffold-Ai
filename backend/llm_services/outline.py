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
import math

async def get_batch_summary(agent, batch_text: str, batch_id: int) -> str:
    """Helper: Asks the agent to summarize the themes in a chunk of text."""
    query = f"""Scan the following text content and list the Key Topics, Themes, and Concepts found. 
    Be concise. This is part {batch_id} of a larger document set.
    
    TEXT CONTENT:
    {batch_text}"""
    
    # Simple text extraction - we don't need the tool here, just the text response
    # We iterate the stream to get the final answer
    response_content = ""
    print(f"   ... Analyzing Batch {batch_id} ...")
    
    async for step in agent.astream( # Assuming astream for async, or use stream if synchronous wrapper
        {"messages": [{"role": "user", "content": query}]},
        stream_mode="values",
    ):
        last_msg = step["messages"][-1]
        if last_msg.content:
            response_content = last_msg.content
            
    return response_content

async def create_outline(dir: str, youtube_urls: List[str] = None) -> Optional[DocumentOutline]:
    """✅ Scalable Outline Creator (Map-Reduce)"""
    print("🚀 Processing ALL files...")
    
    # 1. Get ALL file chunks
    all_chunks = await chunk_directory(dir, youtube_urls)
    print(f'Found {len(all_chunks)} files')
    
    # 2. CONFIGURATION
    # Adjust this based on your model's limits (e.g., 40k chars is roughly 10k tokens)
    MAX_BATCH_CHARS = 40000 
    
    current_batch_text = ""
    file_summaries = []
    batch_count = 1
    
    # 3. MAP PHASE: Iterate and Summarize Batches
    print(f"🔄 Starting MAP phase (Summarizing content in batches of ~{MAX_BATCH_CHARS/1000:.0f}k chars)...")
    
    for filename, chunk_text in all_chunks.items():
        formatted_text = f"\n\n=== SOURCE: {filename} ===\n{chunk_text}"
        
        # Check if adding this file exceeds our batch limit
        if len(current_batch_text) + len(formatted_text) > MAX_BATCH_CHARS:
            # Batch is full -> Summarize it
            summary = await get_batch_summary(agent, current_batch_text, batch_count)
            file_summaries.append(f"--- BATCH {batch_count} SUMMARY ---\n{summary}")
            
            # Reset
            batch_count += 1
            current_batch_text = formatted_text # Start new batch with current file
        else:
            current_batch_text += formatted_text

    # Process the final remaining batch
    if current_batch_text:
        summary = await get_batch_summary(agent, current_batch_text, batch_count)
        file_summaries.append(f"--- BATCH {batch_count} SUMMARY ---\n{summary}")

    # Combine all summaries
    master_context = "\n\n".join(file_summaries)
    print(f"📚 Reduced {len(all_chunks)} files into {len(file_summaries)} condensed summary blocks.")

    # 4. REDUCE PHASE: One LLM Call for Master Outline
    # Now we feed the *Summaries* to the tool, not the raw text.
    query = f"""Analyze the provided SUMMARIES of a large document set and create a unified Table of Contents.

IMPORTANT:
1. Use the 'submit_outline' tool.
2. The input below is a collection of SUMMARIES from many files.
3. Synthesize these summaries into a single cohesive structure.
4. Merge similar topics from different batches.
5. Create a global structure that makes sense of the whole dataset.
6. Only output the tool call.

SUMMARIES FROM ALL FILES:
{master_context}"""

    print("🚀 Agent is generating Final Master Outline...")
    final_outline = None

    # Note: Assuming 'agent' is available in scope or passed in
    async for step in agent.astream(
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
            # Optional: Print only if it's not an empty intermediate thought
            if len(last_message.content) > 5:
                print(f"🤖 Agent thought: {last_message.content[:100]}...")

    # --- Final Output ---
    if final_outline:
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
    
    return final_outline