from langchain_community.document_loaders import PyMuPDFLoader
from tools.vector_store import vector_store
from langchain_text_splitters import RecursiveCharacterTextSplitter

file_path = "UniversityPhysicsVolume1-LR.pdf"

def load_single_pdf(file_path):
    loader = PyMuPDFLoader(file_path)

    docs = loader.load()

    print(docs[0])



    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,  # chunk size (characters)
        chunk_overlap=200,  # chunk overlap (characters)
        add_start_index=True,  # track index in original document
    )
    all_splits = text_splitter.split_documents(docs)

    print(f"Split blog post into {len(all_splits)} sub-documents.")

    document_ids = vector_store.add_documents(documents=all_splits)

    print(document_ids[:3])
