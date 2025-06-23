from pydantic import BaseModel, Field
from typing import Optional, List

class SignupRequest(BaseModel):
    email: str
    password: str
    username: str
    