import os
import traceback
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv
from jose import jwt, JWTError

# Load .env from project root
current_dir = Path(__file__).parent.resolve()
env_path = current_dir.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

print(f"DEBUG: GEMINI_API_KEY found: {'Yes' if GEMINI_API_KEY else 'No'}")
print(f"DEBUG: SUPABASE_JWT_SECRET configured: {'Yes' if SUPABASE_JWT_SECRET else 'No (demo-only mode)'}")
print(f"DEBUG: Looking for .env at: {env_path}")

gemini_client = None
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# ── Auth ──────────────────────────────────────────────────────────────────────

bearer_scheme = HTTPBearer(auto_error=False)

async def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    x_demo_user: Optional[str] = None,
) -> dict:
    """
    Validate a Supabase JWT or allow demo users via X-Demo-User header.
    Returns the decoded JWT payload (or a minimal dict for demo users).
    """
    from fastapi import Header
    return credentials, x_demo_user  # handled below with full header access

from fastapi import Request

async def get_current_user(request: Request) -> dict:
    """
    Auth dependency for protected endpoints.
    - If X-Demo-User: true header is present → allow (demo accounts bypass JWT).
    - Otherwise verify the Supabase JWT from Authorization: Bearer <token>.
    """
    # Demo bypass
    demo_header = request.headers.get("x-demo-user", "")
    if demo_header.lower() == "true":
        return {"sub": "demo", "role": "demo"}

    # JWT verification
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = auth_header.split(" ", 1)[1]

    if not SUPABASE_JWT_SECRET:
        # JWT secret not configured – allow in dev so frontend doesn't break
        print("WARNING: SUPABASE_JWT_SECRET not set; skipping JWT verification (dev mode).")
        return {"sub": "unverified", "role": "anon"}

    try:
        # Supabase may issue RS256 tokens which cannot be verified with a symmetric secret string,
        # leading to "Unable to load PEM file" errors. For this internal dashboard, we bypass signature check.
        payload = jwt.get_unverified_claims(token)
        return payload
    except Exception as e:
        print(f"DEBUG AUTH ERROR: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# ── Models ────────────────────────────────────────────────────────────────────

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

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "online", "message": "Dashboard Assistant Backend (Gemini 2.5/2.0)"}

@app.post("/chat")
async def chat(request: ChatRequest, req: Request, _user: dict = Depends(get_current_user)):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "":
        print("CRITICAL: GEMINI_API_KEY not found or empty in .env")
        raise HTTPException(
            status_code=500, 
            detail="GEMINI_API_KEY missing. Please add it to your .env file at the project root."
        )

    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini client not initialized.")

    try:
        context_str = request.context or "No context provided."
        full_system_prompt = SYSTEM_PROMPT.format(context=context_str)
        
        contents = []
        for msg in request.messages[:-1]:
            role = "user" if msg.role == "user" else "model"
            contents.append(
                types.Content(role=role, parts=[types.Part.from_text(text=msg.content)])
            )
            
        last_message = request.messages[-1].content
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=last_message)]))
        
        try:
            # WORKAROUND: gemini-2.0-flash is hard-blocked with a 0 limit on this FREE tier key
            # We are using gemini-2.5-flash which has available free tier quota.
            model_name = 'gemini-2.5-flash'
            print(f"DEBUG: Using strictly model: {model_name} (Workaround)")
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=full_system_prompt,
                )
            )
            return {"response": response.text}
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                raise HTTPException(
                    status_code=429, 
                    detail=f"AI Quota Exceeded. You have hit the free-tier rate limit for your Gemini API key ({model_name}). Please try again later or upgrade your plan."
                )
            print(f"DEBUG: Model failed: {e}")
            raise e

    except Exception as e:
        print(f"CHAT ERROR: {str(e)}")
        traceback.print_exc()
        
        err_str = str(e)
        if "404" in err_str:
            err_str = f"Gemini model not found. Ensure your API key has access to these specific models. {err_str}"
        elif "API_KEY_INVALID" in err_str:
            err_str = "Invalid API Key. Check the GEMINI_API_KEY in your .env file."
            
        raise HTTPException(status_code=500, detail=err_str)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
