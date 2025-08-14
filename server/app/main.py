from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import hello
from app.routers.users import router as users_router
from app.routers.chat import router as chat_router
from app.routers.flow import router as flow_router

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React's default port
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routes
app.include_router(hello.router)
app.include_router(users_router)
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(flow_router, prefix="/api/flow", tags=["flow"])

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}