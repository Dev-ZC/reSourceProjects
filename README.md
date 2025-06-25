# reSourceProjects

* Tickets
    - Get user input in conversation (break loop, send message history to client, append user clarificiation, send back to server with direct call to start agent conversation)
    - Finish skeleton for slack_agent
    - Finish skeleton for basic_agent
    - Make search agent (could just a be a one function query with api)
    - When doc has no content dont send gemini query

Note:
* !!!When folders are implemented include metdata in doc embeddings
    -created_at, created_by, parent_folder, doc_name, etc

* Finish backend MVP functionality first then work on front end & REST

* When frontend receives 'user_agent: ...' from manager.user_chat then get user response then send entire chat history to new end point that will complete the interaction

* Frontend message history should only include messages output between user and manager

-- Add Tools: Update manager prompt, update agent prompt

* Store embeddings in chunks instead of full docs so only those chunks can be returned an searched instead of whole docs

* Project Agent Needs: get_all_project_related_metadata

* Agents themselves cant execute tools on their own if I want human in the loop
(temp fix could just have manager send the user agent to verify then go through same user agent loop)