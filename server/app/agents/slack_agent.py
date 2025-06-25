from google import genai
from google.genai import types

import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

class SlackAgent:
    def __init__(self, authenticated_user=None, model_name: str = "gemini-2.5-flash") -> None:
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        self.model_name = model_name
        self.client = genai.Client(api_key=self.GEMINI_API_KEY)
        self.slack_context: str = self._load_slack_agent_context()
        
        self.authenticated_user = authenticated_user
    
    def chat(self, prompt) -> str:
        """
        Handles chat interactions with manager agent then 
        """
        
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=self.slack_context),
            contents=prompt
        )
        
        return response.text
        
    # Functions for loading contexts
    def _load_slack_agent_context(self):
        """
        Function to load relevent slack context from txt file
        """
        
        temp_context = """
            You are an agent that specializes in handling Slack interections. 
            For now you will mock data back to the manager (since you tools are not yet implemented yet).
            Go along with the requests of the manager agent, eventually returning a successful mocked response.
        """
        
        return temp_context