from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq 
from dotenv import load_dotenv # <--- NEW IMPORT
import json
import os

# Load the secret .env file
load_dotenv()

app = FastAPI()

# --- CONFIGURATION ---
# NOW IT READS FROM THE FILE SECURELY
API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    print("Error: GROQ_API_KEY not found in .env file")

client = Groq(api_key=API_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class MigrationRequest(BaseModel):
    code: str
    target_lang: str

class TestRequest(BaseModel):
    migrated_code: str

# --- HELPER FUNCTION ---
def get_groq_response(prompt, json_mode=True):
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": "You are an expert Senior Software Architect specializing in legacy code migration. You always output valid JSON when requested."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            response_format={"type": "json_object"} if json_mode else None
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        return None

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "Server is running", "ai_engine": "Groq Llama 3"}

@app.post("/analyze")
async def analyze_code(file: UploadFile = File(...)):
    content = await file.read()
    code_text = content.decode("utf-8")

    prompt = f"""
    Analyze the following code. Return a JSON object with these EXACT keys:
    {{
        "language": "string",
        "complexity": "string",
        "summary": "string",
        "risks": ["string", "string"],
        "modernization_suggestions": ["string", "string"]
    }}
    
    CODE TO ANALYZE:
    {code_text[:4000]}
    """

    response_text = get_groq_response(prompt, json_mode=True)

    if response_text:
        return {
            "filename": file.filename, 
            "analysis": response_text, 
            "source_code": code_text,
            "source": "Groq AI"
        }
    else:
        mock_analysis = {
            "language": "Legacy Code (Detected)",
            "complexity": "High",
            "summary": "Analysis failed (API Error). Showing cached result.",
            "risks": ["Manual review recommended"],
            "modernization_suggestions": ["Refactor immediately"]
        }
        return {
            "filename": file.filename, 
            "analysis": json.dumps(mock_analysis), 
            "source_code": code_text,
            "source": "MOCK_FALLBACK"
        }

@app.post("/migrate")
async def migrate_code(request: MigrationRequest):
    prompt = f"""
    Convert the following code to {request.target_lang}.
    Return a JSON object with these EXACT keys:
    {{
        "migrated_code": "string (the full new code)",
        "migration_steps": ["string (step 1)", "string (step 2)"]
    }}
    
    IMPORTANT: Ensure the 'migrated_code' is a valid string with proper escaping.
    
    CODE TO MIGRATE:
    {request.code}
    """
    
    response_text = get_groq_response(prompt, json_mode=True)
    
    if response_text:
        return json.loads(response_text)
    else:
        return {
            "migrated_code": "// Error: AI API Failed. Please try again.", 
            "migration_steps": ["Check API Key quota"]
        }

@app.post("/generate-tests")
async def generate_tests(request: TestRequest):
    prompt = f"""
    Write a Unit Test suite for this code. 
    Return a JSON object with one key:
    {{
        "test_code": "string (the full test code)"
    }}
    
    CODE:
    {request.migrated_code}
    """
    
    response_text = get_groq_response(prompt, json_mode=True)
    
    if response_text:
        return json.loads(response_text)
    else:
        return {"test_code": "// Error generating tests"}