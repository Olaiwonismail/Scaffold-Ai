
# from langchain.chat_models import init_chat_model

import dotenv
dotenv.load_dotenv()


from langchain_google_vertexai import ChatVertexAI

model = ChatVertexAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_tokens=None,
    max_retries=6,
    stop=None,
    # other params...
)