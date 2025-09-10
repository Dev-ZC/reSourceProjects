import os
import jwt
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
    Extract and verify user from Clerk session cookies using sessions.get
    """
    try:
        print(f"🔍 AUTH DEBUG: Available cookies: {list(request.cookies.keys())}")
        
        # Try multiple session cookies in order of preference
        session_cookies = ["__session", "__session_r9XL5wDY", "__session_SriKaHsP", "__clerk_session"]
        clerk_user_id = None
        last_error = None
        
        for cookie_name in session_cookies:
            session_token = request.cookies.get(cookie_name)
            if not session_token:
                continue
                
            print(f"🔍 AUTH DEBUG: Trying {cookie_name} cookie")
            
            try:
                # Extract session ID from JWT token
                print(f"🔍 AUTH DEBUG: Attempting to decode JWT token (length: {len(session_token)})")
                decoded_token = jwt.decode(session_token, options={"verify_signature": False})
                session_id = decoded_token.get("sid")
                print(f"🔍 AUTH DEBUG: Extracted session_id: {session_id}")
                
                if not session_id:
                    print(f"❌ AUTH DEBUG: No session ID found in {cookie_name}")
                    continue
                
                # Use Clerk sessions.get to retrieve session details
                print(f"🔍 AUTH DEBUG: Calling clerk.sessions.get with session_id: {session_id}")
                session_response = clerk.sessions.get(session_id=session_id)
                print(f"🔍 AUTH DEBUG: Session response received: {bool(session_response)}")
                
                if session_response and session_response.user_id:
                    clerk_user_id = session_response.user_id
                    print(f"✅ AUTH DEBUG: Successfully got clerk_user_id: {clerk_user_id} from {cookie_name}")
                    break
                else:
                    print(f"❌ AUTH DEBUG: Invalid session response from {cookie_name}")
                    
            except Exception as e:
                print(f"❌ AUTH DEBUG: Session verification failed for {cookie_name}: {str(e)}")
                last_error = str(e)
                continue
        
        if not clerk_user_id:
            print("🔄 AUTH DEBUG: All sessions expired, falling back to JWT verification")
            # Fallback to JWT verification for expired sessions
            try:
                session_token = request.cookies.get("__session")
                if session_token:
                    jwt_payload = clerk.jwt_templates.verify_token(session_token)
                    clerk_user_id = jwt_payload.get("sub")
                    print(f"✅ AUTH DEBUG: JWT fallback successful, user_id: {clerk_user_id}")
                else:
                    raise Exception("No session token for JWT fallback")
            except Exception as jwt_error:
                print(f"❌ AUTH DEBUG: JWT fallback also failed: {str(jwt_error)}")
                error_msg = f"All authentication methods failed. Sessions expired. Please log in again."
                raise HTTPException(status_code=401, detail=error_msg)
        
        # Find corresponding Supabase user
        users_response = supabase.auth.admin.list_users()
        print(f"🔍 AUTH DEBUG: Looking for Clerk user ID {clerk_user_id} in Supabase users")
        print(f"🔍 AUTH DEBUG: Found {len(users_response)} users in Supabase")
        
        # Log all users for debugging
        for i, user in enumerate(users_response):
            print(f"🔍 AUTH DEBUG: Supabase User #{i+1}:")
            print(f"🔍 AUTH DEBUG:   - ID: {user.id}")
            print(f"🔍 AUTH DEBUG:   - Email: {user.email}")
            print(f"🔍 AUTH DEBUG:   - Metadata: {user.user_metadata}")
            
            if user.user_metadata:
                stored_clerk_id = user.user_metadata.get("clerk_user_id")
                print(f"🔍 AUTH DEBUG:   - Stored Clerk ID: {stored_clerk_id}")
                print(f"🔍 AUTH DEBUG:   - Matches current Clerk ID: {stored_clerk_id == clerk_user_id}")
                
                if stored_clerk_id == clerk_user_id:
                    print(f"✅ AUTH DEBUG: Found matching user! Supabase ID: {user.id}, Clerk ID: {clerk_user_id}")
                    return AuthenticatedUser(
                        supabase_user_id=user.id,
                        clerk_user_id=clerk_user_id,
                        email=user.email,
                        user_metadata=user.user_metadata
                    )
        
        print(f"❌ AUTH DEBUG: No matching user found in Supabase for Clerk ID: {clerk_user_id}")
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
