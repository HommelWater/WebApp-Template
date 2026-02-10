from fastapi import FastAPI, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import pyotp
import uuid
import auth_db as db
import re
from pydantic import BaseModel

class AuthRequest(BaseModel):
    code: str
    username: str

class ClientRequest(BaseModel):
    session: str

app = FastAPI()
username_pattern = r'^[a-zA-Z0-9]+$'
db.setup_db()

@app.post("/auth")
async def auth(data: AuthRequest):
    if not re.match(username_pattern, data.username):
        return {"type":"failure", "data":{"notification":"Invalid username."}}
    islogin = len(data.code) == 6
    if islogin:
        user = db.get_user(data.username)
        if user is None or not pyotp.TOTP(user["secret"]).verify(data.code):
            return {"type":"failure", "data":{"notification":"Could not create new session."}}
        session_key = str(uuid.uuid4())
        idx = db.add_session(session_key, user["id"])
        if idx is None:
            return {"type":"failure", "data":{"notification":"Could not create new session."}}
        return {"type":"login", "data":{"session_key":session_key}}
    else:
        t = data.code.split('_', 1)
        invitee_username = t[0]
        data.code = t[1] if len(t) > 1 else ''
        if data.username == "admin":
            user = db.get_user("admin")
            if user:
                return {"type":"failure", "data":{"notification":"Cannot login as admin."}}
            secret = pyotp.random_base32()
            db.add_user(data.username, secret, 0)
            return {"type":"signup", "data":{"secret":secret}}
        invitee = db.get_user(invitee_username)
        if not invitee:
            return {"type":"failure", "data":{"notification":"Invalid invitee username."}}
        secret = invitee["invite_secret"]
        at = invitee["invite_counter"]
        i_htop_code = pyotp.HOTP(secret).at(at)
        if i_htop_code == data.code:
            secret = pyotp.random_base32()
            db.add_user(data.username, secret, invitee["id"])
            db.increment_invite_counter(invitee["id"])
            return {"type":"signup", "data":{"secret":secret}}
        return {"type":"failure", "data":{"notification":"Invalid or expired invite code."}}

def get_user(session_key):
    session = db.get_session(session_key)
    if not session:
        return 
    user = db.get_user(session["user_id"])
    return user

def get_invite_code(invitee_user):
    db.increment_invite_counter(invitee_user["id"])
    return pyotp.HOTP(invitee_user["invite_secret"]).at(invitee_user["invite_counter"] + 1)

@app.post("/server_data_example")
async def server_data_example(data: ClientRequest):
    user = get_user(data.session)
    if not user:
        return {"type":"failure", "data":{"notification":"Error getting user."}}
    invite_code = get_invite_code(user)
    if not invite_code:
        return {"type":"failure", "data":{"notification":"Error getting invite code."}}
    return {"user":user, "new_invite_code": invite_code}

app.mount("/interface/", StaticFiles(directory="./interface/"), name="static")

@app.get("/auth")
async def login_redirect():
    return FileResponse("interface/auth/index.html")

@app.get("/")
async def login_redirect():
    return FileResponse("interface/main/index.html")
