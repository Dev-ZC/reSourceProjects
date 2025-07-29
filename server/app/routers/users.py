from fastapi import APIRouter
from pydantic import BaseModel
from app.models.models import SignupRequest

router = APIRouter(prefix="/users", tags=["users"])

class SignupRequest(BaseModel):
    username: str
    password: str

@router.post("/signup")
def signup_user(request: SignupRequest):
    # Add user creation logic here
    return {"message": f"User {request.username} signed up successfully"}
