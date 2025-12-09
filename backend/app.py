from llm_services.bot import tutor,quiz,ask_chatbot
from llm_services.outline import create_outline
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from typing import List,Optional
import tempfile
import os
import shutil
import asyncio
from loaders.multiple_file import load_directory
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

MAX_TOTAL_SIZE = 50 * 1024 * 1024 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # or ["http://localhost:3000"] for specific frontends
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}
from pydantic import BaseModel
class Query(BaseModel):
    text: str
    adapt: str
    analogy: Optional[str]=''

class QueryB(BaseModel):
    text: str


@app.post("/quizes")

async def quizes(payload: QueryB):
    cards = await quiz(payload.text) 
    return clean_and_parse_json(cards)


@app.post("/tutor")
async def tutor_endpoint(payload: Query):
    # query ="""topic: Algebra of Complex Numbers ,subtopic : Multiplication"""
    data = await tutor(payload.text,payload.adapt,payload.analogy)
    return clean_and_parse_json(data)
    # return {"you_sent": payload.text}

@app.post('/chatbot')    
async def chatbot(payload : QueryB):
    data = await ask_chatbot(payload.text)
    print(data)
    return data
    


@app.post("/upload_pdfs/")
async def upload_pdfs(files: List[UploadFile] = File(None), urls: str = Form(None)):
    youtube_urls = []
    if urls:
        # Assume URLs are comma-separated; split and strip whitespace
        youtube_urls = [url.strip() for url in urls.split(",") if url.strip()]
    
    if not files and not youtube_urls:
        raise HTTPException(status_code=400, detail="No files or URLs provided.")

    # Create a temporary directory only if files are uploaded
    temp_dir = None
    total_size = 0
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
                total_size += len(contents)

                if total_size > MAX_TOTAL_SIZE:
                    raise HTTPException(
                        status_code=400,
                        detail="Total upload size exceeds 50 MB."
                    )

                file_path = os.path.join(temp_dir, file.filename)
                with open(file_path, "wb") as f:
                    f.write(contents)
                saved_files.append(file.filename)

            # Pass the temp_dir to your async processing function
            result = await load_directory(temp_dir)
        finally:
            # Clean up temp directory after processing
            if temp_dir:
                shutil.rmtree(temp_dir, ignore_errors=True)

    # Always call create_outline with documents and URLs
    data = await create_outline("./documents", youtube_urls)
    
    return data