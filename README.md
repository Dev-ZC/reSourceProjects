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