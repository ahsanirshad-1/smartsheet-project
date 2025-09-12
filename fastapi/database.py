from motor.motor_asyncio import AsyncIOMotorClient
from settings import settings

client = AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.database_name]

tasks_collection = db["tasks"]
daily_collection = db["daily"]
teams_collection = db["teams"]
users_collection = db["users"]
