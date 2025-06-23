from fastapi import FastAPI
from app.routers import hello, users

app = FastAPI()

# Include routes
app.include_router(hello.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}