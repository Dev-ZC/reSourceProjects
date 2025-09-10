import json
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from supabase import Client
from app.auth import get_current_user, get_current_user_from_cookies, get_supabase_client, AuthenticatedUser

router = APIRouter(tags=["flows"])

class FlowSave(BaseModel):
    project_id: str  # Accept any string as project identifier
    flow_state: Dict[str, Any]

@router.post("/save")
async def save_flow(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Save a flow state to the database after verifying user authentication
    """
    print(f"🚀 FLOWS DEBUG: save_flow endpoint called")
    
    # Debug raw request body and manually parse
    try:
        body = await request.body()
        print(f"🚀 FLOWS DEBUG: Raw request body: {body.decode('utf-8')}")
        
        # Parse JSON manually to see what we're getting
        body_json = json.loads(body.decode('utf-8'))
        print(f"🚀 FLOWS DEBUG: Parsed JSON: {body_json}")
        
        # Try to validate with Pydantic
        flow_data = FlowSave(**body_json)
        print(f"🚀 FLOWS DEBUG: Successfully validated flow_data: {flow_data}")
        
    except json.JSONDecodeError as e:
        print(f"❌ FLOWS DEBUG: JSON decode error: {e}")
        raise HTTPException(status_code=422, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        print(f"❌ FLOWS DEBUG: Validation error: {e}")
        print(f"❌ FLOWS DEBUG: Error type: {type(e)}")
        if "uuid_parsing" in str(e).lower():
            raise HTTPException(
                status_code=422, 
                detail="Invalid project_id: Must be a valid UUID format (e.g., '123e4567-e89b-12d3-a456-426614174000'). Please provide a valid project UUID."
            )
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    
    print(f"🚀 FLOWS DEBUG: flow_data project_id: {flow_data.project_id}")
    print(f"🚀 FLOWS DEBUG: flow_data flow_state: {flow_data.flow_state}")
    print(f"🚀 FLOWS DEBUG: current_user: {current_user.clerk_user_id if current_user else 'None'}")
    
    try:
        # Prepare the flow record
        flow_record = {
            "user_id": current_user.supabase_user_id,
            "project_id": str(flow_data.project_id),
            "flow_state": flow_data.flow_state,
        }
        print(f"🚀 FLOWS DEBUG: Prepared flow_record: {flow_record}")
        
        # Check if a flow already exists for this user and project
        print(f"🚀 FLOWS DEBUG: Checking for existing flow...")
        try:
            existing_flow = supabase.table("flows").select("id").eq(
                "user_id", current_user.supabase_user_id
            ).eq(
                "project_id", str(flow_data.project_id)
            ).execute()
            print(f"🚀 FLOWS DEBUG: Existing flow query result: {existing_flow}")
        except Exception as db_error:
            print(f"❌ FLOWS DEBUG: Database query error: {db_error}")
            print(f"❌ FLOWS DEBUG: Error type: {type(db_error)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
        
        if existing_flow.data:
            # Update existing flow
            print(f"🚀 FLOWS DEBUG: Updating existing flow with ID: {existing_flow.data[0]['id']}")
            try:
                response = supabase.table("flows").update(flow_record).eq(
                    "id", existing_flow.data[0]["id"]
                ).execute()
                print(f"🚀 FLOWS DEBUG: Update response: {response}")
            except Exception as update_error:
                print(f"❌ FLOWS DEBUG: Update error: {update_error}")
                print(f"❌ FLOWS DEBUG: Update error type: {type(update_error)}")
                raise HTTPException(status_code=500, detail=f"Update error: {str(update_error)}")
            
            return {
                "message": "Flow updated successfully",
                "flow_id": existing_flow.data[0]["id"],
                "user_id": current_user.supabase_user_id
            }
        else:
            # Create new flow
            print(f"🚀 FLOWS DEBUG: Creating new flow...")
            flow_record["created_at"] = datetime.utcnow().isoformat()
            try:
                response = supabase.table("flows").insert(flow_record).execute()
                print(f"🚀 FLOWS DEBUG: Insert response: {response}")
            except Exception as insert_error:
                print(f"❌ FLOWS DEBUG: Insert error: {insert_error}")
                print(f"❌ FLOWS DEBUG: Insert error type: {type(insert_error)}")
                raise HTTPException(status_code=500, detail=f"Insert error: {str(insert_error)}")
            
            if response.data:
                return {
                    "message": "Flow saved successfully",
                    "flow_id": response.data[0]["id"],
                    "user_id": current_user.supabase_user_id
                }
            else:
                print(f"❌ FLOWS DEBUG: No data in insert response: {response}")
                raise HTTPException(status_code=400, detail="Failed to save flow - no data returned")
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to save flow: {str(e)}"
        )

@router.get("/load/{project_id}")
async def load_flow(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Load a flow state from the database for the authenticated user and project
    """
    print(f"🔍 FLOWS DEBUG: load_flow called with project_id={project_id}")
    print(f"🔍 FLOWS DEBUG: current_user={current_user.clerk_user_id if current_user else 'None'}")
    print(f"🔍 FLOWS DEBUG: supabase_user_id={current_user.supabase_user_id if current_user else 'None'}")
    
    try:
        print(f"🔍 FLOWS DEBUG: Checking if flows table exists...")
        try:
            # Try to get table info first to check if table exists
            tables = supabase.table("flows").select("*").limit(1).execute()
            print(f"🔍 FLOWS DEBUG: Flows table check result: {tables}")
        except Exception as table_error:
            print(f"❌ FLOWS DEBUG: Error checking flows table: {table_error}")
            print(f"❌ FLOWS DEBUG: Error type: {type(table_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"Database error: The flows table might not exist. Error: {str(table_error)}"
            )
        
        # Get the flow for this user and project
        print(f"🔍 FLOWS DEBUG: Querying flow for user_id={current_user.supabase_user_id}, project_id={project_id}")
        response = supabase.table("flows").select("*").eq(
            "user_id", current_user.supabase_user_id
        ).eq(
            "project_id", str(project_id)
        ).execute()
        print(f"🔍 FLOWS DEBUG: Query response: {response}")
        
        if response.data:
            flow = response.data[0]
            print(f"✅ FLOWS DEBUG: Flow found with id={flow['id']}")
            return {
                "message": "Flow loaded successfully",
                "flow_id": flow["id"],
                "project_id": flow["project_id"],
                "flow_state": flow["flow_state"],
            }
        else:
            print(f"ℹ️ FLOWS DEBUG: No flow found for this project, returning empty state")
            # Return empty flow state if no flow exists
            return {
                "message": "No existing flow found, returning empty state",
                "flow_state": {
                    "nodes": [],
                    "edges": [],
                    "viewport": {"x": 0, "y": 0, "zoom": 1}
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ FLOWS DEBUG: Exception in load_flow: {e}")
        print(f"❌ FLOWS DEBUG: Exception type: {type(e)}")
        import traceback
        print(f"❌ FLOWS DEBUG: Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to load flow: {str(e)}"
        )
 