from aiogram import Router, types, F
from keyboards.admin_menu import admin_menu
from database import all_user_ids, set_subscription, get_ig
from config import BOT_OWNER

router = Router()

def is_owner(m: types.Message) -> bool:
    return m.from_user.id == BOT_OWNER

@router.message(F.text == "/admin")
async def admin_entry(message: types.Message):
    if not is_owner(message): return await message.answer("⛔️ دسترسی نداری")
    await message.answer("⚙️ پنل ادمین", reply_markup=admin_menu)

@router.message(F.text == "👥 تعداد کاربران")
async def count_users(message: types.Message):
    if not is_owner(message): return
    await message.answer(f"👥 {len(all_user_ids())} کاربر")

@router.message(F.text == "📢 برودکست")
async def prompt_bc(message: types.Message):
    if not is_owner(message): return
    await message.answer("متن رو با این فرمت بفرست:\n/bc متن")

@router.message(F.text.startswith("/bc "))
async def do_bc(message: types.Message):
    if not is_owner(message): return
    text = message.text[4:]
    for uid in all_user_ids():
        try: await message.bot.send_message(uid, f"📢 {text}")
        except: pass
    await message.answer("✅ ارسال شد.")

@router.message(F.text == "🔧 اشتراک کاربر")
async def sub_help(message: types.Message):
    if not is_owner(message): return
    await message.answer("فرمت:\n/sub <user_id> ai|noai")

@router.message(F.text.startswith("/sub "))
async def sub_set(message: types.Message):
    if not is_owner(message): return
    try:
        _, uid, kind = message.text.split()
        set_subscription(int(uid), ai=(kind=="ai"))
        await message.answer("اوکی ✅")
    except:
        await message.answer("❌ فرمت")

@router.message(F.text == "🧩 وضعیت IG کاربر")
async def ig_stat_help(message: types.Message):
    if not is_owner(message): return
    await message.answer("فرمت:\n/igstat <user_id>")

@router.message(F.text.startswith("/igstat "))
async def ig_stat(message: types.Message):
    if not is_owner(message): return
    try:
        uid = int(message.text.split()[1]); row = get_ig(uid)
        await message.answer("✅ وصل است" if row else "❌ وصل نیست")
    except:
        await message.answer("❌ خطا")