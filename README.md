# reSourceProjects

Notes:
* On settings save update the name in the db (and link for link node) -- DONE
* Implement embeddings table with chunking
* Improve search algorithm to not solely rely on keywords
* Add auto-saving functionality to docs -- DONE
* Implement saving for folders backend
* Implement saving for links -- DONE
* Add drag and drop creation of nodes -- DONE
* Automatically create a home project for each user -- DONE
* Implement folder functionality -- DONE
* Add creation of projects and switching between them -- DONE
* Add account management to the UI through clerk -- DONE
* Add guardrails for conversation length with chat bot
* Delete node functionality -- DONE
* Add images!!
* Add pdfs uploads!!
* Fetch user info on first load and propagate info to dashboard -- DONE
* Allow users to embed youtube videos -- DONE
* Allow user to embed google docs, presentations, etc (and open in window) -- KIND OF DONE
* Have text box save to db

* Landing page with about and pricing
* Implement payment system
* Use composio to add extra tooling
* Use claude mcp for extra tooling as well

Quality of Life:
* Re-open already opened windows on page load -- DONE
* Add on hover go to link button for link nodes -- DONE
* Youtube video embeddings -- DONE
* Links found through websearch can be added to board via ui button
* Include meta data of all nodes in pinecone (created_at, last_updated)
* Add tools to claude
* Pdfs 
* Text blocks -- DONE
* When a node window opens it should render above the other nodes (at least initially)

Stretch Goals:
* Collaborative Projects
* Chat can make changes to board
* Use composio to add extra tooling
* Use claude mcp for extra tooling as well
* Add image nodes (process image and store metadata)
* Drag and drop nodes to chat to reference them


Production Checklist:
- Change Clerk signup webhook url to production url in (user.create, user.delete, user.update)
- Remove or suppress all the console logs
- Find all hardcoded instances of localhost and replace with environment variable