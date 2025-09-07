import os
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from insta import exchange_code_for_token, exchange_long_lived, persist_link
from database import pop_state
import httpx
from config import BOT_TOKEN

app = FastAPI()

# Root & health
@app.get("/")
async def root(): return PlainTextResponse("OK")

@app.get("/healthz")
async def healthz(): return PlainTextResponse("ok")

# Privacy & Deletion (برای Meta)
@app.get("/privacy")
async def privacy():
    return PlainTextResponse("Privacy: We store only OAuth tokens required to connect your Instagram account.")

@app.get("/data-deletion")
async def data_deletion():
    return PlainTextResponse("Data Deletion: Send /admin and request unlink; we remove all tokens and IG links.")

async def notify_telegram(user_id: int, text: str):
    try:
        async with httpx.AsyncClient(timeout=10) as x:
            await x.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                         json={"chat_id": user_id, "text": text})
    except Exception:
        pass

@app.get("/auth/instagram")
async def ig_auth(code: str = "", state: str = ""):
    if not code or not state:
        return PlainTextResponse("Missing code/state", status_code=400)

    user_id = pop_state(state)
    if not user_id:
        return PlainTextResponse("State invalid/expired.", status_code=400)

    try:
        short = await exchange_code_for_token(code)
        if "access_token" not in short:
            await notify_telegram(user_id, f"❌ OAuth (short): {short}")
            return PlainTextResponse(f"OAuth short error: {short}", status_code=500)

        longd = await exchange_long_lived(short["access_token"])
        if "access_token" not in longd:
            await notify_telegram(user_id, f"❌ OAuth (long): {longd}")
            return PlainTextResponse(f"OAuth long error: {longd}", status_code=500)

        await persist_link(user_id, longd["access_token"], longd.get("expires_in", 60*60*24*60))
        await notify_telegram(user_id, "✅ Instagram connected. Use «📊 کنترل کامنت/ریپلای».")
        return PlainTextResponse("Instagram connected ✅")
    except Exception as e:
        await notify_telegram(user_id, f"❌ Error: {e}")
        return PlainTextResponse(f"Error: {e}", status_code=500)
