from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routes.auth_routes import router as auth_router
from routes.task_routes import router as task_router
from routes.project_routes import router as project_router

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(project_router, prefix="/projects", tags=["Projects"])
app.include_router(task_router, prefix="/tasks", tags=["Tasks"])