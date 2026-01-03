from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_qdrant import QdrantVectorStore
from tools.embeddings import embeddings
import os
import dotenv
dotenv.load_dotenv()
# 1. Initialize ONLY the Cloud Client
client = QdrantClient(
    url=os.getenv("QdrantClient_url"), 
    api_key=os.getenv("QdrantClient_api_key")
)

# 2. Get vector size dynamically
vector_size = len(embeddings.embed_query("sample text"))

# 3. Create the collection ON THE CLOUD if it doesn't exist
if not client.collection_exists("test"):
    print("Creating collection 'test' on Cloud...")
    client.create_collection(
        collection_name="test",
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
    )
else:
    print("Collection 'test' already exists on Cloud.")

# 4. Initialize Vector Store using the SAME client
vector_store = QdrantVectorStore(
    client=client,
    collection_name="test",
    embedding=embeddings,
)

print("Vector Store successfually connected to Cloud!")