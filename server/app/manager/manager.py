from google import genai
from google.genai import types
from app.agents.slack_agent import SlackAgent

import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

class Manager:
    def __init__(self, model_name: str = "gemini-2.5-flash") -> None:
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        self.model_name = model_name
        self.client = genai.Client(api_key=self.GEMINI_API_KEY)
        self.manager_context: str = self._load_manager_context()
        self.agents = {
            'slack_agent': SlackAgent(),
        }
    
    def user_chat(self, prompt) -> str:
        """
        Function handles user chat interactions, and calls agent chat if needed
        """
        # Initial response from the manager agent
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=self.manager_context),
            contents=prompt
        )
        
        # Start agent conversation with the manager's response
        response = self._start_agent_conversation(response.text, prompt)
        
        return response

    def _start_agent_conversation(self, initial_manager_response, original_user_prompt):
        """
        Starts a conversation with the agent team using string-based conversation tracking.
        Loops until the response agent is called to summarize the conversation.
        """
        conversation_history = [
            f"User: {original_user_prompt}",
            f"Manager: {initial_manager_response}"
        ]
        max_iterations = 10
        iterations = 0
        
        current_message = initial_manager_response
        
        while iterations < max_iterations:
            iterations += 1
            
            # Parse the agent name and prompt from the manager's response
            if ':' not in current_message:
                # If no agent specified, break the loop
                break
                
            try:
                agent_name, agent_prompt = current_message.split(':', 1)
                agent_name = agent_name.strip()
                agent_prompt = agent_prompt.strip()
            except ValueError:
                # If parsing fails, break the loop
                break
            
            # Check if response_agent is called (end condition)
            if agent_name.lower() == 'response_agent':
                # Extract the summary and return it
                return agent_prompt
            
            # Call the specified agent
            agent_response = self._call_agent(agent_name, agent_prompt)
            conversation_history.append(f"{agent_name}: {agent_response}")
            
            # Send agent response back to manager for next decision
            manager_prompt = f"""
            Original user request: {original_user_prompt}
            
            Conversation so far:
            {chr(10).join(conversation_history)}
            
            Agent {agent_name} just responded with: {agent_response}
            
            What should happen next? Remember to use response_agent when you have enough information to respond to the user or when you cannot complete the request.
            """
            
            manager_response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                config=types.GenerateContentConfig(
                    system_instruction=self.manager_context),
                contents=manager_prompt
            )
            
            current_message = manager_response.text
            conversation_history.append(f"Manager: {current_message}")
        
        # If we exit the loop without calling response_agent, return a fallback
        return "I was unable to complete your request. The conversation exceeded the maximum number of iterations or encountered an error."

    def _call_agent(self, name, prompt):
        """
        Handles calling an agent with the given name and prompt.
        """
        agent_name = name.lower()
        
        if agent_name in self.agents:
            try:
                return self.agents[agent_name].chat(prompt)
            except Exception as e:
                return f"Error calling agent {agent_name}: {str(e)}"
        
        available_agents = ', '.join(self.agents.keys())
        return f"Unable to find agent: {name}. Available agents: {available_agents}"
    
    # Functions for loading contexts
    def _load_manager_context(self):
        """
        Function to load relevent manager context from txt file
        """
        
        temp_context = """
            You are a manager of a team of agents with the goal of completing the user's request.
            REMEMBER: To end the conversation, you must use the response_agent to provide a summary of the conversation.
            You must end a conversation when you realize that you have enough information to respond to the user OR you are unable to complete the user's request.
            \n
            Available agents:
            -response_agent: Provide a summary of actions to the agent so it can respond to the user. (Tools: respond_to_user(summary))
            -user_agent: This agent is helpful for getting more clarification from the user (Tools: ask_user(question))
            -slack_agent: This agent is responsible for sending messages to Slack. (Tools: send_slack_message(message, channel))
            \n
            Agents can only complete one task at a time so if you need multiple tasks completed by the same agent, you must call the agent again after it responds to the initial request.
            You may only output the name of the agent you want to use, and the prompt you want to send to it.
            You will not output any other text. The following is an example of how to format your response:
            'agent_name: agent_prompt' in practice, it would look like this: 'slack_agent: Send a message to the John Doe'
            \n
            NOTE: Carefully assess the user's request before using any agents to determine whether you can 
            respond accurately by just prompting the response_agent or if the task cannot be completed given currently available context, info, and agents.
        """
        
        return temp_context
    
    def _load_project_context(self, project_id):
        "Function to load the context of a project"
        pass
    
    def _load_user_context(self, user_id):
        "Function to load the context of a user"
        pass
    
manager = Manager()

print(manager.user_chat("What is the capital of texas?"))

