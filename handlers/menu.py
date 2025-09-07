from aiogram import Router, types, F
from keyboards.main_menu import main_menu
from database import get_user_plan, get_ig

router = Router()

@router.message(F.text == "ℹ️ راهنما")
async def help_msg(message: types.Message):
    await message.answer(
        "دستورات:\n"
        "• /admin (ادمین)\n"
        "• /pub <comment_id> <msg> پاسخ عمومی\n"
        "• /cm <media_id> <msg> کامنت جدید\n"
        "• «🔗 اتصال اینستاگرام» برای لینک کردن IG\n"
        "• «💎 اشتراک‌ها» برای پلن‌های ⭐️"
    )

@router.message(F.text == "⬅️ خروج")
async def back(message: types.Message):
    plan, ai_on, _ = get_user_plan(message.from_user.id)
    connected = get_ig(message.from_user.id) is not None
    await message.answer("منو:", reply_markup=main_menu(bool(connected), bool(ai_on)))