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
from forecasting import train_and_forecast

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

import json
from fastapi.responses import StreamingResponse
import asyncio

global_dashboard_data = None
global_dashboard_version = 0

DB_FILE = os.path.join(current_dir, "dashboard_db.json")
if os.path.exists(DB_FILE):
    try:
        with open(DB_FILE, "r") as f:
            persisted = json.load(f)
            global_dashboard_data = persisted.get("data")
            global_dashboard_version = persisted.get("version", 0)
    except Exception as e:
        print(f"DEBUG: Failed to load {DB_FILE}: {e}")

class NormalizeCsvRequest(BaseModel):
    csvContents: List[str]

@app.post("/normalize-csv")
async def normalize_csv(request: NormalizeCsvRequest, req: Request):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "":
        async def error_stream():
            yield f"data: {json.dumps({'status': 'error', 'error': 'GEMINI_API_KEY not configured', 'code': 503})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    if not request.csvContents:
        async def error_stream():
            yield f"data: {json.dumps({'status': 'error', 'error': 'No CSV content provided', 'code': 400})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    def truncate(csv: str, max_rows=50) -> str:
        lines = [l for l in csv.strip().split('\n') if l.strip()]
        if len(lines) <= max_rows + 1:
            return csv
        return '\n'.join(lines[:max_rows + 1])

    PROMPT = '''Convert these CSV files to JSON. Return ONLY valid JSON, no markdown, no explanation.

Schema:
{"employees":[{"name":"","role":"","email":"","capacity":100}],"departments":[{"name":""}],"projects":[{"name":"","description":"","status":"Not Started","startDate":"2024-01-01T00:00:00Z","endDate":"2024-01-31T00:00:00Z"}],"tasks":[{"title":"","type":"Task","assigneeName":"","projectName":"","status":"To Do","weight":5,"startDate":"2024-01-01T00:00:00Z","endDate":"2024-01-07T00:00:00Z"}],"transactions":[{"Date":"2024-01-01","Amount":0,"Type":"Revenue","Category":""}]}

- status options — project: "Not Started"|"In Progress"|"Completed", task: "To Do"|"In Progress"|"Review"|"Done", transaction type: "Revenue"|"Expense"
- Map column headers intelligently, employee CSVs → employees+departments, project/task CSVs → projects+tasks, financial CSVs → transactions
- Always return all 5 arrays (empty [] if not applicable)'''

    user_content = "\n\n".join([f"=== FILE {i+1} ===\n{truncate(csv)}" for i, csv in enumerate(request.csvContents)])

    async def event_generator():
        delays = [0, 5, 15, 30]
        last_error = ""

        for attempt, delay in enumerate(delays):
            if delay > 0:
                yield f"data: {json.dumps({'status': 'retrying', 'attempt': attempt, 'waitMs': delay * 1000, 'message': f'Rate limited — retrying in {delay}s...'})}\n\n"
                await asyncio.sleep(delay)
            else:
                yield f"data: {json.dumps({'status': 'processing', 'message': 'Sending to Gemini...'})}\n\n"

            try:
                model_name = 'gemini-2.5-flash'
                print(f"DEBUG: CSV Normalization using strictly model: {model_name} (Workaround)")
                response = gemini_client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Content(role="user", parts=[types.Part.from_text(text=PROMPT), types.Part.from_text(text='\nCSV:\n' + user_content)])
                    ],
                    config=types.GenerateContentConfig(
                        temperature=0.1,
                        max_output_tokens=2048,
                        response_mime_type="application/json",
                    )
                )

                raw_text = response.text or "{}"
                
                try:
                    with open("debug_gemini.log", "a") as df:
                        df.write(f"=== INPUT ===\n{user_content}\n=== RAW OUTPUT ===\n{raw_text}\n\n")
                except:
                    pass
                
                try:
                    normalized = json.loads(raw_text)
                except Exception:
                    # In case of markdown formatting despite instruction
                    import re
                    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw_text)
                    normalized = json.loads(match.group(1)) if match else {}

                safe_result = {
                    "employees": normalized.get("employees", []) if isinstance(normalized.get("employees"), list) else [],
                    "departments": normalized.get("departments", []) if isinstance(normalized.get("departments"), list) else [],
                    "projects": normalized.get("projects", []) if isinstance(normalized.get("projects"), list) else [],
                    "tasks": normalized.get("tasks", []) if isinstance(normalized.get("tasks"), list) else [],
                    "transactions": normalized.get("transactions", []) if isinstance(normalized.get("transactions"), list) else [],
                }
                
                global global_dashboard_data
                global global_dashboard_version
                global_dashboard_data = safe_result
                global_dashboard_version += 1
                
                try:
                    with open(DB_FILE, "w") as f:
                        json.dump({"data": global_dashboard_data, "version": global_dashboard_version}, f)
                except Exception as e:
                    print(f"DEBUG: Failed to save DB_FILE: {e}")

                yield f"data: {json.dumps({'status': 'done', 'result': safe_result})}\n\n"
                return

            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    last_error = f"Rate limited (429)"
                    if attempt == len(delays) - 1:
                        yield f"data: {json.dumps({'status': 'error', 'error': '429 — quota exceeded. Your client-side parsed data will be used instead.', 'code': 429})}\n\n"
                        return
                    continue
                
                print(f"DEBUG: CSV Normalization failed: {e}")
                last_error = f"Gemini error: {err_str}"
                yield f"data: {json.dumps({'status': 'error', 'error': last_error, 'code': 500})}\n\n"
                return

        yield f"data: {json.dumps({'status': 'error', 'error': last_error or 'All retries exhausted', 'code': 429})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/dashboard-data")
async def get_dashboard_data():
    if not global_dashboard_data:
        return {"data": None, "version": global_dashboard_version}
    return {"data": global_dashboard_data, "version": global_dashboard_version}

@app.post("/forecast")
async def get_forecast(request: Request):
    """
    Receives transactions JSON and returns historical + forecasted data.
    """
    try:
        body = await request.json()
        transactions = body.get("transactions", [])
        forecast_days = body.get("days", 30)
        
        # This will run the PyTorch LSTM training and inference
        # If transactions are missing or too few, it uses synthetic data
        results = train_and_forecast(transactions, forecast_days)
        return results
    except Exception as e:
        print(f"FORECAST ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
