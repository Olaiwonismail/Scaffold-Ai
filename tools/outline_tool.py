from typing import Optional
from pydantic import BaseModel, Field
from langchain_core.tools import tool

# 1. Define the Schema
class OutlineNode(BaseModel):
    title: str = Field(description="Main topic title ")
    summary: str = Field(None, description="Brief summary of this section")
    # 👇 FORCE the model to look for bullet points
    subtopics: list[str] = Field(
        default_factory=list, 
        description="List of short sub-headers only (1-5 words). Exclude specific examples, formulas, and definitions."
    )

class DocumentOutline(BaseModel):
    topics: list[OutlineNode] = Field(description="List of extracted topics")

# 2. Define the Tool
@tool(args_schema=DocumentOutline)
def submit_outline(topics: list[OutlineNode]):
    """Submit the extracted outline."""
    return topics