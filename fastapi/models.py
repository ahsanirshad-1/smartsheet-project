from pydantic import BaseModel, EmailStr, validator
from typing import Optional

# Task Model
class Task(BaseModel):
    taskname: str
    assign: str
    status: str
    startdate: str
    enddate: str
    sendReminder: bool = False

# Daily Task Model
class DailyTask(BaseModel):
    name: str
    date: str  # YYYY-MM-DD

# Team Member Model
class TeamMember(BaseModel):
    name: str
    email: EmailStr
    team: str

# User Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class User(BaseModel):
    username: str
    email: EmailStr
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class RefreshToken(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    username: Optional[str] = None
