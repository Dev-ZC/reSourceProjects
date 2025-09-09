from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict, Any
from pydantic import BaseModel
from supabase import Client
import logging
from app.auth import get_current_user_from_cookies, get_supabase_client, AuthenticatedUser
from app.services.links_data_service import get_links_data_service, LinksDataService

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["links"])

class LinkCreate(BaseModel):
    project_id: str
    url: str
    string: str

class LinkUpdate(BaseModel):
    url: Optional[str] = None
    string: Optional[str] = None

@router.post("/create")
async def create_link(
    link_data: LinkCreate,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    links_service: LinksDataService = Depends(get_links_data_service)
):
    """
    Create a new link for the authenticated user
    """
    try:
        logger.info(f"Creating link for user {current_user.supabase_user_id}")
        logger.debug(f"Link data: {link_data}")
        
        result = links_service.create_link(
            project_id=link_data.project_id,
            url=link_data.url,
            string=link_data.string,
            user=current_user
        )
        
        logger.info(f"Link created successfully: {result}")
        return {
            "message": "Link created successfully",
            "link": result
        }
        
    except HTTPException as he:
        logger.error(f"HTTP Exception in create_link: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in create_link: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create link: {str(e)}"
        )

@router.put("/update/{link_id}")
async def update_link(
    link_id: str,
    link_data: LinkUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    links_service: LinksDataService = Depends(get_links_data_service)
):
    """
    Update an existing link for the authenticated user
    """
    try:
        result = links_service.update_link(
            link_id=link_id,
            url=link_data.url,
            string=link_data.string,
            user=current_user
        )
        
        return {
            "message": "Link updated successfully",
            "link": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update link: {str(e)}"
        )

@router.get("/get/{link_id}")
async def get_link(
    link_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    links_service: LinksDataService = Depends(get_links_data_service)
):
    """
    Get a link by ID for the authenticated user
    """
    try:
        result = links_service.get_link(
            link_id=link_id,
            user=current_user
        )
        
        return {
            "message": "Link retrieved successfully",
            "link": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve link: {str(e)}"
        )

@router.delete("/delete/{link_id}")
async def delete_link(
    link_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    links_service: LinksDataService = Depends(get_links_data_service)
):
    """
    Delete a link for the authenticated user
    """
    try:
        result = links_service.delete_link(
            link_id=link_id,
            user=current_user
        )
        
        return {
            "message": "Link deleted successfully",
            "deleted": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete link: {str(e)}"
        )