import os
import traceback
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env from project root
# Using resolve() to ensure we have the absolute path
current_dir = Path(__file__).parent.resolve()
env_path = current_dir.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

app = FastAPI()

# Configure CORS - being more permissive for development
# IMPORTANT: If allow_origins is ["*"], allow_credentials must be False
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"DEBUG: GEMINI_API_KEY found: {'Yes' if GEMINI_API_KEY else 'No'}")
print(f"DEBUG: Looking for .env at: {env_path}")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    try:
        print("DEBUG: Available Gemini Models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f" - {m.name}")
    except Exception as e:
        print(f"DEBUG: Could not list models (Network/Auth error?): {e}")

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    context: Optional[str] = None

SYSTEM_PROMPT = """
You are a 'Motivational Manager' assistant for a business dashboard. 
Your tone is professional yet highly encouraging and supportive, like a great mentor or a world-class manager.
Your goals are:
1. Help the user manage tasks and interpret dashboard data.
2. Summarize what's on the screen (provided in context) if asked.
3. Keep the user motivated and focused on their goals.

CRITICAL RULES:
- ONLY answer questions related to the dashboard, business management, productivity, or the current screen content.
- If the user asks an irrelevant question (e.g., recipes, sports, general trivia), politely but firmly decline, stating that you're here to help them crush their business goals and stay focused.
- Use positive reinforcement and professional encouragement.
- Keep summaries concise and actionable.

Current Screen Context:
{context}
"""

@app.get("/")
async def root():
    return {"status": "online", "message": "Dashboard Assistant Backend (Gemini 2.5/2.0)"}

@app.post("/chat")
async def chat(request: ChatRequest):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "":
        print("CRITICAL: GEMINI_API_KEY not found or empty in .env")
        raise HTTPException(
            status_code=500, 
            detail="GEMINI_API_KEY missing. Please add it to your .env file at the project root."
        )

    try:
        # Prepare context and system prompt
        context_str = request.context or "No context provided."
        full_system_prompt = SYSTEM_PROMPT.format(context=context_str)
        
        # Format history for google-generativeai SDK
        history = []
        for msg in request.messages[:-1]:
            role = "user" if msg.role == "user" else "model"
            history.append({"role": role, "parts": [msg.content]})
            
        # Try multiple model name variants
        models_to_try = [
            'gemini-2.5-flash',
            'models/gemini-2.5-flash',
            'gemini-2.0-flash',
            'models/gemini-2.0-flash',
            'gemini-1.5-flash', 
            'models/gemini-1.5-flash',
            'gemini-pro'
        ]
        
        last_exception = None
        for model_name in models_to_try:
            try:
                print(f"DEBUG: Attempting to use model: {model_name}")
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=full_system_prompt
                )
                chat_session = model.start_chat(history=history)
                last_message = request.messages[-1].content
                response = chat_session.send_message(last_message)
                return {"response": response.text}
            except Exception as e:
                print(f"DEBUG: Model {model_name} failed: {e}")
                last_exception = e
                # If its just a 404/not found, continue to next model
                continue
        
        # If all fail
        raise last_exception

    except Exception as e:
        print(f"CHAT ERROR: {str(e)}")
        traceback.print_exc()
        
        # Friendly hints for common errors
        err_str = str(e)
        if "404" in err_str:
            err_str = f"Gemini model not found. Ensure your API key has access to these specific models. {err_str}"
        elif "API_KEY_INVALID" in err_str:
            err_str = "Invalid API Key. Check the GEMINI_API_KEY in your .env file."
            
        raise HTTPException(status_code=500, detail=err_str)

if __name__ == "__main__":
    import uvicorn
    # Use string reference for reload
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
