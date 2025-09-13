from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.auth import get_current_user_from_cookies, AuthenticatedUser

router = APIRouter(tags=["chat"])

class ChatRequest(BaseModel):
    prompt: str
    project_id: str

@router.post("/chat")
async def chat(
    chat_data: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies)
):
    """
    Send a chat message and get a response
    """
    try:
        # Mock response - not calling any actual chat service
        return {
            "message": "Chat response generated successfully",
            "response": f"This is a mock response to your message: '{chat_data.prompt}' for project {chat_data.project_id}",
            "user_id": current_user.user_id,
            "project_id": chat_data.project_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat: {str(e)}"
        )
