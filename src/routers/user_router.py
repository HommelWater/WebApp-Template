from fastapi import APIRouter
from routers.auth_router import ClientRequest, get_user_and_session, user_is_invalid
import database as db

router = APIRouter()

# Returns all users, their id, parent_id and creation_datetime of the server.
@router.post("/")
async def get_users(data:ClientRequest):
    user, session = get_user_and_session(data.session)
    msg = user_is_invalid(user)
    if msg: return msg
    return {"type":"users", "data":{"users":db.get_users()}}