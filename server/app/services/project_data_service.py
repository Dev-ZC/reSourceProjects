import os
from supabase import create_client, Client
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

class ProjectDataService:
    def __init__(self, authenticated_user=None, supabase_session=None):
        self.url: str = os.getenv("SUPABASE_URL")
        self.key: str = os.getenv("SUPABASE_KEY")
        self.supabase: Client = create_client(self.url, self.key)
        self.authenticated_user = authenticated_user
        
        # Set the session if provided
        if supabase_session:
            self.supabase.auth.set_session(
                access_token=supabase_session.access_token,
                refresh_token=supabase_session.refresh_token
            )
        
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        self.model_name: str = "text-embedding-004"
        self.client = genai.Client(api_key=self.GEMINI_API_KEY)
        
    # ====> Testing <====
    def authenticate_test_user(self, email: str, password: str):
        """Sign in a test user"""
        try:
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            self.authenticated_user = response.user
            return response.user
        except Exception as e:
            print(f"Auth error: {e}")
            return None
        
    def set_authenticated_user(self, user):
        self.authenticated_user = user
        
    # ====> Project Management Functions <====
    def get_user_projects(self):
        """
        Retrieve all projects for the authenticated user.
        """
        if not self.authenticated_user:
            raise Exception("No authenticated user")
        try:
            response = self.supabase.table("projects").select("*").eq("user_id", self.authenticated_user.id).execute()
        except Exception as e:
            raise Exception(f"Supabase error: {str(e)}")
        return response.data

    def create_project(self, project_name: str):
        """
        Creates a project given a project name
        """
        if not self.authenticated_user:
            raise Exception("No authenticated user")
        try:
            response = self.supabase.table("projects").insert({
                "project_name": project_name,
                "user_id": self.authenticated_user.id
            }).execute()
        except Exception as e:
            raise Exception(f"Supabase error: {str(e)}")
        return response.data

    def delete_project(self, project_id: str):
        """
        Delete a project by its ID.
        """
        if not self.authenticated_user:
            raise Exception("No authenticated user")
        try:
            response = self.supabase.table("projects").delete().eq("id", project_id).eq("user_id", self.authenticated_user.id).execute()
        except Exception as e:
            raise Exception(f"Supabase error: {str(e)}")
        return response.data
    
    # ====> Document Management Functions <====
    def create_document(self, project_id: str, doc_name: str, content: str):
        """
        Create a new document in the database.
        """
        
        if not self.authenticated_user:
            raise Exception("No authenticated user")
        
        try:
            result = self.client.models.embed_content(
                model=self.model_name,
                contents=content,
                config=types.EmbedContentConfig(task_type="SEMANTIC_SIMILARITY")
            )
            
            if result.embeddings:
                embedding_values = list(result.embeddings[0].values)
            else:
                raise Exception("No embeddings returned")
                
        except Exception as e:
            raise Exception(f"Embedding generation error: {str(e)}")
        
        try:
            response = self.supabase.table("docs").insert({
                "project_id": project_id,
                "doc_name": doc_name,
                "content": content,
                "user_id": self.authenticated_user.id,
                "embedding": embedding_values
            }).execute()
        except Exception as e:
            raise Exception(f"Supabase error: {str(e)}")
        return response.data

    def update_document_content(self, doc_id: str, content: str):
        """
        Update an existing document in the database.
        """
        if not self.authenticated_user:
            raise Exception("No authenticated user")
        
        try:
            result = self.client.models.embed_content(
                model=self.model_name,
                contents=content,
                config=types.EmbedContentConfig(task_type="SEMANTIC_SIMILARITY")
            )
            
            if result.embeddings:
                embedding_values = list(result.embeddings[0].values)
            else:
                raise Exception("No embeddings returned")
                
        except Exception as e:
            raise Exception(f"Embedding generation error: {str(e)}")
        
        try:
            response = self.supabase.table("docs").update({
                "content": content,
                "embedding": embedding_values
            }).eq("id", doc_id).eq("user_id", self.authenticated_user.id).execute()
        except Exception as e:
            raise Exception(f"Supabase error: {str(e)}")
        
        return response.data

    def get_project_documents(self, project_id: str):
        """
        Retrieve all documents for a given project.
        """
        if not self.authenticated_user:
            raise Exception("No authenticated user")
        try:
            response = self.supabase.table("docs").select("*").eq("project_id", project_id).execute()
        except Exception as e:
            raise Exception(f"Supabase error: {str(e)}")
        return response.data

    def get_document(self, doc_id: str):
        """
        Retrieve a specific document by its ID.
        """
        if not self.authenticated_user:
            raise Exception("No authenticated user")
        try:
            response = self.supabase.table("docs").select("*").eq("id", doc_id).execute()
        except Exception as e:
            raise Exception(f"Supabase error: {str(e)}")
        return response.data

    def delete_document(self, doc_id: str):
        """
        Delete a document by its ID.
        """
        if not self.authenticated_user:
            raise Exception("No authenticated user")
        try:
            response = self.supabase.table("docs").delete().eq("id", doc_id).execute()
        except Exception as e:
            raise Exception(f"Supabase error: {str(e)}")
        return response.data
    
    def doc_similarity_search(self, query: str, project_id: str, match_threshold: float = 0.5, match_count: int = 10):
        """
        Perform a similarity search on documents within a project.
        Returns a list of matching doc ids.
        """
        if not self.authenticated_user:
            raise Exception("No authenticated user")
        
        try:
            # Generate embedding for the query
            result = self.client.models.embed_content(
                model=self.model_name,
                contents=query,
                config=types.EmbedContentConfig(task_type="SEMANTIC_SIMILARITY")
            )
            
            if not result.embeddings:
                raise Exception("No embeddings returned for query")
            
            query_embedding = list(result.embeddings[0].values)
            
            # Call the PostgreSQL function with UUID parameters
            response = self.supabase.rpc(
                'match_documents',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': match_threshold,
                    'match_count': match_count,
                    'filter_project_id': project_id,  # String UUID will be converted
                    'filter_user_id': self.authenticated_user.id  # String UUID will be converted
                }
            ).execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            raise Exception(f"Similarity search error: {str(e)}")
        
    def get_single_doc_embeddings(self, doc_id: str):
        """
        Retrieve the embeddings for a specific document.
        """
        if not self.authenticated_user:
            raise Exception("No authenticated user")
        try:
            response = self.supabase.table("docs").select("embedding").eq("id", doc_id).execute()
            if response.data:
                return response.data[0]['embedding']
            else:
                return None
        except Exception as e:
            raise Exception(f"Supabase error: {str(e)}")
        
    def get_multiple_doc_embeddings(self, doc_ids: list):
        """
        Retrieve the embeddings for a list of document IDs.
        Returns a dictionary mapping doc_id to embedding.
        """
        if not self.authenticated_user:
            raise Exception("No authenticated user")
        if not doc_ids:
            return {}

        try:
            response = self.supabase.table("docs").select("id,embedding").in_("id", doc_ids).execute()
            if not response.data:
                raise Exception("No data returned from Supabase.")
            # Build a dictionary mapping doc_id to embedding
            return {doc["id"]: doc["embedding"] for doc in response.data if "embedding" in doc}
        except Exception as e:
            raise Exception(f"Supabase error: {str(e)}")
        
        
    
#test_user_id="81bac8b9-3fc3-4d22-82c6-46a52f252028"
#test_project_id=""

# Example usage:
#project_data_service = ProjectDataService()
#print(project_data_service.authenticate_test_user("zacole@usc.edu", "password"))

#print(project_data_service.create_project("test_project_2"))
#print(project_data_service.get_user_projects())
#print(project_data_service.create_document("58b89576-ec2b-4d7c-aafd-2adb4b72d88e", "test_doc_with_embeddings_3", "work?"))
#print(project_data_service.get_project_documents("58b89576-ec2b-4d7c-aafd-2adb4b72d88e"))
#print(project_data_service.update_document_content("f10a9a34-0c8f-49c6-af96-20a599b4665a", "john doe loves apples and hates bananas"))

#print(project_data_service.get_document("302caa9e-edd7-4d67-a58e-1b88272c7bb8"))
#print(project_data_service.delete_document("302caa9e-edd7-4d67-a58e-1b88272c7bb8"))

#print(project_data_service.doc_similarity_search("bananas and apples", "58b89576-ec2b-4d7c-aafd-2adb4b72d88e"))
#print(project_data_service.get_multiple_doc_embeddings(["f10a9a34-0c8f-49c6-af96-20a599b4665a", "3214f7a3-bcdc-417a-865c-28ffc416660b"]))

