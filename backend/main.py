from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pymongo import MongoClient
import time

# Database setup with retry logic
def connect_to_mongodb():
    max_retries = 10
    retry_delay = 2
    for attempt in range(max_retries):
        try:
            mongo_client = MongoClient(
                'mongodb:27017',
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=5000
            )
            # Test the connection
            mongo_client.admin.command('ping')
            print("Successfully connected to MongoDB")
            return mongo_client
        except Exception as e:
            print(f"MongoDB connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                raise e

mongo_client = connect_to_mongodb()
mongo_db = mongo_client['task_manager']
users_col = mongo_db['users']
tasks_col = mongo_db['tasks']
daily_col = mongo_db['daily']
team_col = mongo_db['teams']

# FastAPI app
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

from fastapi.security import OAuth2PasswordRequestForm

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Task(BaseModel):
    taskname: str
    assign: str
    status: str
    startdate: str
    enddate: str
    email: Optional[str] = None
    send_reminder: Optional[bool] = False

class DailyTask(BaseModel):
    name: str
    assign: str
    description: str
    date: str

class TeamMember(BaseModel):
    name: str
    email: str
    team: str

# Utils
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

# Routes
@app.post("/register", response_model=Token)
async def register(user: UserCreate):
    hashed_password = get_password_hash(user.password)
    if users_col.find_one({"username": user.username}) or users_col.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Username or email already registered")
    user_doc = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password
    }
    users_col.insert_one(user_doc)
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

import logging

logger = logging.getLogger("uvicorn.error")

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    logger.info(f"Login attempt for user: {form_data.username}")
    user = users_col.find_one({"username": form_data.username})
    if not user:
        logger.warning(f"User not found: {form_data.username}")
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not verify_password(form_data.password, user["hashed_password"]):
        logger.warning(f"Invalid password for user: {form_data.username}")
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": form_data.username})
    logger.info(f"User logged in successfully: {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/tasks", response_model=List[Task])
async def get_tasks(status: Optional[str] = Query(None), assign: Optional[str] = Query(None), startdate: Optional[str] = Query(None), enddate: Optional[str] = Query(None)):
    query = {}
    if status:
        query["status"] = status
    if assign:
        query["assign"] = assign
    if startdate:
        query["startdate"] = {"$gte": startdate}
    if enddate:
        query["enddate"] = {"$lte": enddate}
    tasks = []
    for task_doc in tasks_col.find(query):
        tasks.append(Task(
            taskname=task_doc.get("taskname"),
            assign=task_doc.get("assign"),
            status=task_doc.get("status"),
            startdate=task_doc.get("startdate"),
            enddate=task_doc.get("enddate"),
            email=task_doc.get("email") or "",
            send_reminder=task_doc.get("sendReminder", False)
        ))
    return tasks

@app.post("/tasks")
async def create_task(task: Task, current_user: str = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    task_doc = {
        "taskname": task.taskname,
        "assign": task.assign,
        "status": task.status,
        "startdate": task.startdate,
        "enddate": task.enddate,
        "email": task.email,
        "sendReminder": task.send_reminder
    }
    tasks_col.insert_one(task_doc)
    return {"message": "Task created"}

@app.put("/tasks/{taskname}")
async def update_task(taskname: str, task: Task, current_user: str = Depends(get_current_user)):
    tasks_col.update_one(
        {"taskname": taskname},
        {"$set": {
            "assign": task.assign,
            "status": task.status,
            "startdate": task.startdate,
            "enddate": task.enddate,
            "email": task.email,
            "sendReminder": task.send_reminder
        }}
    )
    return {"message": "Task updated"}

@app.delete("/tasks/{taskname}")
async def delete_task(taskname: str, current_user: str = Depends(get_current_user)):
    tasks_col.delete_one({"taskname": taskname})
    return {"message": "Task deleted"}

@app.get("/daily", response_model=List[DailyTask])
async def get_daily_tasks(current_user: str = Depends(get_current_user)):
    tasks = []
    for task_doc in daily_col.find():
        tasks.append(DailyTask(
            name=task_doc.get("name"),
            assign=task_doc.get("assign") or "",
            description=task_doc.get("description") or "",
            date=task_doc.get("date")
        ))
    return tasks

@app.post("/daily")
async def create_daily_task(task: DailyTask, current_user: str = Depends(get_current_user)):
    task_doc = {
        "name": task.name,
        "assign": task.assign,
        "description": task.description,
        "date": task.date
    }
    daily_col.insert_one(task_doc)
    return {"message": "Daily task created"}

@app.put("/daily/{taskname}")
async def update_daily_task(taskname: str, task: DailyTask, current_user: str = Depends(get_current_user)):
    daily_col.update_one(
        {"name": taskname},
        {"$set": {
            "assign": task.assign,
            "description": task.description,
            "date": task.date
        }}
    )
    return {"message": "Daily task updated"}

@app.delete("/daily/{taskname}")
async def delete_daily_task(taskname: str, current_user: str = Depends(get_current_user)):
    daily_col.delete_one({"name": taskname})
    return {"message": "Daily task deleted"}

@app.get("/teams", response_model=List[TeamMember])
async def get_teams():
    members = []
    for member_doc in team_col.find():
        members.append(TeamMember(
            name=member_doc.get("name"),
            email=member_doc.get("email"),
            team=member_doc.get("team")
        ))
    return members

@app.post("/teams")
async def create_team_member(member: TeamMember):
    if team_col.find_one({"name": member.name}):
        raise HTTPException(status_code=400, detail="Member name already exists")
    member_doc = {
        "name": member.name,
        "email": member.email,
        "team": member.team
    }
    team_col.insert_one(member_doc)
    return {"message": "Team member added"}

@app.put("/teams/{name}")
async def update_team_member(name: str, member: TeamMember):
    team_col.update_one(
        {"name": name},
        {"$set": {
            "name": member.name,
            "email": member.email,
            "team": member.team
        }}
    )
    return {"message": "Team member updated"}

@app.delete("/teams/{name}")
async def delete_team_member(name: str):
    team_col.delete_one({"name": name})
    return {"message": "Team member deleted"}
