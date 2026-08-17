import sys
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure project root is in sys.path for backend package imports
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.Decision.predict import predict_command
from backend.Memory.conversation_memory import save_chat_turn

app = FastAPI(
    title="Saily Voice AI Backend Server",
    description="FastAPI REST API bridging Saily Voice Assistant frontend with Python AI decision & execution engine.",
    version="1.0.0"
)

# Enable CORS for React frontend (http://localhost:5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VoiceQueryRequest(BaseModel):
    query: str

class VoiceQueryResponse(BaseModel):
    query: str
    reply: str
    action: str = "response"
    status: str = "success"

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Saily Voice AI Backend",
        "version": "1.0.0"
    }

@app.post("/api/voice", response_model=VoiceQueryResponse)
def process_voice_query(request: VoiceQueryRequest):
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")
    
    query_text = request.query.strip()
    try:
        execution_reply = str(predict_command(query_text))
        
        # Save turn to persistent history in backend/Memory/history.json
        save_chat_turn(query_text, execution_reply, action="executed")
        
        return VoiceQueryResponse(
            query=query_text,
            reply=execution_reply,
            action="executed",
            status="success"
        )
    except Exception as e:
        error_msg = f"Error executing command: {e}"
        save_chat_turn(query_text, error_msg, action="error")
        return VoiceQueryResponse(
            query=query_text,
            reply=error_msg,
            action="error",
            status="failed"
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
