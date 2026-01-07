from llm_services.bot import tutor, quiz, ask_chatbot
from llm_services.outline import create_outline, merge_outlines
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from typing import List, Optional
import tempfile
import os
import shutil
import asyncio
import json
from loaders.multiple_file import load_directory
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS configuration - must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://studylabs-beta.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# query ="""topic: Algebra of Complex Numbers ,subtopic : Multiplication"""
# tutor(query)
# # create_outline()
# from loaders.multiple_file import save_directory
# save_directory('./documents')

import json

def clean_and_parse_json(ai_response_text):
    # 1. Remove the "```json" from the start
    clean_text = ai_response_text.replace("```json", "")
    
    # 2. Remove the "```" from the end
    clean_text = clean_text.replace("```", "")
    
    # 3. Strip leading/trailing whitespace
    clean_text = clean_text.strip()
    
    # 4. Parse
    try:
        return json.loads(clean_text)
    except json.JSONDecodeError as e:
        print(f"JSON Error: {e}")
        return None

# usage:
# raw_ai_response = client.chat.completions.create(...)
# lesson_data = clean_and_parse_json(raw_ai_response)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}
from pydantic import BaseModel

class Query(BaseModel):
    text: str
    adapt: str
    analogy: Optional[str] = ''
    user_id: str

class QueryB(BaseModel):
    text: str
    user_id: str

class QuizQuery(BaseModel):
    text: str
    user_id: str
    question_count: int = 5  # Default to 5 questions


@app.post("/quizes")
async def quizes(payload: QuizQuery):
    cards = await quiz(payload.text, payload.user_id, payload.question_count)
    result = clean_and_parse_json(cards)
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to generate quiz content")
    return result


@app.post("/tutor")
async def tutor_endpoint(payload: Query):
    data = await tutor(payload.text, payload.adapt, payload.analogy, payload.user_id)
    print(payload)
    result = clean_and_parse_json(data)
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to generate lesson content")
    return result

@app.post('/chatbot')    
async def chatbot(payload: QueryB):
    data = await ask_chatbot(payload.text, payload.user_id)
    print(data)
    return data
    


@app.post("/upload_pdfs/")
async def upload_pdfs(
    files: List[UploadFile] = File(None), 
    urls: str = Form(None),
    user_id: str = Form(...)
):
    youtube_urls = []
    if urls:
        # Assume URLs are comma-separated; split and strip whitespace
        youtube_urls = [url.strip() for url in urls.split(",") if url.strip()]
    
    if not files and not youtube_urls:
        raise HTTPException(status_code=400, detail="No files or URLs provided.")

    # Create a temporary directory only if files are uploaded
    temp_dir = None
    saved_files = []

    if files:
        temp_dir = tempfile.mkdtemp(prefix="uploaded_pdfs_")
        try:
            for file in files:
                if file.content_type != "application/pdf":
                    raise HTTPException(
                        status_code=400,
                        detail=f"File '{file.filename}' is not a PDF."
                    )
                contents = await file.read()
                file_path = os.path.join(temp_dir, file.filename)
                with open(file_path, "wb") as f:
                    f.write(contents)
                saved_files.append(file.filename)

            # Pass the temp_dir and user_id to processing functions
            data = await create_outline(temp_dir, youtube_urls, user_id)
            result = await load_directory(temp_dir, youtube_urls, user_id)
            
        finally:
            # Clean up temp directory after processing
            if temp_dir:
                shutil.rmtree(temp_dir, ignore_errors=True)
    else:
        # Only YouTube URLs provided
        temp_dir = tempfile.mkdtemp(prefix="youtube_only_")
        try:
            data = await create_outline(temp_dir, youtube_urls, user_id)
            result = await load_directory(temp_dir, youtube_urls, user_id)
        finally:
            if temp_dir:
                shutil.rmtree(temp_dir, ignore_errors=True)
    
    return data


@app.post("/update_outline/")
async def update_outline(
    files: List[UploadFile] = File(None), 
    urls: str = Form(None),
    user_id: str = Form(...),
    existing_outline: str = Form(...)
):
    """
    Update an existing outline with new files/URLs.
    Uses LLM-assisted merging to intelligently combine content.
    """
    youtube_urls = []
    if urls:
        youtube_urls = [url.strip() for url in urls.split(",") if url.strip()]
    
    if not files and not youtube_urls:
        raise HTTPException(status_code=400, detail="No new files or URLs provided.")

    # Parse existing outline
    try:
        existing_outline_data = json.loads(existing_outline)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid existing_outline JSON.")

    temp_dir = None
    saved_files = []

    if files:
        temp_dir = tempfile.mkdtemp(prefix="update_pdfs_")
        try:
            for file in files:
                if file.content_type != "application/pdf":
                    raise HTTPException(
                        status_code=400,
                        detail=f"File '{file.filename}' is not a PDF."
                    )
                contents = await file.read()
                file_path = os.path.join(temp_dir, file.filename)
                with open(file_path, "wb") as f:
                    f.write(contents)
                saved_files.append(file.filename)

            # Merge outlines and add new documents
            merged_outline = await merge_outlines(temp_dir, youtube_urls, existing_outline_data, user_id)
            result = await load_directory(temp_dir, youtube_urls, user_id)
            
        finally:
            if temp_dir:
                shutil.rmtree(temp_dir, ignore_errors=True)
    else:
        # Only YouTube URLs
        temp_dir = tempfile.mkdtemp(prefix="youtube_update_")
        try:
            merged_outline = await merge_outlines(temp_dir, youtube_urls, existing_outline_data, user_id)
            result = await load_directory(temp_dir, youtube_urls, user_id)
        finally:
            if temp_dir:
                shutil.rmtree(temp_dir, ignore_errors=True)
    
    return merged_outline