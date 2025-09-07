import secrets
from aiogram import Router, types, F
from config import FB_APP_ID, FB_SCOPES
from database import save_state, get_ig
from database import get_user_plan
from insta import list_recent_media_comments, reply_public_comment, post_comment_on_media

router = Router()

@router.message(F.text.startswith("🔗 اتصال اینستاگرام"))
async def connect_ig(message: types.Message):
    state = secrets.token_urlsafe(16)
    save_state(state, message.from_user.id)
    from config import REDIRECT_URI
    url = (
        "https://www.facebook.com/v20.0/dialog/oauth"
        f"?client_id={FB_APP_ID}&redirect_uri={REDIRECT_URI}"
        f"&scope={FB_SCOPES}&response_type=code&state={state}"
    )
    await message.answer("برای اتصال IG روی لینک زیر بزن:\n" + url)

@router.message(F.text == "📊 کنترل کامنت/ریپلای")
async def ig_dashboard(message: types.Message):
    link = get_ig(message.from_user.id)
    if not link:
        return await message.answer("اول از «🔗 اتصال اینستاگرام» اکانتت رو وصل کن.")
    fb_uid, page_id, ig_id, token, _ = link
    items = await list_recent_media_comments(ig_id, token, limit=5)
    if not items:
        return await message.answer("پستی پیدا نشد یا کامنت‌ها بسته‌اند.")
    text = "🧵 آخرین پست‌ها و چند کامنت اول:\n\n"
    kb_rows = []
    for m in items:
        media = m["media"]
        text += f"• {media.get('caption','(بدون کپشن)')[:40]}…\n"
        for cm in m["comments"][:3]:
            kb_rows.append([types.InlineKeyboardButton(
                text=f"✍️ پاسخ @{cm.get('username','?')}",
                callback_data=f"cm:{cm['id']}"
            )])
        text += "\n"
    kb = types.InlineKeyboardMarkup(inline_keyboard=kb_rows or [[types.InlineKeyboardButton(text="رفرش", callback_data="refresh")]])
    await message.answer(text, disable_web_page_preview=True, reply_markup=kb)

@router.callback_query(F.data == "refresh")
async def refresh_cb(c: types.CallbackQuery):
    await ig_dashboard(c.message); await c.answer()

@router.callback_query(F.data.startswith("cm:"))
async def reply_choose(c: types.CallbackQuery):
    cm_id = c.data.split(":", 1)[1]
    await c.message.answer(f"پاسخ رو بفرست:\n/pub {cm_id} <message>\nیا کامنت جدید:\n/cm <media_id> <message>")
    await c.answer()

@router.message(F.text.startswith("/pub "))
async def pub_reply(message: types.Message):
    try:
        _, cm_id, *rest = message.text.split(" "); msg = " ".join(rest)
        link = get_ig(message.from_user.id); token = link[3]
        ok = await reply_public_comment(cm_id, token, msg)
        await message.answer("✅ ارسال شد." if ok else "❌ خطا در ارسال.")
    except Exception:
        await message.answer("❌ فرمت: /pub <comment_id> <message>")

@router.message(F.text.startswith("/cm "))
async def cm_new(message: types.Message):
    try:
        _, media_id, *rest = message.text.split(" "); msg = " ".join(rest)
        link = get_ig(message.from_user.id); token = link[3]
        ok = await post_comment_on_media(media_id, token, msg)
        await message.answer("✅ کامنت ارسال شد." if ok else "❌ خطا در ارسال.")
    except Exception:
        await message.answer("❌ فرمت: /cm <media_id> <message>")