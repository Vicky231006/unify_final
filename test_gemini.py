import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print("Available models:")
for model in client.models.list():
    if "generateContent" in getattr(model, "supported_generation_methods", []):
         print(f" - {model.name}")
    elif hasattr(model, 'name'):
         print(f" * {model.name}")
