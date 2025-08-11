from fastapi import FastAPI
from app.routers import hello
from app.routers.users import router as users_router
from app.routers.chat import router as chat_router

app = FastAPI()

# Include routes
app.include_router(hello.router)
app.include_router(users_router)
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}