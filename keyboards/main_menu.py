from aiogram.types import ReplyKeyboardMarkup, KeyboardButton

def main_menu(connected: bool, ai_on: bool):
    rows = [
        [KeyboardButton(text="📊 کنترل کامنت/ریپلای")],
        [KeyboardButton(text="💎 اشتراک‌ها")],
        [KeyboardButton(text="ℹ️ راهنما")],
        [KeyboardButton(text="🔗 اتصال اینستاگرام ✅" if connected else "🔗 اتصال اینستاگرام")]
    ]
    rows.insert(0, [KeyboardButton(text="🤖 چت هوش‌مصنوعی")] if ai_on else [KeyboardButton(text="🤖 فعال‌سازی هوش‌مصنوعی")])
    return ReplyKeyboardMarkup(keyboard=rows, resize_keyboard=True)