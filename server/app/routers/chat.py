from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
import os
from pydantic import BaseModel
from supabase import create_client, Client

from app.manager.manager import Manager
from app.models.models import UserContext, AgentConversationResponse

router = APIRouter()

# Request models
class StartChatRequest(BaseModel):
    prompt: str
    project_id: str

class ContinueChatRequest(BaseModel):
    conversation_history: List[str]
    project_id: str

# Initialize Supabase client
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Hardcoded authentication for testing
def get_manager(project_id: str):
    try:
        # Hardcoded authentication
        response = supabase.auth.sign_in_with_password({
            "email": "zacole@usc.edu",
            "password": "password"
        })
        
        if not response.session:
            raise HTTPException(status_code=401, detail="Authentication failed")
            
        # Get user info from the authenticated session
        user = response.user
        session = response.session
        
        # Create user context with the provided project_id
        user_context = UserContext(currProjectId=project_id)
        
        # Initialize Manager with Supabase session
        return Manager(
            authenticated_user=user,
            user_context=user_context,
            supabase_session=session
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start", response_model=AgentConversationResponse)
async def start_chat(
    request: StartChatRequest = Body(...)
):
    """
    Start a new chat conversation.
    
    Args:
        prompt: The user's initial message
        project_id: The ID of the project this chat is related to
    """
    try:
        manager = get_manager(project_id=request.project_id)
        # user_chat now always returns an AgentConversationResponse
        return manager.user_chat(request.prompt)
    except Exception as e:
        return AgentConversationResponse(
            wait_for_human=True,
            model_response=f"Error starting chat: {str(e)}"
        )

@router.post("/continue", response_model=AgentConversationResponse)
async def continue_chat(
    request: ContinueChatRequest = Body(...)
):
    """
    Continue an existing chat conversation.
    
    Args:
        conversation_history: The full conversation history as a list of messages
        project_id: The ID of the project this chat is related to
    """
    try:
        manager = get_manager(project_id=request.project_id)
        
        # Continue the conversation using the manager's method
        return manager.continue_agent_conversation(request.conversation_history)
        
    except Exception as e:
        return AgentConversationResponse(
            wait_for_human=False,
            model_response=f"Error continuing chat: {str(e)}"
        )
