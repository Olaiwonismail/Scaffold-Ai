from langchain_core.tools import tool
from tools.outline_tool import DocumentOutline, OutlineNode, submit_outline
from tools.model import model
from tools.dynamic_prompt import prompt_with_context
from langchain.agents import create_agent
from loaders.multiple_file import chunk_directory
from typing import Optional, List, Dict
import asyncio
import json
from tqdm.asyncio import tqdm

# Create agent ONCE globally
agent = create_agent(model, tools=[submit_outline], middleware=[prompt_with_context])
import math

async def get_batch_summary(agent, batch_text: str, batch_id: int, user_id: str = None) -> str:
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
        {"messages": [{"role": "user", "content": query}], "user_id": user_id},
        stream_mode="values",
    ):
        last_msg = step["messages"][-1]
        if last_msg.content:
            response_content = last_msg.content
            
    return response_content

async def create_outline(dir: str, youtube_urls: List[str] = None, user_id: str = None) -> Optional[DocumentOutline]:
    """✅ Scalable Outline Creator (Map-Reduce)"""
    print(f"🚀 Processing ALL files for user: {user_id}...")
    
    # 1. Get ALL file chunks
    all_chunks = await chunk_directory(dir, youtube_urls)
    print(f'Found {len(all_chunks)} files')
    
    # 2. CONFIGURATION
    # Adjust this based on your model's limits (e.g., 40k chars is roughly 10k tokens)
    MAX_BATCH_CHARS = 50000 
    
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
            summary = await get_batch_summary(agent, current_batch_text, batch_count, user_id)
            file_summaries.append(f"--- BATCH {batch_count} SUMMARY ---\n{summary}")
            
            # Reset
            batch_count += 1
            current_batch_text = formatted_text # Start new batch with current file
        else:
            current_batch_text += formatted_text

    # Process the final remaining batch
    if current_batch_text:
        summary = await get_batch_summary(agent, current_batch_text, batch_count, user_id)
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
        {"messages": [{"role": "user", "content": query}], "user_id": user_id},
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


async def merge_outlines(
    dir: str, 
    youtube_urls: List[str] = None, 
    existing_outline: Dict = None,
    user_id: str = None
) -> Optional[DocumentOutline]:
    """
    Merge new content with an existing outline using LLM-assisted intelligent merging.
    
    This function:
    1. Processes new files/URLs to extract their content
    2. Summarizes the new content
    3. Uses LLM to intelligently merge with existing outline (deduplicating, reorganizing)
    """
    print(f"🔄 Processing NEW files for outline merge (user: {user_id})...")
    
    # 1. Get chunks from new files
    all_chunks = await chunk_directory(dir, youtube_urls)
    
    if not all_chunks:
        print("⚠️ No new content found, returning existing outline")
        if existing_outline:
            return DocumentOutline(**existing_outline)
        return None
    
    print(f'Found {len(all_chunks)} new files/sources')
    
    # 2. Summarize new content (same MAP phase as create_outline)
    MAX_BATCH_CHARS = 50000
    current_batch_text = ""
    new_summaries = []
    batch_count = 1
    
    print(f"🔄 Summarizing new content in batches...")
    
    for filename, chunk_text in all_chunks.items():
        formatted_text = f"\n\n=== NEW SOURCE: {filename} ===\n{chunk_text}"
        
        if len(current_batch_text) + len(formatted_text) > MAX_BATCH_CHARS:
            summary = await get_batch_summary(agent, current_batch_text, batch_count, user_id)
            new_summaries.append(f"--- NEW BATCH {batch_count} SUMMARY ---\n{summary}")
            batch_count += 1
            current_batch_text = formatted_text
        else:
            current_batch_text += formatted_text

    if current_batch_text:
        summary = await get_batch_summary(agent, current_batch_text, batch_count, user_id)
        new_summaries.append(f"--- NEW BATCH {batch_count} SUMMARY ---\n{summary}")

    new_context = "\n\n".join(new_summaries)
    print(f"📚 Summarized {len(all_chunks)} new files into {len(new_summaries)} summary blocks.")

    # 3. Convert existing outline to readable format
    existing_outline_text = ""
    if existing_outline and "topics" in existing_outline:
        existing_topics = []
        for topic in existing_outline["topics"]:
            topic_str = f"📌 {topic.get('title', 'Untitled')}"
            if topic.get('summary'):
                topic_str += f"\n   Summary: {topic['summary']}"
            if topic.get('subtopics'):
                for sub in topic['subtopics']:
                    topic_str += f"\n   ├─ {sub}"
            existing_topics.append(topic_str)
        existing_outline_text = "\n\n".join(existing_topics)

    # 4. MERGE PHASE: LLM intelligently combines outlines
    merge_query = f"""You are merging a NEW document set with an EXISTING course outline.

EXISTING OUTLINE:
{existing_outline_text if existing_outline_text else "(No existing outline - create new)"}

SUMMARIES FROM NEW FILES:
{new_context}

INSTRUCTIONS:
1. Use the 'submit_outline' tool to submit the merged outline.
2. MERGE the new content intelligently with the existing outline.
3. DEDUPLICATE: If new topics overlap with existing ones, combine them (don't create duplicates).
4. REORGANIZE: Place new topics in logical positions within the existing structure.
5. PRESERVE: Keep existing topics that are still relevant.
6. ADD: Include genuinely new topics from the new content.
7. Create a cohesive, well-organized structure.
8. Only output the tool call."""

    print("🚀 Agent is merging outlines...")
    merged_outline = None

    async for step in agent.astream(
        {"messages": [{"role": "user", "content": merge_query}], "user_id": user_id},
        stream_mode="values",
    ):
        last_message = step["messages"][-1]
        
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            print(f"🛠️  Tool Call Detected: {last_message.tool_calls[0]['name']}")
            for tool_call in last_message.tool_calls:
                if tool_call['name'] == 'submit_outline':
                    try:
                        merged_outline = DocumentOutline(**tool_call['args'])
                        print("✅ Merged outline parsed successfully.")
                    except Exception as e:
                        print(f"❌ Parsing Error: {e}")
        
        elif last_message.content and last_message.type == "ai":
            if len(last_message.content) > 5:
                print(f"🤖 Agent thought: {last_message.content[:100]}...")

    # --- Final Output ---
    if merged_outline:
        print("\n" + "="*60)
        print("       MERGED OUTLINE")
        print("="*60)
        for topic in merged_outline.topics:
            print(f"\n📌 {topic.title}")
            if topic.subtopics:
                for subtopic in topic.subtopics:
                    print(f"   ├─ {subtopic}")
            else:
                print("   (No subtopics)")
    else:
        print("\n❌ Merge Failed.") 
    
    return merged_outline