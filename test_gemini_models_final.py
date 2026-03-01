import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Testing with key ending in: {api_key[-4:]}")
client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=["Hello!"],
    )
    print(f"SUCCESS with gemini-2.0-flash: {response.text}")
except Exception as e:
    print(f"FAILED with gemini-2.0-flash: {str(e)}")
