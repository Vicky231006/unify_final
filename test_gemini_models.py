import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

models_to_try = [
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash"
]

for m in models_to_try:
    print(f"Testing {m}...")
    try:
        response = client.models.generate_content(
            model=m,
            contents=["Hello!"],
        )
        print(f"SUCCESS with {m}: {response.text}")
    except Exception as e:
        print(f"FAILED with {m}: {str(e)}")
