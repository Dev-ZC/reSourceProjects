from typing import Optional, Dict, Any, List
from fastapi import Depends, HTTPException
from supabase import Client

from ..auth import get_supabase_client, AuthenticatedUser

class ProjectDataService:
    """
    Service class for handling project CRUD operations using Supabase.
    Leverages the Supabase client from auth.py for consistency.
    """
    
    def __init__(self, supabase_client: Client = Depends(get_supabase_client)):
        self.supabase = supabase_client
    
    def create_project(
        self, 
        project_name: str, 
        user: AuthenticatedUser = None
    ) -> Dict[str, Any]:
        """
        Create a new project in the database.
        """
        try:
            project_data = {
                "project_name": project_name,
                "user_id": user.supabase_user_id
            }
            
            response = self.supabase.table("projects").insert(project_data).execute()
            
            if not response.data:
                raise HTTPException(status_code=500, detail="Failed to create project")
                
            return response.data[0]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    def update_project(
        self, 
        project_id: str, 
        project_name: str, 
        user: AuthenticatedUser = None
    ) -> Dict[str, Any]:
        """
        Update an existing project name.
        """
        try:
            update_data = {"project_name": project_name}
            
            response = self.supabase.table("projects").update(update_data).eq("id", project_id).eq("user_id", user.supabase_user_id).execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Project not found or update failed")
                
            return response.data[0]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    def get_project(self, project_id: str, user: AuthenticatedUser) -> Dict[str, Any]:
        """
        Get a project by its ID.
        """
        try:
            response = self.supabase.table("projects").select("*").eq("id", project_id).eq("user_id", user.supabase_user_id).execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Project not found")
                
            return response.data[0]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    def get_user_projects(self, user: AuthenticatedUser) -> List[Dict[str, Any]]:
        """
        Get all projects for a user.
        """
        try:
            response = self.supabase.table("projects").select("*").eq("user_id", user.supabase_user_id).execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    def delete_project(self, project_id: str, user: AuthenticatedUser) -> bool:
        """
        Delete a project by its ID.
        """
        try:
            response = self.supabase.table("projects").delete().eq("id", project_id).eq("user_id", user.supabase_user_id).execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Project not found")
                
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Dependency function to get ProjectDataService instance
def get_project_data_service(supabase_client: Client = Depends(get_supabase_client)) -> ProjectDataService:
    """
    Dependency function to provide ProjectDataService instance.
    """
    return ProjectDataService(supabase_client)