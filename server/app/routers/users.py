from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
import os
import json
from dotenv import load_dotenv
from clerk_backend_api import Clerk
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

router = APIRouter(prefix="/users", tags=["users"])

# Initialize Clerk SDK
clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

# Initialize Supabase client with service role key for admin operations
supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_service_key)

class SignupRequest(BaseModel):
    username: str
    password: str

@router.post("/signup")
def signup_user(request: SignupRequest):
    """Manual signup endpoint (if needed)"""
    try:
        # Create user in Clerk
        clerk_user = clerk.users.create_user(
            email_address=[request.username],
            password=request.password
        )
        
        # Create user in Supabase Auth using admin client
        auth_response = supabase.auth.admin.create_user({
            "email": request.username,
            "password": request.password,
            "user_metadata": {
                "clerk_user_id": clerk_user.id,
                "first_name": clerk_user.first_name,
                "last_name": clerk_user.last_name
            }
        })
        
        return {
            "message": f"User {request.username} signed up successfully",
            "clerk_user_id": clerk_user.id,
            "supabase_user_id": auth_response.user.id
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook/clerk")
async def clerk_webhook(request: Request):
    """
    Webhook endpoint to handle Clerk events
    This will be called by Clerk after user operations
    """
    try:
        # Get the raw body
        body = await request.body()
        
        # Verify webhook signature (recommended for production)
        webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET")
        if webhook_secret:
            # In production, add proper signature verification here
            # svix library can be used for this
            pass
        
        # Parse the webhook payload
        payload = json.loads(body)
        event_type = payload.get("type")
        
        if event_type == "user.created":
            user_data = payload.get("data")
            
            # Extract user information from Clerk webhook
            clerk_user_id = user_data.get("id")
            
            # Safely extract email from email_addresses array
            email_addresses = user_data.get("email_addresses", [])
            email = None
            if email_addresses and len(email_addresses) > 0:
                email = email_addresses[0].get("email_address")
            
            first_name = user_data.get("first_name")
            last_name = user_data.get("last_name")
            
            if not email:
                print(f"Warning: No email found for Clerk user {clerk_user_id}, skipping Supabase user creation")
                return {"message": "Webhook received but no email found, skipped user creation"}
            
            # Create user in Supabase Auth using admin client
            auth_response = supabase.auth.admin.create_user({
                "email": email,
                "email_confirm": True,  # Auto-confirm since they signed up via Clerk
                "user_metadata": {
                    "clerk_user_id": clerk_user_id,
                    "first_name": first_name,
                    "last_name": last_name,
                    "created_via": "clerk"
                }
            })
            
            print(f"Created Supabase user: {auth_response.user.id} for Clerk user: {clerk_user_id}")
            return {"message": "User created in Supabase successfully", "supabase_user_id": auth_response.user.id}
        
        elif event_type == "user.updated":
            user_data = payload.get("data")
            clerk_user_id = user_data.get("id")
            
            # Find the Supabase user by clerk_user_id in metadata
            users_response = supabase.auth.admin.list_users()
            supabase_user = None
            
            for user in users_response:
                if user.user_metadata and user.user_metadata.get("clerk_user_id") == clerk_user_id:
                    supabase_user = user
                    break
            
            if supabase_user:
                # Update user metadata in Supabase
                supabase.auth.admin.update_user_by_id(
                    supabase_user.id,
                    {
                        "user_metadata": {
                            **supabase_user.user_metadata,
                            "first_name": user_data.get("first_name"),
                            "last_name": user_data.get("last_name")
                        }
                    }
                )
                return {"message": "User updated in Supabase successfully"}
            else:
                return {"message": "User not found in Supabase"}
        
        elif event_type == "user.deleted":
            user_data = payload.get("data")
            clerk_user_id = user_data.get("id")
            
            # Find and delete the Supabase user
            users_response = supabase.auth.admin.list_users()
            
            for user in users_response:
                if user.user_metadata and user.user_metadata.get("clerk_user_id") == clerk_user_id:
                    supabase.auth.admin.delete_user(user.id)
                    return {"message": "User deleted from Supabase successfully"}
            
            return {"message": "User not found in Supabase"}
        
        return {"message": f"Webhook received: {event_type}"}
    
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Webhook processing failed: {str(e)}")

@router.get("/verify")
def verify_user(authorization: str = Header(None)):
    """
    Verify a user's Clerk session and return their Supabase user data
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
                return {
                    "message": "User verified",
                    "supabase_user": {
                        "id": user.id,
                        "email": user.email,
                        "user_metadata": user.user_metadata
                    }
                }
        
        raise HTTPException(status_code=404, detail="User not found in Supabase")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))