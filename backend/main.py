from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import sqlite3
import uvicorn

# Database setup
DATABASE = "tasks.db"

def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        hashed_password TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY,
        taskname TEXT,
        assign TEXT,
        status TEXT,
        startdate TEXT,
        enddate TEXT,
        email TEXT,
        send_reminder BOOLEAN
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS daily (
        id INTEGER PRIMARY KEY,
        name TEXT,
        assign TEXT,
        description TEXT,
        date TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS team (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE,
        email TEXT,
        team TEXT
    )''')
    conn.commit()
    conn.close()

init_db()

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
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    hashed_password = get_password_hash(user.password)
    try:
        c.execute("INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)",
                  (user.username, user.email, hashed_password))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already registered")
    conn.close()
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT hashed_password FROM users WHERE username = ?", (form_data.username,))
    result = c.fetchone()
    conn.close()
    if not result or not verify_password(form_data.password, result[0]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/tasks", response_model=List[Task])
async def get_tasks(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT taskname, assign, status, startdate, enddate, email, send_reminder FROM tasks")
    rows = c.fetchall()
    conn.close()
    tasks = []
    for row in rows:
        tasks.append(Task(
            taskname=row[0],
            assign=row[1],
            status=row[2],
            startdate=row[3],
            enddate=row[4],
            email=row[5],
            send_reminder=bool(row[6])
        ))
    return tasks

@app.post("/tasks")
async def create_task(task: Task, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("INSERT INTO tasks (taskname, assign, status, startdate, enddate, email, send_reminder) VALUES (?, ?, ?, ?, ?, ?, ?)",
              (task.taskname, task.assign, task.status, task.startdate, task.enddate, task.email, task.send_reminder))
    conn.commit()
    conn.close()
    return {"message": "Task created"}

@app.put("/tasks/{taskname}")
async def update_task(taskname: str, task: Task, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("UPDATE tasks SET assign=?, status=?, startdate=?, enddate=?, email=?, send_reminder=? WHERE taskname=?",
              (task.assign, task.status, task.startdate, task.enddate, task.email, task.send_reminder, taskname))
    conn.commit()
    conn.close()
    return {"message": "Task updated"}

@app.delete("/tasks/{taskname}")
async def delete_task(taskname: str, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("DELETE FROM tasks WHERE taskname=?", (taskname,))
    conn.commit()
    conn.close()
    return {"message": "Task deleted"}

@app.get("/daily", response_model=List[DailyTask])
async def get_daily_tasks(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT name, assign, description, date FROM daily")
    rows = c.fetchall()
    conn.close()
    tasks = []
    for row in rows:
        tasks.append(DailyTask(
            name=row[0],
            assign=row[1],
            description=row[2],
            date=row[3]
        ))
    return tasks

@app.post("/daily")
async def create_daily_task(task: DailyTask, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("INSERT INTO daily (name, assign, description, date) VALUES (?, ?, ?, ?)",
              (task.name, task.assign, task.description, task.date))
    conn.commit()
    conn.close()
    return {"message": "Daily task created"}

@app.put("/daily/{taskname}")
async def update_daily_task(taskname: str, task: DailyTask, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("UPDATE daily SET assign=?, description=?, date=? WHERE name=?",
              (task.assign, task.description, task.date, taskname))
    conn.commit()
    conn.close()
    return {"message": "Daily task updated"}

@app.delete("/daily/{taskname}")
async def delete_daily_task(taskname: str, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("DELETE FROM daily WHERE name=?", (taskname,))
    conn.commit()
    conn.close()
    return {"message": "Daily task deleted"}

@app.get("/team", response_model=List[TeamMember])
async def get_team():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT name, email, team FROM team")
    rows = c.fetchall()
    conn.close()
    members = []
    for row in rows:
        members.append(TeamMember(
            name=row[0],
            email=row[1],
            team=row[2]
        ))
    return members

@app.post("/team")
async def create_team_member(member: TeamMember):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO team (name, email, team) VALUES (?, ?, ?)",
                  (member.name, member.email, member.team))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Member name already exists")
    conn.close()
    return {"message": "Team member added"}

@app.delete("/team/{name}")
async def delete_team_member(name: str):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("DELETE FROM team WHERE name=?", (name,))
    conn.commit()
    conn.close()
    return {"message": "Team member deleted"}
