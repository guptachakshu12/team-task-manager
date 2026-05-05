from pydantic import BaseModel, EmailStr

class SignupSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "member"

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class ProjectSchema(BaseModel):
    title: str
    description: str = ""

class AddMemberSchema(BaseModel):
    user_id: int

class TaskSchema(BaseModel):
    title: str
    project_id: int
    assigned_to: int
    due_date: str
    status: str = "pending"

class TaskUpdateSchema(BaseModel):
    status: str