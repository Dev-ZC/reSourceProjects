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
    conversation_history: Optional[str] = None # wait_for_human true must send
    model_response: Optional[str] = None # wait_for_human FALSE must send
    
    