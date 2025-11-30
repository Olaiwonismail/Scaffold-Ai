from llm_services.bot import ask_chatbot,tutor
from llm_services.outline import create_outline
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



@app.post("/tutor")
def tutor_endpoint(payload: Query):
    # query ="""topic: Algebra of Complex Numbers ,subtopic : Multiplication"""
    data = tutor(payload.text,payload.adapt)
    return clean_and_parse_json(data)
    # return {"you_sent": payload.text}

@app.get('/outline')    
def outline():
    data = create_outline()
    return data
