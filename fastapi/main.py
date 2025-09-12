from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date, datetime, timedelta
from models import DailyTask, TeamMember, UserCreate, User, Token, TokenData
import smtplib
from email.mime.text import MIMEText
from bson import ObjectId
from database import tasks_collection, teams_collection, daily_collection, users_collection  # your async motor collections
import asyncio
from concurrent.futures import ThreadPoolExecutor
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional
from settings import settings

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Email config
SMTP_SERVER = settings.smtp_server
SMTP_PORT = settings.smtp_port
SENDER_EMAIL = settings.sender_email
SENDER_PASSWORD = settings.sender_password

executor = ThreadPoolExecutor(max_workers=2)

# Password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# JWT settings
SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
REFRESH_TOKEN_EXPIRE_MINUTES = settings.refresh_token_expire_days * 24 * 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Password utilities
def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password):
    return pwd_context.hash(password)

# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# User utilities
async def get_user(username: str):
    user = await users_collection.find_one({"username": username})
    if user:
        return User(**user)

async def authenticate_user(username: str, password: str):
    user = await get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Pydantic Task model
class Task(BaseModel):
    taskname: str
    assign: str
    status: str
    startdate: date
    enddate: date
    sendReminder: bool = False

# Blocking email sending function
def send_email_sync(to_email, subject, body):
    msg = MIMEText(body)
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
    print(f"✅ Email sent to {to_email}")

# Async wrapper to run blocking email sending in thread pool
async def send_email(to_email, subject, body):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, send_email_sync, to_email, subject, body)

# POST /tasks endpoint
@app.post("/tasks")
async def add_task(task: Task, current_user: User = Depends(get_current_user)):
    new_task = task.dict()
    # Convert date objects to strings for MongoDB compatibility
    new_task['startdate'] = task.startdate.isoformat()
    new_task['enddate'] = task.enddate.isoformat()
    result = await tasks_collection.insert_one(new_task)

    member = await teams_collection.find_one({"name": task.assign})
    if member:
        email_body = (
            f"Hello {task.assign},\n\n"
            f"You have been assigned a new task:\n\n"
            f"Task: {task.taskname}\n"
            f"Start: {task.startdate.strftime('%Y-%m-%d')}\n"
            f"End: {task.enddate.strftime('%Y-%m-%d')}\n\n"
            "Good luck!"
        )
        await send_email(
            member["email"],
            f"New Task Assigned: {task.taskname}",
            email_body
        )

    return {"id": str(result.inserted_id)}

# GET /tasks endpoint to fetch all tasks
@app.get("/tasks")
async def get_tasks(current_user: User = Depends(get_current_user)):
    tasks_cursor = tasks_collection.find()
    tasks = []
    async for task in tasks_cursor:
        task['id'] = str(task['_id'])
        task.pop('_id', None)
        tasks.append(task)
    return tasks

# DELETE /tasks/{taskname} endpoint to delete a specific task by name
@app.delete("/tasks/{taskname}")
async def delete_task(taskname: str, current_user: User = Depends(get_current_user)):
    result = await tasks_collection.delete_one({"taskname": taskname})
    if result.deleted_count == 1:
        return {"message": "Task deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Task not found")

# PUT /tasks/{taskname} endpoint to update a specific task by name
@app.put("/tasks/{taskname}")
async def update_task(taskname: str, updated_task: Task, current_user: User = Depends(get_current_user)):
    updated_data = updated_task.dict()
    # Convert date objects to strings for MongoDB compatibility
    updated_data['startdate'] = updated_task.startdate.isoformat()
    updated_data['enddate'] = updated_task.enddate.isoformat()
    result = await tasks_collection.update_one({"taskname": taskname}, {"$set": updated_data})
    if result.modified_count == 1:
        return {"message": "Task updated successfully"}
    else:
        raise HTTPException(status_code=404, detail="Task not found or no changes made")

# POST /daily endpoint
@app.post("/daily")
async def add_daily_task(daily_task: DailyTask):
    new_daily = daily_task.dict()
    result = await daily_collection.insert_one(new_daily)
    return {"id": str(result.inserted_id)}

# GET /daily endpoint to fetch all daily tasks
@app.get("/daily")
async def get_daily_tasks():
    daily_cursor = daily_collection.find()
    daily_tasks = []
    async for task in daily_cursor:
        task['id'] = str(task['_id'])
        task.pop('_id', None)
        daily_tasks.append(task)
    return daily_tasks

# GET /tasks/daily endpoint to fetch daily tasks (subpath)
@app.get("/tasks/daily")
async def get_tasks_daily():
    daily_cursor = daily_collection.find()
    daily_tasks = []
    async for task in daily_cursor:
        task['id'] = str(task['_id'])
        task.pop('_id', None)
        daily_tasks.append(task)
    return daily_tasks

# POST /team endpoint
@app.post("/team")
async def add_team_member(team_member: TeamMember):
    new_member = team_member.dict()
    result = await teams_collection.insert_one(new_member)
    return {"id": str(result.inserted_id)}

# GET /team endpoint to fetch all team members
@app.get("/team")
async def get_team_members():
    team_cursor = teams_collection.find()
    team_members = []
    async for member in team_cursor:
        member['id'] = str(member['_id'])
        member.pop('_id', None)
        team_members.append(member)
    return team_members

# DELETE /team/{name} endpoint to delete a specific team member by name
@app.delete("/team/{name}")
async def delete_team_member(name: str):
    result = await teams_collection.delete_one({"name": name})
    if result.deleted_count == 1:
        return {"message": "Team member deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Team member not found")

# Background task to send reminder emails for tasks due tomorrow
async def send_reminder_emails():
    while True:
        tomorrow = (datetime.now() + timedelta(days=1)).date().isoformat()
        print(f"Checking for reminders on {tomorrow}")
        tasks_cursor = tasks_collection.find({"enddate": tomorrow, "sendReminder": True})
        async for task in tasks_cursor:
            print(f"Found task for reminder: {task['taskname']}")
            member = await teams_collection.find_one({"name": task["assign"]})
            if member:
                email_body = (
                    f"Hello {task['assign']},\n\n"
                    f"This is a reminder that your task '{task['taskname']}' is due tomorrow ({task['enddate']}).\n\n"
                    "Please make sure to complete it on time.\n\n"
                    "Best regards,"
                )
                await send_email(
                    member["email"],
                    f"Reminder: Task '{task['taskname']}' Due Tomorrow",
                    email_body
                )
        # Sleep for 24 hours
        await asyncio.sleep(86400)

# Manual endpoint to trigger reminder check for testing
@app.get("/send-reminders")
async def manual_send_reminders():
    tomorrow = (datetime.now() + timedelta(days=1)).date().isoformat()
    print(f"Manual check for reminders on {tomorrow}")
    tasks_cursor = tasks_collection.find({"enddate": tomorrow, "sendReminder": True})
    count = 0
    async for task in tasks_cursor:
        print(f"Found task for reminder: {task['taskname']}")
        member = await teams_collection.find_one({"name": task["assign"]})
        if member:
            email_body = (
                f"Hello {task['assign']},\n\n"
                f"This is a reminder that your task '{task['taskname']}' is due tomorrow ({task['enddate']}).\n\n"
                "Please make sure to complete it on time.\n\n"
                "Best regards,"
            )
            await send_email(
                member["email"],
                f"Reminder: Task '{task['taskname']}' Due Tomorrow",
                email_body
            )
            count += 1
    return {"message": f"Sent {count} reminder emails"}

# Authentication endpoints
@app.post("/register", response_model=User)
async def register(user: UserCreate):
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict["hashed_password"] = hashed_password
    del user_dict["password"]
    result = await users_collection.insert_one(user_dict)
    return User(**user_dict)

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Dashboard endpoint
@app.get("/dashboard")
async def get_dashboard_data(current_user: User = Depends(get_current_user)):
    # Get summary data for dashboard
    total_tasks = await tasks_collection.count_documents({})
    total_team_members = await teams_collection.count_documents({})
    total_daily_tasks = await daily_collection.count_documents({})
    pending_tasks = await tasks_collection.count_documents({"status": "pending"})
    completed_tasks = await tasks_collection.count_documents({"status": "completed"})

    return {
        "total_tasks": total_tasks,
        "total_team_members": total_team_members,
        "total_daily_tasks": total_daily_tasks,
        "pending_tasks": pending_tasks,
        "completed_tasks": completed_tasks,
        "user": current_user.username
    }

# Workspace endpoint
@app.get("/workspace")
async def get_workspace_data(current_user: User = Depends(get_current_user)):
    # Get workspace data
    tasks = await tasks_collection.find().to_list(length=None)
    daily_tasks = await daily_collection.find().to_list(length=None)
    team_members = await teams_collection.find().to_list(length=None)

    # Convert ObjectId to string for JSON serialization
    for task in tasks:
        task['_id'] = str(task['_id'])
    for daily_task in daily_tasks:
        daily_task['_id'] = str(daily_task['_id'])
    for member in team_members:
        member['_id'] = str(member['_id'])

    return {
        "tasks": tasks,
        "daily_tasks": daily_tasks,
        "team_members": team_members,
        "user": current_user.username
    }

# Startup event to launch the background reminder task
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(send_reminder_emails())
