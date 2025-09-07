import time
import httpx
from typing import Optional, Dict, Any, List
from config import FB_APP_ID, FB_APP_SECRET, REDIRECT_URI
from database import save_ig_tokens

GRAPH = "https://graph.facebook.com/v20.0"

async def exchange_code_for_token(code: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as x:
        r = await x.get(f"{GRAPH}/oauth/access_token", params={
            "client_id": FB_APP_ID,
            "client_secret": FB_APP_SECRET,
            "redirect_uri": REDIRECT_URI,
            "code": code
        })
        r.raise_for_status()
        return r.json()

async def exchange_long_lived(short_token: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as x:
        r = await x.get(f"{GRAPH}/oauth/access_token", params={
            "grant_type": "fb_exchange_token",
            "client_id": FB_APP_ID,
            "client_secret": FB_APP_SECRET,
            "fb_exchange_token": short_token
        })
        r.raise_for_status()
        return r.json()

async def me_accounts(user_token: str) -> List[dict]:
    async with httpx.AsyncClient(timeout=20) as x:
        r = await x.get(f"{GRAPH}/me/accounts", params={"access_token": user_token, "fields": "id,name,instagram_business_account"})
        r.raise_for_status()
        return r.json().get("data", [])

async def page_to_ig(page_id: str, token: str) -> Optional[str]:
    async with httpx.AsyncClient(timeout=20) as x:
        r = await x.get(f"{GRAPH}/{page_id}", params={"fields": "instagram_business_account", "access_token": token})
        r.raise_for_status()
        data = r.json()
        ig = data.get("instagram_business_account", {})
        return ig.get("id")

async def persist_link(user_id: int, long_token: str, expires_in: int):
    # fetch fb user id
    async with httpx.AsyncClient(timeout=20) as x:
        me = await x.get(f"{GRAPH}/me", params={"access_token": long_token, "fields": "id"})
        fb_uid = me.json().get("id")

    # select page with ig
    accts = await me_accounts(long_token)
    page_id = ig_id = None
    for a in accts:
        pid = a["id"]
        ig = a.get("instagram_business_account", {})
        if ig and ig.get("id"):
            page_id, ig_id = pid, ig["id"]; break
        ig_try = await page_to_ig(pid, long_token)
        if ig_try:
            page_id, ig_id = pid, ig_try; break
    if not ig_id:
        raise RuntimeError("No Instagram Business account linked to any Page.")

    expires_at = int(time.time()) + int(expires_in or 0)
    save_ig_tokens(user_id, str(fb_uid or ""), str(page_id), str(ig_id), "", long_token, expires_at)

async def list_recent_media_comments(ig_id: str, token: str, limit: int = 5) -> List[dict]:
    async with httpx.AsyncClient(timeout=30) as x:
        media_res = await x.get(f"{GRAPH}/{ig_id}/media", params={
            "access_token": token, "fields": "id,caption,permalink,timestamp", "limit": limit
        })
        media_res.raise_for_status()
        media = media_res.json().get("data", [])
        items = []
        for m in media:
            cm = await x.get(f"{GRAPH}/{m['id']}/comments", params={
                "access_token": token, "fields": "id,text,username,timestamp,like_count"
            })
            comments = cm.json().get("data", []) if cm.status_code == 200 else []
            items.append({"media": m, "comments": comments})
        return items

async def reply_public_comment(comment_id: str, token: str, message: str) -> bool:
    async with httpx.AsyncClient(timeout=20) as x:
        r = await x.post(f"{GRAPH}/{comment_id}/replies", data={"message": message, "access_token": token})
        return r.status_code in (200, 201)

async def post_comment_on_media(media_id: str, token: str, message: str) -> bool:
    async with httpx.AsyncClient(timeout=20) as x:
        r = await x.post(f"{GRAPH}/{media_id}/comments", data={"message": message, "access_token": token})
        return r.status_code in (200, 201)