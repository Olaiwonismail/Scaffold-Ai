# # from qdrant_client.models import Distance, VectorParams
# # from langchain_qdrant import QdrantVectorStore
# # from qdrant_client import QdrantClient
# # from tools.embeddings import embeddings

# # client = QdrantClient(path="./qdrant_data")

# # vector_size = len(embeddings.embed_query("sample text"))

# # if not client.collection_exists("test"):
# #     client.create_collection(
# #         collection_name="test",
# #         vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
# #     )
# # vector_store = QdrantVectorStore(
# #     client=client,
# #     collection_name="test",
# #     embedding=embeddings,
# # )

# from langchain_pinecone import PineconeVectorStore
# from pinecone import Pinecone
import dotenv
import os
from tools.embeddings import embeddings
dotenv.load_dotenv()

# pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
# index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

# vector_store = PineconeVectorStore(embedding=embeddings, index=index)

from langchain_postgres import PGVector

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="my_docs",
    connection=os.getenv("DATABASE_URL"),
)