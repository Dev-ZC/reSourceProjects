import os
from fastapi import HTTPException, Header, Request, Depends
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from clerk_backend_api import Clerk
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Clerk SDK
clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

# Initialize Supabase client with service role key for admin operations
supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_service_key)

class AuthenticatedUser(BaseModel):
    supabase_user_id: str
    clerk_user_id: str
    email: str
    user_metadata: dict

def get_supabase_client() -> Client:
    """Dependency to get Supabase client"""
    return supabase

async def get_current_user(authorization: str = Header(None)) -> AuthenticatedUser:
    """
    Verify a user's Clerk token from Authorization header and return their Supabase user data
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        token = authorization.split(" ")[1]
        
        # Verify the token with Clerk SDK
        try:
            # Use Clerk's JWT verification which handles all token types
            jwt_payload = clerk.jwt_templates.verify_token(token)
            clerk_user_id = jwt_payload.get("sub")
            
            if not clerk_user_id:
                raise HTTPException(status_code=401, detail="Invalid token: no user ID found")
                
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
        
        # Find user in Supabase Auth by clerk_user_id
        users_response = supabase.auth.admin.list_users()
        
        for user in users_response:
            if user.user_metadata and user.user_metadata.get("clerk_user_id") == clerk_user_id:
                return AuthenticatedUser(
                    supabase_user_id=user.id,
                    clerk_user_id=clerk_user_id,
                    email=user.email,
                    user_metadata=user.user_metadata
                )
        
        raise HTTPException(status_code=404, detail="User not found in Supabase")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def get_current_user_from_cookies(request: Request) -> AuthenticatedUser:
    """
    Extract and verify user from Clerk session cookies
    """
    try:
        # Get session token from cookies
        session_token = request.cookies.get("__session")  # Clerk's default session cookie name
        
        if not session_token:
            # Try alternative cookie names that Clerk might use
            session_token = request.cookies.get("__clerk_session")
            
        if not session_token:
            raise HTTPException(
                status_code=401, 
                detail="No session cookie found. Please log in."
            )
        
        # Verify the token with Clerk SDK
        try:
            # Use Clerk's JWT verification which handles all token types
            jwt_payload = clerk.jwt_templates.verify_token(session_token)
            clerk_user_id = jwt_payload.get("sub")
            
            if not clerk_user_id:
                raise HTTPException(status_code=401, detail="Invalid token: no user ID found")
                
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
        
        # Find corresponding Supabase user
        users_response = supabase.auth.admin.list_users()
        
        for user in users_response:
            if user.user_metadata and user.user_metadata.get("clerk_user_id") == clerk_user_id:
                return AuthenticatedUser(
                    supabase_user_id=user.id,
                    clerk_user_id=clerk_user_id,
                    email=user.email,
                    user_metadata=user.user_metadata
                )
        
        raise HTTPException(
            status_code=404, 
            detail="User not found in Supabase. Please contact support."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Authentication error: {str(e)}"
        )
