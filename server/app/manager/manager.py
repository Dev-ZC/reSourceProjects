from google import genai
from google.genai import types
from app.agents.slack_agent import SlackAgent
from app.agents.project_agent import ProjectAgent
from app.models.models import UserContext

import os
from dotenv import load_dotenv

load_dotenv()

class Manager:
    def __init__(self, authenticated_user=None, user_context=None, supabase_session=None, model_name: str = "gemini-2.5-flash") -> None:
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        self.model_name: str = model_name
        self.client = genai.Client(api_key=self.GEMINI_API_KEY)
        self.manager_context: str = self._load_manager_context()
        self.authenticated_user = authenticated_user
        self.user_context = user_context
        
        self.agents = {
            'slack_agent': SlackAgent(self.authenticated_user, self.user_context),
            'project_agent': ProjectAgent(
                authenticated_user=self.authenticated_user,
                user_context=self.user_context,
                supabase_session=supabase_session
            ),
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

    def _start_agent_conversation(self, initial_manager_response, original_user_prompt) -> str:
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
                print(f"Chat history: \n --- \n {chr(10).join(conversation_history)} \n --- \n")
                return agent_prompt
            elif agent_name.lower() == 'user_agent':
                # If user_agent is called, we can ask the user for clarification
                return f"user_agent: {conversation_history}"
            
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
    
    def continue_agent_conversation(self, conversation_history) -> str:
        """
        Continues an agent conversation given a conversation history list.
        """
        max_iterations = 10
        iterations = 0

        # Use the last manager message as the current message to parse next agent
        # Find the last message from the manager in the conversation history
        manager_messages = [msg for msg in conversation_history if msg.startswith("Manager:")]
        if not manager_messages:
            return "No manager message found to continue the conversation."
        current_message = manager_messages[-1].replace("Manager:", "", 1).strip()

        # Try to extract the original user prompt for context
        user_messages = [msg for msg in conversation_history if msg.startswith("User:")]
        original_user_prompt = user_messages[0].replace("User:", "", 1).strip() if user_messages else ""

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
                print(f"Chat history: \n --- \n {chr(10).join(conversation_history)} \n --- \n")
                return agent_prompt
            elif agent_name.lower() == 'user_agent':
                return f"user_agent: {conversation_history}"

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
            -response_agent: Provide a helpful response to be sent to the user based on conversation history.
            -user_agent: This agent is helpful for getting more clarification from the user (Tools: ask_user(question))
            -slack_agent: This agent is responsible for sending messages to Slack. (Tools: send_slack_message(message, channel))
            -project_agent: This agent is responsible for getting information related to the user's project and creating new docs (Tools: prompt_search_project_docs(query), create_document(self, doc_name: str, content: str))
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


# Testing
from supabase import create_client, Client  
    
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)  

# Authenticate and get session
response = supabase.auth.sign_in_with_password({
    "email": "zacole@usc.edu",
    "password": "password"
})

auth_user = response.user
session = response.session  # This is the key part!
user_context = UserContext(currProjectId="58b89576-ec2b-4d7c-aafd-2adb4b72d88e")

# Pass the session to your classes
manager = Manager(
    authenticated_user=auth_user, 
    user_context=user_context,
    supabase_session=session
)

#print(manager.user_chat("can you send a slack message to John Doe with the info from Quarter 2 results?"))
#print(manager.user_chat("what can you do?"))

# Works
#print(manager.user_chat("Create a document names apple poem with a poem about apples in the project docs."))

# Need to test (keep getting overload error so cant test)
print(manager.user_chat("Check the project docs to see if John Doe loves apples, if he does then create a doc with a poem about apples"))

# Test direct creation
# project_agent = ProjectAgent(
#     authenticated_user=auth_user, 
#     user_context=user_context,
#     supabase_session=session
# )

# result = project_agent.project_data_service.create_document(
#     project_id=user_context.currProjectId,
#     doc_name="Direct Gemini Doc with JWT",
#     content="This is a test document created with proper JWT session."
# )
# print("Direct create_document result:", result)

