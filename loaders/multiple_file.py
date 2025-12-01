import os
from typing import Optional

from typing import Optional
# from pydantic import BaseModel, Field
from tools.vector_store import vector_store

# class FileOutline(BaseModel):
#     filename: str
#     topics: list[OutlineNode]

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader, TextLoader


# Split into manageable chunks
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,           # Adjust based on content
    chunk_overlap=200,         # Overlap helps maintain context
    add_start_index=True
)

def save_directory(directory_path: str):
   
    
    for filename in os.listdir(directory_path):
        if filename.endswith(('.pdf', '.txt', '.docx')):
            filepath = os.path.join(directory_path, filename)
            
            # Load document
            if filename.endswith('.pdf'):
                loader = PyMuPDFLoader(filepath)
            else:
                loader = TextLoader(filepath)
            
            docs = loader.load()
            chunks = text_splitter.split_documents(docs)
            document_ids = vector_store.add_documents(documents=chunks)
 
            print(document_ids[:3])
            
            # Extract outline
            # chunk_text = "\n\n".join([c.page_content for c in chunks])
#             outline = structured_llm.invoke(
#                 f"Extract the main topics and subtopics from this document:\n{chunk_text}"
#             )
            
#             outlines.append(FileOutline(filename=filename, topics=outline.topics))
    
#     return outlines

# # Create outlines for all files
# all_outlines = outline_directory("./documents")
async def chunk_directory(directory_path: str):
    """Create outlines for all documents in a directory"""
    
    for filename in os.listdir(directory_path):
        if filename.endswith(('.pdf', '.txt', '.docx')):
            filepath = os.path.join(directory_path, filename)
            
            # Load document
            if filename.endswith('.pdf'):
                print(filename)
                loader = PyMuPDFLoader(filepath)
            else:
                loader = TextLoader(filepath)
            
            docs = loader.load()
            chunks = text_splitter.split_documents(docs)
            # document_ids = vector_store.add_documents(documents=chunks)
            chunk_text = "\n\n".join([chunk.page_content for chunk in chunks])
         

            with open(f"{my_id}.txt", "w") as f:
                f.write(chunk_text)


    return chunk_text
            
    
async def load_directory(directory_path: str):
    """Create outlines for all documents in a directory"""
    
    for filename in os.listdir(directory_path):
        if filename.endswith(('.pdf', '.txt', '.docx')):
            filepath = os.path.join(directory_path, filename)
            
            # Load document
            if filename.endswith('.pdf'):
                print(filename)
                loader = PyMuPDFLoader(filepath)
            else:
                loader = TextLoader(filepath)
            
            docs = loader.load()
            chunks = text_splitter.split_documents(docs)
            document_ids = vector_store.add_documents(documents=chunks)
            # chunk_text = "\n\n".join([chunk.page_content for chunk in chunks])
    print(document_ids[:3])
    return str(document_ids[:3])
            
