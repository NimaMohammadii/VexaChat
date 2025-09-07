from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from insta import exchange_code_for_token, exchange_long_lived, persist_link
from database import pop_state

app = FastAPI()

@app.get("/auth/instagram")
async def ig_auth(code: str = "", state: str = ""):
    if not code or not state:
        return PlainTextResponse("Missing code/state", status_code=400)
    user_id = pop_state(state)
    if not user_id:
        return PlainTextResponse("State invalid/expired.", status_code=400)
    try:
        short = await exchange_code_for_token(code)
        longd = await exchange_long_lived(short.get("access_token"))
        await persist_link(user_id, longd.get("access_token"), longd.get("expires_in", 60*60*24*60))
        return PlainTextResponse("Instagram connected ✅. Return to Telegram.")
    except Exception as e:
        return PlainTextResponse(f"Error: {e}", status_code=500)