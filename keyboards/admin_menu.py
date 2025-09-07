from aiogram.types import ReplyKeyboardMarkup, KeyboardButton

admin_menu = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="👥 تعداد کاربران"), KeyboardButton(text="📢 برودکست")],
        [KeyboardButton(text="🔧 اشتراک کاربر"), KeyboardButton(text="🧩 وضعیت IG کاربر")],
        [KeyboardButton(text="⬅️ خروج")]
    ],
    resize_keyboard=True
)