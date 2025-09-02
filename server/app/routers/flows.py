import json
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from supabase import Client
from app.auth import get_current_user, get_current_user_from_cookies, get_supabase_client, AuthenticatedUser

router = APIRouter(prefix="/flows", tags=["flows"])

class FlowSave(BaseModel):
    project_id: UUID
    flow_state: Dict[str, Any]
    flow_name: Optional[str] = None
    
@router.post("/save")
async def save_flow(
    flow_data: FlowSave,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Save a flow state to the database after verifying user authentication
    """
    try:
        # Prepare the flow record
        flow_record = {
            "user_id": current_user.supabase_user_id,
            "project_id": str(flow_data.project_id),
            "flow_state": flow_data.flow_state,
            "name": flow_data.flow_name,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Check if a flow already exists for this user and project
        existing_flow = supabase.table("flows").select("id").eq(
            "user_id", current_user.supabase_user_id
        ).eq(
            "project_id", str(flow_data.project_id)
        ).execute()
        
        if existing_flow.data:
            # Update existing flow
            response = supabase.table("flows").update(flow_record).eq(
                "id", existing_flow.data[0]["id"]
            ).execute()
            
            return {
                "message": "Flow updated successfully",
                "flow_id": existing_flow.data[0]["id"],
                "user_id": current_user.supabase_user_id
            }
        else:
            # Create new flow
            flow_record["created_at"] = datetime.utcnow().isoformat()
            response = supabase.table("flows").insert(flow_record).execute()
            
            if response.data:
                return {
                    "message": "Flow saved successfully",
                    "flow_id": response.data[0]["id"],
                    "user_id": current_user.supabase_user_id
                }
            else:
                raise HTTPException(status_code=400, detail="Failed to save flow")
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to save flow: {str(e)}"
        )

@router.get("/load/{project_id}")
async def load_flow(
    project_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Load a flow state from the database for the authenticated user and project
    """
    try:
        # Get the flow for this user and project
        response = supabase.table("flows").select("*").eq(
            "user_id", current_user.supabase_user_id
        ).eq(
            "project_id", str(project_id)
        ).execute()
        
        if response.data:
            flow = response.data[0]
            return {
                "message": "Flow loaded successfully",
                "flow_id": flow["id"],
                "project_id": flow["project_id"],
                "flow_state": flow["flow_state"],
                "name": flow["name"],
                "created_at": flow["created_at"],
                "updated_at": flow["updated_at"]
            }
        else:
            # Return empty flow state if no flow exists
            return {
                "message": "No existing flow found, returning empty state",
                "flow_state": {
                    "nodes": [],
                    "edges": [],
                    "viewport": {"x": 0, "y": 0, "zoom": 1}
                }
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to load flow: {str(e)}"
        )
 