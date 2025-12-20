import os
import base64
import asyncio
import json
from typing import Dict, List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyMuPDFLoader, TextLoader, YoutubeLoader
)
from langchain_core.documents import Document
from tools.vector_store import vector_store
import fitz  # PyMuPDF
# from loaders.youtube_utils import process_playlist

# Define directory for saving images
DOCUMENTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "documents")
IMAGES_DIR = os.path.join(DOCUMENTS_DIR, "images")
os.makedirs(IMAGES_DIR, exist_ok=True)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000, chunk_overlap=200, add_start_index=True
)

def extract_pdf_images_and_text(filepath: str) -> List[Document]:
    """Extract TEXT + EMBEDDED IMAGES (saved to disk, paths in metadata)"""
    doc = fitz.open(filepath)
    documents = []
    
    pdf_filename = os.path.basename(filepath)
    pdf_name_stem = os.path.splitext(pdf_filename)[0]
    
    for page_num, page in enumerate(doc):
        page_text = page.get_text().strip()
        
        # Extract images
        images = []
        image_list = page.get_images(full=True)
        if image_list:
            for idx, img in enumerate(image_list, start=1):
                xref = img[0]
                try:
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image.get("ext", "png")
                    
                    # Save image to disk
                    image_name = f"{pdf_name_stem}_p{page_num+1}_{idx}.{image_ext}"
                    image_path = os.path.join(IMAGES_DIR, image_name)
                    
                    with open(image_path, "wb") as img_file:
                        img_file.write(image_bytes)
                    
                    # Store relative URL path
                    image_url = f"/images/{image_name}"
                    images.append(image_url)
                except Exception as e:
                    print(f"Error extracting image: {e}")
        
        # Create document with text and images in metadata
        # Serialize images list to JSON string for ChromaDB compatibility
        metadata = {"source": filepath, "page": page_num + 1, "images": json.dumps(images)}
        documents.append(Document(page_content=f"[Page {page_num+1}]\n{page_text}", metadata=metadata))
    
    doc.close()
    return documents

def _process_file_sync(filepath: str):
    """Helper to process a single file synchronously."""
    filename = os.path.basename(filepath)
    if filename.endswith('.pdf'):
        print(filename)
        docs = extract_pdf_images_and_text(filepath)
        chunks = text_splitter.split_documents(docs)
    else:
        loader = TextLoader(filepath)
        docs = loader.load()
        chunks = text_splitter.split_documents(docs)
    return filename, chunks

def _process_youtube_sync(url: str):
    """Helper to process a single YouTube URL synchronously."""
    print(f"Processing YouTube: {url}")
    try:
        loader = YoutubeLoader.from_youtube_url(url, add_video_info=False)
        docs = loader.load()
        chunks = text_splitter.split_documents(docs)
        chunk_text = "\n\n".join([chunk.page_content for chunk in chunks])
        return url, chunk_text, chunks
    except Exception as e:
        print(f"YouTube error {url}: {e}")
        return url, f"[ERROR: {e}]", []

async def process_youtube_urls(youtube_urls: List[str]) -> Dict[str, str]:
    """Process YouTube URLs concurrently and return {url: transcript_text}"""
    results = {}
    tasks = [asyncio.to_thread(_process_youtube_sync, url) for url in youtube_urls]
    processed_results = await asyncio.gather(*tasks)
    
    for url, text, _ in processed_results:
        results[url] = text
    
    return results

async def chunk_directory(directory_path: str, youtube_urls: List[str] = None) -> Dict[str, str]:
    """Process files + YouTube URLs concurrently. Returns {filename_or_url: chunk_text}"""
    results = {}
    tasks = []

    # Process local files
    for filename in os.listdir(directory_path):
        if filename.endswith(('.pdf', '.txt', '.docx')):
            filepath = os.path.join(directory_path, filename)
            tasks.append(asyncio.to_thread(_process_file_sync, filepath))
    
    # Process YouTube URLs
    if youtube_urls:
        for url in youtube_urls:
            tasks.append(asyncio.to_thread(_process_youtube_sync, url))
            
    processed_items = await asyncio.gather(*tasks)

    for item in processed_items:
        if len(item) == 2: # File result: (filename, chunks)
            filename, chunks = item
            chunk_text = "\n\n".join([chunk.page_content for chunk in chunks])
            results[filename] = chunk_text
        else: # YouTube result: (url, text, chunks)
            url, text, _ = item
            results[url] = text
            
    return results

async def load_directory(directory_path: str, youtube_urls: List[str] = None):
    """Load files + YouTube to vector store concurrently"""
    document_ids_list = []
    tasks = []
    
    # Local files
    for filename in os.listdir(directory_path):
        if filename.endswith(('.pdf', '.txt', '.docx')):
            filepath = os.path.join(directory_path, filename)
            tasks.append(asyncio.to_thread(_process_file_sync, filepath))
    
    # YouTube URLs
    if youtube_urls:
        for url in youtube_urls:
            tasks.append(asyncio.to_thread(_process_youtube_sync, url))
            
    processed_items = await asyncio.gather(*tasks)
    
    # Add to vector store
    for item in processed_items:
        chunks = []
        if len(item) == 2: # File
            _, chunks = item
        else: # YouTube
            _, _, chunks = item
            
        if chunks:
            document_ids = await asyncio.to_thread(vector_store.add_documents, documents=chunks)
            document_ids_list.append(document_ids)
    
    print(document_ids_list[:3])
    return str(document_ids_list[:3])