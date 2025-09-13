# reSourceProjects

Notes:
* Implement embeddings table with chunking
* Improve search algorithm to not solely rely on keywords
* Implement saving for folders backend
* Add guardrails for conversation length with chat bot
* Add images!!
* Add pdfs uploads!!
* Ensure users cannot embed large pdfs of a certain file size (like text books) but they should still be able to bring them into the project
    -Set upload size limit: ~30–40 MB (so big books are allowed to upload)
    -Set embedding size threshold: 10 MB
    -Show a “view-only” notice for larger files
* Have text box save to db

* Landing page with about and pricing
* Implement payment system
* Use composio to add extra tooling
* Use claude mcp for extra tooling as well

Quality of Life:
* Links found through websearch can be added to board via ui button
* Include meta data of all nodes in pinecone (created_at, last_updated)
* Add tools to claude
* Pdfs 
* Make node names wrap or truncate with ellipsis when name to long

Stretch Goals:
* Collaborative Projects
* Chat can make changes to board
* Use composio to add extra tooling
* Use claude mcp for extra tooling as well
* Add image nodes (process image and store metadata)
* Drag and drop nodes to chat to reference them
* Evaluate relative value and costs of using Mem0 after release


Production Checklist:
- Change Clerk signup webhook url to production url in (user.create, user.delete, user.update)
- Remove or suppress all the console logs
- Find all hardcoded instances of localhost and replace with environment variable

DONE:
* Add auto-saving functionality to docs -- DONE
* Implement saving for links -- DONE
* Add drag and drop creation of nodes -- DONE
* Automatically create a home project for each user -- DONE
* Implement folder functionality -- DONE
* Add creation of projects and switching between them -- DONE
* Add account management to the UI through clerk -- DONE
* Delete node functionality -- DONE
* Fetch user info on first load and propagate info to dashboard -- DONE
* Allow users to embed youtube videos -- DONE
* Text blocks -- DONE
* When a node window opens it should render above the other nodes (at least initially) -- DONE
* Re-open already opened windows on page load -- DONE
* Add on hover go to link button for link nodes -- DONE
* Youtube video embeddings -- DONE
* Allow user to embed google docs, presentations, etc (and open in window) -- KIND OF DONE
* On settings save update the name in the db (and link for link node) -- DONE