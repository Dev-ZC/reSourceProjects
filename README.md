# reSourceProjects

* Tickets
    - Get user input in conversation (break loop, send message history to client, append user clarificiation, send back to server with direct call to start agent conversation)
    - Finish skeleton for slack_agent
    - Finish skeleton for basic_agent
    - Make search agent (could just a be a one function query with api)
    - When doc has no content dont send gemini query

Note:
* On settings save update the name in the db (and link for link node)
* Implement doc embeddings table with chunking
* Improve search algorithm to not solely rely on keywords
* Add auto-saving functionality to docs
* Implement saving for folders
* Implement saving for links
* Add drag and drop creation of nodes -- DONE
* Implement folder functionality
* Add creation of projects and switching between them
* Add account management to the UI through clerk
* Add guardrails for conversation length with chat bot
* Delete node functionality
* Add images
* Add pdfs uploads
* Fetch user info on first load and propagate info to dashboard

* Landing page with about and pricing
* Implement payment system
* Use composio to add extra tooling
* Use claude mcp for extra tooling as well


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

Edge Cases:
-Save entire project prior to starting agent conversation
(if an edit to a doc occurs then the user wants to query it, we need
to save the edit to the db prior to making the request)



Production Checklist:
- Change Clerk signup webhook url to production url in (user.create, user.delete, user.update)