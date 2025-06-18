from google import genai
from google.genai import types

import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

class SlackAgent:
    def __init__(self, model_name: str = "gemini-2.5-flash") -> None:
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        self.model_name = model_name
        self.client = genai.Client(api_key=self.GEMINI_API_KEY)
        self.slack_context: str = self._load_slack_agent_context()
    
    def chat(self, prompt) -> str:
        """
        Handles chat interactions with manager agent then 
        """
        
        # response = self.client.models.generate_content(
        #     model="gemini-2.5-flash",
        #     config=types.GenerateContentConfig(
        #         system_instruction=self.manager_context),
        #     contents=prompt
        # )
        
        return "Your request was succcessful"
        
    # Functions for loading contexts
    def _load_slack_agent_context(self):
        """
        Function to load relevent slack context from txt file
        """
        
        temp_context = """
            You are an agent that specializes in handling Slack interections. 
        """
        
        return temp_context