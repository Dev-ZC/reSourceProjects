from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict, Any
from pydantic import BaseModel
from supabase import Client
from app.auth import get_current_user_from_cookies, get_supabase_client, AuthenticatedUser
from app.services.docs_data_service import get_docs_data_service, DocsDataService

router = APIRouter(tags=["docs"])

class DocumentCreate(BaseModel):
    project_id: str
    doc_name: str
    content: str

class DocumentUpdate(BaseModel):
    doc_name: Optional[str] = None
    content: Optional[str] = None

@router.post("/create")
async def create_document(
    doc_data: DocumentCreate,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    docs_service: DocsDataService = Depends(get_docs_data_service)
):
    """
    Create a new document for the authenticated user
    """
    try:
        result = docs_service.create_document(
            project_id=doc_data.project_id,
            doc_name=doc_data.doc_name,
            content=doc_data.content,
            user=current_user
        )
        
        return {
            "message": "Document created successfully",
            "document": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create document: {str(e)}"
        )

@router.put("/update/{doc_id}")
async def update_document(
    doc_id: str,
    doc_data: DocumentUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    docs_service: DocsDataService = Depends(get_docs_data_service)
):
    """
    Update an existing document for the authenticated user
    """
    try:
        result = docs_service.update_document(
            doc_id=doc_id,
            doc_name=doc_data.doc_name,
            content=doc_data.content,
            user=current_user
        )
        
        return {
            "message": "Document updated successfully",
            "document": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update document: {str(e)}"
        )

@router.get("/get/{doc_id}")
async def get_document(
    doc_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    docs_service: DocsDataService = Depends(get_docs_data_service)
):
    """
    Get a document by ID for the authenticated user
    """
    try:
        result = docs_service.get_document(
            doc_id=doc_id,
            user=current_user
        )
        
        return {
            "message": "Document retrieved successfully",
            "document": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve document: {str(e)}"
        )

@router.delete("/delete/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user_from_cookies),
    docs_service: DocsDataService = Depends(get_docs_data_service)
):
    """
    Delete a document for the authenticated user
    """
    try:
        result = docs_service.delete_document(
            doc_id=doc_id,
            user=current_user
        )
        
        return {
            "message": "Document deleted successfully",
            "deleted": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )