
from langchain.chat_models import init_chat_model

import dotenv
dotenv.load_dotenv()


model = init_chat_model("google_genai:gemini-2.5-flash-lite")
