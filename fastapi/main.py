from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

# ===================================
# ✅ Initialize App
# ===================================
app = FastAPI(title="Task Tracker API with MongoDB")

# ===================================
# ✅ Enable CORS
# ===================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================================
# ✅ MongoDB Setup
# ===================================
MONGO_URL = "mongodb://localhost:27017"   # Change if using Atlas or remote
client = AsyncIOMotorClient(MONGO_URL)
db = client["taskdb"]        # database
collection = db["tasks"]     # collection

# ===================================
# ✅ Task Model
# ===================================
class Task(BaseModel):
    taskname: str
    assign: str
    progressSelect: str
    startdate: str
    enddate: str

# ===================================
# ✅ API Endpoints
# ===================================
@app.get("/")
def root():
    return {"message": "✅ Task Tracker API (MongoDB) is running!"}

@app.post("/add_task/")
async def add_task(task: Task):
    """Add a new task into MongoDB"""
    task_data = task.dict()
    result = await collection.insert_one(task_data)
    task_data["_id"] = str(result.inserted_id)  # return MongoDB ID
    return {"message": "✅ Task added successfully", "task": task_data}

@app.get("/get_tasks/")
async def get_tasks():
    """Get all tasks from MongoDB"""
    tasks = []
    cursor = collection.find({})
    async for task in cursor:
        task["_id"] = str(task["_id"])  # convert ObjectId to string
        tasks.append(task)
    return {"tasks": tasks}
