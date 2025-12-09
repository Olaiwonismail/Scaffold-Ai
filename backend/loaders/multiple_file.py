import os
from typing import Dict, List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyMuPDFLoader, TextLoader, YoutubeLoader
)
from tools.vector_store import vector_store
import fitz  # PyMuPDF
# from loaders.youtube_utils import process_playlist
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000, chunk_overlap=200, add_start_index=True
)

def extract_pdf_images_and_text(filepath: str) -> str:
    """Extract TEXT + EMBEDDED IMAGES (image metadata only, no OCR)"""
    doc = fitz.open(filepath)
    full_text = []
    
    for page_num, page in enumerate(doc):
        page_text = page.get_text().strip()
        if page_text:
            full_text.append(f"[Page {page_num+1}]\n{page_text}")
        
        image_list = page.get_images()
        if image_list:
            full_text.append(f"[Page {page_num+1}] Found {len(image_list)} embedded image(s)")
    
    doc.close()
    return "\n\n".join(full_text)

async def process_youtube_urls(youtube_urls: List[str]) -> Dict[str, str]:
    """Process YouTube URLs and return {url: transcript_text}"""
    results = {}
    
    for url in youtube_urls:
        print(f"Processing YouTube: {url}")
        try:
        #     if 'playlist' in url.lower():
        #         loader = YoutubePlaylistLoader(url, language_code="en")
        #     else:
            loader = YoutubeLoader.from_youtube_url(
            url, add_video_info=False
            )
            # loader = YoutubeLoader(url, language_code="en")
            
            docs = loader.load()
            chunks = text_splitter.split_documents(docs)
            chunk_text = "\n\n".join([chunk.page_content for chunk in chunks])
            results[url] = chunk_text
        except Exception as e:
            print(f"YouTube error {url}: {e}")
            results[url] = f"[ERROR: {e}]"
    
    return results

async def chunk_directory(directory_path: str, youtube_urls: List[str] = None) -> Dict[str, str]:
    """Process files + YouTube URLs. Returns {filename_or_url: chunk_text}"""
    results = {}
    
    # Process local files
    for filename in os.listdir(directory_path):
        if filename.endswith(('.pdf', '.txt', '.docx')):
            filepath = os.path.join(directory_path, filename)
            
            if filename.endswith('.pdf'):
                print(filename)
                full_content = extract_pdf_images_and_text(filepath)
                chunks = text_splitter.create_documents([full_content])
                chunk_text = "\n\n".join([chunk.page_content for chunk in chunks])
            else:
                loader = TextLoader(filepath)
                docs = loader.load()
                chunks = text_splitter.split_documents(docs)
                chunk_text = "\n\n".join([chunk.page_content for chunk in chunks])
            
            results[filename] = chunk_text
    
    # ✅ Process YouTube URLs if provided
    if youtube_urls:
        yt_results = await process_youtube_urls(youtube_urls)
        results.update(yt_results)
    
    return results

async def load_directory(directory_path: str, youtube_urls: List[str] = None):
    """Load files + YouTube to vector store"""
    document_ids_list = []
    
    # Local files
    for filename in os.listdir(directory_path):
        if filename.endswith(('.pdf', '.txt', '.docx')):
            filepath = os.path.join(directory_path, filename)
            
            if filename.endswith('.pdf'):
                print(filename)
                full_content = extract_pdf_images_and_text(filepath)
                chunks = text_splitter.create_documents([full_content])
            else:
                loader = TextLoader(filepath)
                docs = loader.load()
                chunks = text_splitter.split_documents(docs)
            
            document_ids = vector_store.add_documents(documents=chunks)
            document_ids_list.append(document_ids)
    
    # ✅ YouTube URLs
    if youtube_urls:
        yt_results = await process_youtube_urls(youtube_urls)
        for url, chunk_text in yt_results.items():
            chunks = text_splitter.create_documents([chunk_text])
            document_ids = vector_store.add_documents(documents=chunks)
            document_ids_list.append(document_ids)
    
    print(document_ids_list[:3])
    return str(document_ids_list[:3])