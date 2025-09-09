from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException
from supabase import Client

from ..auth import get_supabase_client, AuthenticatedUser

class LinksDataService:
    """
    Service class for handling basic link CRUD operations using Supabase.
    Leverages the Supabase client from auth.py for consistency.
    """
    
    def __init__(self, supabase_client: Client = Depends(get_supabase_client)):
        self.supabase = supabase_client
    
    def create_link(
        self, 
        project_id: str, 
        url: str, 
        string: str, 
        user: AuthenticatedUser
    ) -> Dict[str, Any]:
        """
        Create a new link in the database.
        """
        try:
            # Insert link into database
            response = self.supabase.table("links").insert({
                "project_id": project_id,
                "url": url,
                "string": string,
                "user_id": user.supabase_user_id
            }).execute()
            
            if not response.data:
                raise HTTPException(status_code=500, detail="Failed to create link")
                
            return response.data[0]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    def update_link(
        self, 
        link_id: str, 
        url: Optional[str] = None, 
        string: Optional[str] = None, 
        user: AuthenticatedUser = None
    ) -> Dict[str, Any]:
        """
        Update an existing link. Can update url, string, or both.
        """
        try:
            update_data = {}
            
            if url is not None:
                update_data["url"] = url
                
            if string is not None:
                update_data["string"] = string
            
            if not update_data:
                raise HTTPException(status_code=400, detail="No update data provided")
            
            response = self.supabase.table("links").update(update_data).eq("id", link_id).eq("user_id", user.supabase_user_id).execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Link not found or update failed")
                
            return response.data[0]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    def get_link(self, link_id: str, user: AuthenticatedUser) -> Dict[str, Any]:
        """
        Get a link by its ID.
        """
        try:
            response = self.supabase.table("links").select("*").eq("id", link_id).eq("user_id", user.supabase_user_id).execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Link not found")
                
            return response.data[0]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    def delete_link(self, link_id: str, user: AuthenticatedUser) -> bool:
        """
        Delete a link by its ID.
        """
        try:
            response = self.supabase.table("links").delete().eq("id", link_id).eq("user_id", user.supabase_user_id).execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Link not found")
                
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Dependency function to get LinksDataService instance
def get_links_data_service(supabase_client: Client = Depends(get_supabase_client)) -> LinksDataService:
    """
    Dependency function to provide LinksDataService instance.
    """
    return LinksDataService(supabase_client)