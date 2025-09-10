from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict, Any
from pydantic import BaseModel
from supabase import Client
import logging
from app.auth import get_current_user_from_cookies, get_supabase_client, AuthenticatedUser
from app.services.projects_data_service import get_project_data_service, ProjectDataService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["projects"])

class ProjectCreate(BaseModel):
    project_name: str

class ProjectUpdate(BaseModel):
    project_name: str

@router.post("/create")
async def create_project(
    project_data: ProjectCreate,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    projects_service: ProjectDataService = Depends(get_project_data_service)
):
    """
    Create a new project for the authenticated user
    """
    logger.info(f"POST /create - Creating project: {project_data.project_name} for user: {current_user.supabase_user_id}")
    try:
        result = projects_service.create_project(
            project_name=project_data.project_name,
            user=current_user
        )
        
        logger.info(f"POST /create - Project created successfully: {result.get('id', 'unknown')}")
        return {
            "message": "Project created successfully",
            "project": result
        }
        
    except HTTPException as e:
        logger.error(f"POST /create - HTTPException: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"POST /create - Exception: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create project: {str(e)}"
        )

@router.put("/update/{project_id}")
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    projects_service: ProjectDataService = Depends(get_project_data_service)
):
    """
    Update an existing project for the authenticated user
    """
    logger.info(f"PUT /update/{project_id} - Updating project: {project_data.project_name} for user: {current_user.supabase_user_id}")
    try:
        result = projects_service.update_project(
            project_id=project_id,
            project_name=project_data.project_name,
            user=current_user
        )
        
        logger.info(f"PUT /update/{project_id} - Project updated successfully")
        return {
            "message": "Project updated successfully",
            "project": result
        }
        
    except HTTPException as e:
        logger.error(f"PUT /update/{project_id} - HTTPException: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"PUT /update/{project_id} - Exception: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update project: {str(e)}"
        )

@router.get("/get/{project_id}")
async def get_project(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    projects_service: ProjectDataService = Depends(get_project_data_service)
):
    """
    Get a project by ID for the authenticated user
    """
    logger.info(f"GET /get/{project_id} - Getting project for user: {current_user.supabase_user_id}")
    try:
        result = projects_service.get_project(
            project_id=project_id,
            user=current_user
        )
        
        logger.info(f"GET /get/{project_id} - Project retrieved successfully")
        return {
            "message": "Project retrieved successfully",
            "project": result
        }
        
    except HTTPException as e:
        logger.error(f"GET /get/{project_id} - HTTPException: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"GET /get/{project_id} - Exception: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve project: {str(e)}"
        )

@router.get("/list")
async def get_user_projects(
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    projects_service: ProjectDataService = Depends(get_project_data_service)
):
    """
    Get all projects for the authenticated user
    """
    logger.info(f"GET /list - Getting all projects for user: {current_user.supabase_user_id}")
    try:
        result = projects_service.get_user_projects(user=current_user)
        
        logger.info(f"GET /list - Retrieved {len(result)} projects for user")
        return {
            "message": "Projects retrieved successfully",
            "projects": result
        }
        
    except HTTPException as e:
        logger.error(f"GET /list - HTTPException: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"GET /list - Exception: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve projects: {str(e)}"
        )

@router.delete("/delete/{project_id}")
async def delete_project(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    projects_service: ProjectDataService = Depends(get_project_data_service)
):
    """
    Delete a project for the authenticated user
    """
    logger.info(f"DELETE /delete/{project_id} - Deleting project for user: {current_user.supabase_user_id}")
    try:
        result = projects_service.delete_project(
            project_id=project_id,
            user=current_user
        )
        
        logger.info(f"DELETE /delete/{project_id} - Project deleted successfully")
        return {
            "message": "Project deleted successfully",
            "deleted": result
        }
        
    except HTTPException as e:
        logger.error(f"DELETE /delete/{project_id} - HTTPException: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"DELETE /delete/{project_id} - Exception: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete project: {str(e)}"
        )