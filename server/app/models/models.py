from pydantic import BaseModel, Field
from typing import Optional, List

class SignupRequest(BaseModel):
    email: str
    password: str
    username: str
    
class UserContext(BaseModel):
    currProjectId: Optional[str] = None
    
class AgentConversationResponse(BaseModel):
    wait_for_human: bool
    conversation_history: Optional[str] = None # Wait for human true must send
    original_prompt: Optional[str] = None # Wait for human true must send
    model_response: Optional[str] = None # Wait for human FALSE must send
    
    