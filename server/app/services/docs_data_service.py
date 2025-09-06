from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException
from supabase import Client

from ..auth import get_supabase_client, AuthenticatedUser

class DocsDataService:
    """
    Service class for handling basic document CRUD operations using Supabase.
    Leverages the Supabase client from auth.py for consistency.
    """
    
    def __init__(self, supabase_client: Client = Depends(get_supabase_client)):
        self.supabase = supabase_client
    
    def create_document(
        self, 
        project_id: str, 
        doc_name: str, 
        content: str, 
        user: AuthenticatedUser
    ) -> Dict[str, Any]:
        """
        Create a new document in the database.
        """
        try:
            # Insert document into database
            response = self.supabase.table("docs").insert({
                "project_id": project_id,
                "doc_name": doc_name,
                "content": content,
                "user_id": user.supabase_user_id
            }).execute()
            
            if not response.data:
                raise HTTPException(status_code=500, detail="Failed to create document")
                
            return response.data[0]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    def update_document(
        self, 
        doc_id: str, 
        doc_name: Optional[str] = None, 
        content: Optional[str] = None, 
        user: AuthenticatedUser = None
    ) -> Dict[str, Any]:
        """
        Update an existing document. Can update name, content, or both.
        """
        try:
            update_data = {}
            
            if doc_name is not None:
                update_data["doc_name"] = doc_name
                
            if content is not None:
                update_data["content"] = content
            
            if not update_data:
                raise HTTPException(status_code=400, detail="No update data provided")
            
            response = self.supabase.table("docs").update(update_data).eq("id", doc_id).eq("user_id", user.supabase_user_id).execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Document not found or update failed")
                
            return response.data[0]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    def get_document(self, doc_id: str, user: AuthenticatedUser) -> Dict[str, Any]:
        """
        Get a document by its ID.
        """
        try:
            response = self.supabase.table("docs").select("*").eq("id", doc_id).eq("user_id", user.supabase_user_id).execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Document not found")
                
            return response.data[0]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    def delete_document(self, doc_id: str, user: AuthenticatedUser) -> bool:
        """
        Delete a document by its ID.
        """
        try:
            response = self.supabase.table("docs").delete().eq("id", doc_id).eq("user_id", user.supabase_user_id).execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Document not found")
                
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Dependency function to get DocsDataService instance
def get_docs_data_service(supabase_client: Client = Depends(get_supabase_client)) -> DocsDataService:
    """
    Dependency function to provide DocsDataService instance.
    """
    return DocsDataService(supabase_client)