from google import genai
from google.genai import types
from app.services.project_data_service import ProjectDataService

import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# === > To add < ===
# search be name (instead of search by content, might already work since name is in embeddedings)
# get metadata of all project docs
# get all docs, get one doc
class ProjectAgent:
    def __init__(self, authenticated_user=None, user_context=None, supabase_session=None, model_name: str = "gemini-2.5-flash") -> None:
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        self.model_name = model_name
        self.client = genai.Client(api_key=self.GEMINI_API_KEY)
        self.project_context: str = self._load_project_agent_context()
        
        self.authenticated_user = authenticated_user
        self.user_context = user_context
        
        # Initialize service and pass the supabase session
        self.project_data_service = ProjectDataService(
            authenticated_user=self.authenticated_user,
            supabase_session=supabase_session
        )
    
    def chat(self, prompt) -> str:
        """
        Handles chat interactions with tool calling support.
        """
        # Define available tools
        tools = [
            types.Tool(
                function_declarations=[
                    types.FunctionDeclaration(
                        name="search_project_documents",
                        description="Search through project documents to find relevant information based on a query",
                        parameters=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "query": types.Schema(
                                    type=types.Type.STRING,
                                    description="The search query to find relevant project documents"
                                )
                            },
                            required=["query"]
                        )
                    ),
                    types.FunctionDeclaration(
                        name="create_document",
                        description="Create a new project document with the given name and content",
                        parameters=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "doc_name": types.Schema(
                                    type=types.Type.STRING,
                                    description="The name/title of the document to create"
                                ),
                                "content": types.Schema(
                                    type=types.Type.STRING,
                                    description="The content/text of the document to create"
                                )
                            },
                            required=["doc_name", "content"]
                        )
                    )
                ]
            )
        ]

        response = self.client.models.generate_content(
            model=self.model_name,
            config=types.GenerateContentConfig(
                system_instruction=self.project_context,
                tools=tools
            ),
            contents=prompt
        )
        
        # Check if the model wants to use a tool
        if response.candidates[0].content.parts[0].function_call:
            function_call = response.candidates[0].content.parts[0].function_call
            
            if function_call.name == "search_project_documents":
                # Execute the search tool
                query = function_call.args["query"]
                search_result = self.prompt_search_project_docs(query)
                
                # Send the tool result back to the model
                tool_response = self.client.models.generate_content(
                    model=self.model_name,
                    config=types.GenerateContentConfig(
                        system_instruction=self.project_context
                    ),
                    contents=[
                        prompt,
                        types.Content(
                            parts=[types.Part(
                                function_call=function_call
                            )]
                        ),
                        types.Content(
                            parts=[types.Part(
                                function_response=types.FunctionResponse(
                                    name="search_project_documents",
                                    response={"result": search_result}
                                )
                            )]
                        )
                    ]
                )
                return tool_response.text
            
            elif function_call.name == "create_document":
                # Execute the create document tool
                doc_name = function_call.args["doc_name"]
                content = function_call.args["content"]
                create_result = self.create_document(doc_name, content)
                
                # Send the tool result back to the model
                tool_response = self.client.models.generate_content(
                    model=self.model_name,
                    config=types.GenerateContentConfig(
                        system_instruction=self.project_context
                    ),
                    contents=[
                        prompt,
                        types.Content(
                            parts=[types.Part(
                                function_call=function_call
                            )]
                        ),
                        types.Content(
                            parts=[types.Part(
                                function_response=types.FunctionResponse(
                                    name="create_document",
                                    response={"result": create_result}
                                )
                            )]
                        )
                    ]
                )
                return tool_response.text
        
        return response.text
        
    # Functions for loading contexts
    def _load_project_agent_context(self):
        """
        Function to load relevant project agent context from txt file
        """
        # Will likely include several fetchs to users db of info
        temp_context = """
            You are an agent that specializes in getting information related to the documents in the users project.
            If you are called it is likely that the information is in the users docs. Provide detailed and thorough responses.
        """
        return temp_context
    
    def prompt_search_project_docs(self, query: str) -> str:
        """
        Improved RAG implementation for searching project documents.
        Uses embeddings for retrieval but only passes relevant text content to Gemini.
        """
        # Get the current project ID from the user context
        project_id = None
        if self.user_context and hasattr(self.user_context, "currProjectId"):
            project_id = self.user_context.currProjectId
        if not project_id:
            return "No current project selected in user context."
        
        try:
            # 1. Find similar documents using embedding-based similarity search
            matches = self.project_data_service.doc_similarity_search(
                query=query,
                project_id=project_id,
                match_threshold=0.7,  # Increased threshold for better quality
                match_count=3  # Reduced count to focus on most relevant
            )
            
            if not matches:
                return f"No relevant documents found for '{query}'."
            
            # 2. Extract and prepare context from matching documents
            context_chunks = []
            for match in matches:
                doc_name = match.get('doc_name', 'Unknown Document')
                content = match.get('content', '')
                similarity_score = match.get('similarity', 0)
                
                # Optional: Truncate very long content to manage token limits
                max_chunk_length = 2000  # Adjust based on your needs
                if len(content) > max_chunk_length:
                    content = content[:max_chunk_length] + "..."
                
                context_chunks.append({
                    'name': doc_name,
                    'content': content,
                    'score': similarity_score
                })
            
            # 3. Build context string for the prompt
            context_text = ""
            for i, chunk in enumerate(context_chunks, 1):
                context_text += f"Document {i}: {chunk['name']}\n"
                context_text += f"Content: {chunk['content']}\n"
                context_text += f"Relevance Score: {chunk['score']:.3f}\n\n"
            
            # 4. Create focused prompt without embeddings
            gemini_prompt = f"""Based on the following project documents, please answer the user's query.
                User Query: {query}

                Relevant Project Documents:
                {context_text}

                Instructions:
                - Answer based primarily on the provided documents
                - If the documents don't contain enough information, clearly state this
                - Cite which document(s) you're referencing in your answer by its title not number"""

            # 5. Make the Gemini call with proper configuration
            response = self.client.models.generate_content(
                model=self.model_name,
                config=types.GenerateContentConfig(
                    system_instruction=self.project_context,
                    temperature=0.1,  # Lower temperature for more focused responses
                    max_output_tokens=1024  # Adjust as needed
                ),
                contents=gemini_prompt
            )
            
            return response.text
            
        except Exception as e:
            return f"Error searching project documents: {str(e)}"

    def create_document(self, doc_name: str, content: str) -> str:
        """
        Create a new document in the current project.
        """
        # Get the current project ID from the user context
        project_id = None
        if self.user_context and hasattr(self.user_context, "currProjectId"):
            project_id = self.user_context.currProjectId
        if not project_id:
            return "No current project selected in user context."
        
        try:
            result = self.project_data_service.create_document(
                project_id=project_id,
                doc_name=doc_name,
                content=content
            )
            return f"Successfully created document '{doc_name}' with {len(content)} characters of content."
        except Exception as e:
            return f"Error creating document: {str(e)}"