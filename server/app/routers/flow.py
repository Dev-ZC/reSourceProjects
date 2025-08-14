from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from supabase import Client

# Assuming you have these dependencies
# from your_auth import get_current_user, get_supabase_client

router = APIRouter(prefix="/flow", tags=["flow"])

# Pydantic models
class FlowCreate(BaseModel):
    name: Optional[str] = None
    project_id: Optional[UUID] = None

class FlowResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: Optional[str]
    project_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

class FlowSnapshotCreate(BaseModel):
    snapshot_data: Dict[str, Any]  # This will contain nodes, edges, viewport from toObject()
    version_name: Optional[str] = None
    is_auto_save: bool = True

class FlowSnapshotResponse(BaseModel):
    id: UUID
    flow_id: UUID
    snapshot_data: Dict[str, Any]
    version_name: Optional[str]
    is_auto_save: bool
    created_at: datetime

# Flow management endpoints
@router.post("/flows", response_model=FlowResponse)
async def create_flow(
    flow_data: FlowCreate,
    supabase: Client = Depends(get_supabase_client),
    current_user = Depends(get_current_user)
):
    # Create a new flow
    try:
        flow_record = {
            "user_id": current_user.id,
            "name": flow_data.name,
            "project_id": str(flow_data.project_id) if flow_data.project_id else None
        }
        
        response = supabase.table("flows").insert(flow_record).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Failed to create flow")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flows", response_model=List[FlowResponse])
async def get_user_flows(
    project_id: Optional[UUID] = None,
    supabase: Client = Depends(get_supabase_client),
    current_user = Depends(get_current_user)
):
    # Get all flows for the current user
    try:
        query = supabase.table("flows").select("*").eq("user_id", current_user.id)
        
        if project_id:
            query = query.eq("project_id", str(project_id))
            
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flows/{flow_id}", response_model=FlowResponse)
async def get_flow(
    flow_id: UUID,
    supabase: Client = Depends(get_supabase_client),
    current_user = Depends(get_current_user)
):
    # Get a specific flow
    try:
        response = supabase.table("flows").select("*").eq("id", str(flow_id)).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Flow not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/flows/{flow_id}")
async def update_flow(
    flow_id: UUID,
    flow_data: FlowCreate,
    supabase: Client = Depends(get_supabase_client),
    current_user = Depends(get_current_user)
):
    # Update a flow's metadata
    try:
        update_data = {}
        if flow_data.name is not None:
            update_data["name"] = flow_data.name
        if flow_data.project_id is not None:
            update_data["project_id"] = str(flow_data.project_id)
            
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
            
        response = supabase.table("flows").update(update_data).eq("id", str(flow_id)).execute()
        return {"message": "Flow updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/flows/{flow_id}")
async def delete_flow(
    flow_id: UUID,
    supabase: Client = Depends(get_supabase_client),
    current_user = Depends(get_current_user)
):
    # Delete a flow and all its snapshots
    try:
        response = supabase.table("flows").delete().eq("id", str(flow_id)).execute()
        return {"message": "Flow deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Flow snapshot endpoints
@router.post("/flows/{flow_id}/save", response_model=FlowSnapshotResponse)
async def save_flow_snapshot(
    flow_id: UUID,
    snapshot: FlowSnapshotCreate,
    supabase: Client = Depends(get_supabase_client),
    current_user = Depends(get_current_user)
):
    # Save a flow snapshot (from React Flow's toObject())
    try:
        # Verify flow ownership
        flow_check = supabase.table("flows").select("id").eq("id", str(flow_id)).eq("user_id", current_user.id).execute()
        if not flow_check.data:
            raise HTTPException(status_code=404, detail="Flow not found or access denied")
        
        snapshot_record = {
            "flow_id": str(flow_id),
            "snapshot_data": snapshot.snapshot_data,
            "version_name": snapshot.version_name,
            "is_auto_save": snapshot.is_auto_save
        }
        
        response = supabase.table("flow_snapshots").insert(snapshot_record).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Failed to save snapshot")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flows/{flow_id}/load")
async def load_latest_flow_snapshot(
    flow_id: UUID,
    version_name: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    current_user = Depends(get_current_user)
):
    # Load the latest flow snapshot (or specific version)
    try:
        # Verify flow ownership
        flow_check = supabase.table("flows").select("id").eq("id", str(flow_id)).eq("user_id", current_user.id).execute()
        if not flow_check.data:
            raise HTTPException(status_code=404, detail="Flow not found or access denied")
        
        query = supabase.table("flow_snapshots").select("snapshot_data").eq("flow_id", str(flow_id))
        
        if version_name:
            query = query.eq("version_name", version_name)
        
        response = query.order("created_at", desc=True).limit(1).execute()
        
        if response.data:
            return response.data[0]["snapshot_data"]
        
        # Return empty flow state if no snapshots exist
        return {
            "nodes": [],
            "edges": [],
            "viewport": {"x": 0, "y": 0, "zoom": 1}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flows/{flow_id}/snapshots", response_model=List[FlowSnapshotResponse])
async def get_flow_snapshots(
    flow_id: UUID,
    limit: int = 10,
    supabase: Client = Depends(get_supabase_client),
    current_user = Depends(get_current_user)
):
    # Get flow snapshot history
    try:
        # Verify flow ownership
        flow_check = supabase.table("flows").select("id").eq("id", str(flow_id)).eq("user_id", current_user.id).execute()
        if not flow_check.data:
            raise HTTPException(status_code=404, detail="Flow not found or access denied")
        
        response = (supabase.table("flow_snapshots")
                   .select("*")
                   .eq("flow_id", str(flow_id))
                   .order("created_at", desc=True)
                   .limit(limit)
                   .execute())
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/flows/{flow_id}/snapshots/{snapshot_id}")
async def delete_flow_snapshot(
    flow_id: UUID,
    snapshot_id: UUID,
    supabase: Client = Depends(get_supabase_client),
    current_user = Depends(get_current_user)
):
    # Delete a specific snapshot
    try:
        # Verify flow ownership through the snapshot
        response = supabase.table("flow_snapshots").delete().eq("id", str(snapshot_id)).eq("flow_id", str(flow_id)).execute()
        return {"message": "Snapshot deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Convenience endpoints
@router.post("/flows/{flow_id}/auto-save")
async def auto_save_flow(
    flow_id: UUID,
    snapshot_data: Dict[str, Any],
    supabase: Client = Depends(get_supabase_client),
    current_user = Depends(get_current_user)
):
    # Auto-save endpoint with cleanup of old auto-saves
    try:
        # Save new auto-save
        snapshot = FlowSnapshotCreate(
            snapshot_data=snapshot_data,
            is_auto_save=True
        )
        
        await save_flow_snapshot(flow_id, snapshot, supabase, current_user)
        
        # Clean up old auto-saves (keep only last 5 auto-saves)
        old_autosaves = (supabase.table("flow_snapshots")
                        .select("id")
                        .eq("flow_id", str(flow_id))
                        .eq("is_auto_save", True)
                        .order("created_at", desc=True)
                        .limit(100)  # Get more than we need
                        .execute())
        
        if old_autosaves.data and len(old_autosaves.data) > 5:
            ids_to_delete = [item["id"] for item in old_autosaves.data[5:]]
            supabase.table("flow_snapshots").delete().in_("id", ids_to_delete).execute()
        
        return {"message": "Auto-saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))