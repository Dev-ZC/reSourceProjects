from google import genai
from google.genai import types
from app.services.project_data_service import ProjectDataService

import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

class ProjectAgent:
    def __init__(self, authenticated_user=None, model_name: str = "gemini-2.5-flash") -> None:
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        self.model_name = model_name
        self.client = genai.Client(api_key=self.GEMINI_API_KEY)
        self.project_context: str = self._load_project_agent_context()
        
        self.authenticated_user = authenticated_user
        self.project_data_service = ProjectDataService(self.authenticated_user)
    
    def chat(self, prompt) -> str:
        """
        Handles chat interactions related to project management.
        """

        response = self.client.models.generate_content(
            model=self.model_name,
            config=types.GenerateContentConfig(
                system_instruction=self.project_context),
            contents=prompt
        )
        return response.text
        
    # Functions for loading contexts
    def _load_project_agent_context(self):
        """
        Function to load relevant project agent context from txt file
        """
        # Will likely include several fetchs to users db of info
        temp_context = """
            You are an agent that specializes getting information related to the user project.
            Info avilable includes:
            - Doc Name: Quarter 2 results, Content: The Q2 results were subpar and need to be improved by next quarter.
            - Doc Name: Project Timeline, Content: The project is on track to be completed by the end of the year.
            - Doc Name: Team Members, Content: The team consists of Alice, Bob, and Charlie.
            - Doc Name: Budget, Content: The project budget is $100,000.
        """
        return temp_context
    
    def prompt_search_project_docs(self, query: str) -> str:
        """
        Function to search for relevant project information based on a query.
        """
        # This is a placeholder for the actual search logic
        # In a real implementation, this would query a database or an index
        return f"Search results for '{query}': [Mocked response with relevant project info]"