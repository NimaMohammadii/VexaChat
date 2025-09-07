from aiogram import Router, types, F
from keyboards.main_menu import main_menu
from database import add_user, get_user_plan, get_ig

router = Router()

@router.message(F.text == "/start")
async def start(message: types.Message):
    add_user(message.from_user.id, message.from_user.username)
    plan, ai_on, _ = get_user_plan(message.from_user.id)
    connected = get_ig(message.from_user.id) is not None
    await message.answer("🚀 خوش اومدی!", reply_markup=main_menu(bool(connected), bool(ai_on)))