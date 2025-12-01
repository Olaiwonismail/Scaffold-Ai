import os
import dotenv

loaded = dotenv.load_dotenv()
key = os.getenv("GOOGLE_API_KEY")

print(f"Dotenv loaded: {loaded}")
if key:
    print(f"Key found: {key[:5]}...{key[-5:]}")
else:
    print("❌ No API Key found.")
