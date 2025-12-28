
# from langchain.chat_models import init_chat_model

import dotenv
dotenv.load_dotenv()


import os
from langchain_google_genai import ChatGoogleGenerativeAI


model = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")