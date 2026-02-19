from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from auth_router import router as auth_router
from auth_router import ClientRequest, get_invite_code, get_user_and_session, CONTYPE, PEERS

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"{CONTYPE}{p}" for p in PEERS],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router, prefix="/auth")

# Example request for getting user information.
@app.post("/server_data_example")
async def server_data_example(data: ClientRequest):
    user, session = get_user_and_session(data.session)
    if not user:
        return {"type":"failure", "data":{"notification":"Error getting user.", "href":"/auth"}}
    invite_code = get_invite_code(user)
    if not invite_code:
        invite_code = {"type":"failure", "data":{"notification":"Error getting invite code."}}
    return {"user":user, "new_invite_code": invite_code}

app.mount("/interface/", StaticFiles(directory="./interface/"), name="interface")

@app.get("/{full_path:path}")
async def spa(full_path: str):
    if full_path == "auth":
        return FileResponse("interface/auth/index.html")
    return FileResponse("interface/main/index.html")