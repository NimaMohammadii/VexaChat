from aiogram import Router, types, F
import openai
from config import OPENAI_API_KEY
from database import get_user_plan

router = Router()
openai.api_key = OPENAI_API_KEY

KNOWN_BUTTONS = {
    "🤖 چت هوش‌مصنوعی","🤖 فعال‌سازی هوش‌مصنوعی","📊 کنترل کامنت/ریپلای",
    "💎 اشتراک‌ها","ℹ️ راهنما","🔗 اتصال اینستاگرام","🔗 اتصال اینستاگرام ✅",
    "⬅️ خروج","بازگشت ↩️",
}

@router.message(F.text == "🤖 چت هوش‌مصنوعی")
async def ai_enter(message: types.Message):
    _, ai_on, _ = get_user_plan(message.from_user.id)
    if not ai_on:
        return await message.answer("برای استفاده باید پلن «با هوش‌مصنوعی» بگیری. از «💎 اشتراک‌ها».")
    await message.answer("✍️ پیامت رو بفرست:")

@router.message(F.text == "🤖 فعال‌سازی هوش‌مصنوعی")
async def ai_cta(message: types.Message):
    await message.answer("برای فعال‌سازی، پلن ۵۹۹⭐️ رو از «💎 اشتراک‌ها» بخر.")

@router.message(F.text & ~F.text.in_(KNOWN_BUTTONS))
async def ai_chat(message: types.Message):
    _, ai_on, _ = get_user_plan(message.from_user.id)
    if not ai_on: return
    try:
        resp = openai.responses.create(model="gpt-4o-mini", input=message.text)
        await message.answer(resp.output_text)
    except Exception:
        await message.answer("❌ خطا در پاسخ AI")