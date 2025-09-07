import asyncio
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from config import BOT_TOKEN
from database import init_db
from handlers import start, menu, payments, instagram, admin, ai_chat

import uvicorn
from webserver import app as fastapi_app

async def run_bot():
    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher()
    dp.include_router(start.router)
    dp.include_router(menu.router)
    dp.include_router(payments.router)
    dp.include_router(instagram.router)
    dp.include_router(admin.router)
    dp.include_router(ai_chat.router)  # AI آخر
    await dp.start_polling(bot)

async def run_api():
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    init_db()
    await asyncio.gather(run_bot(), run_api())

if __name__ == "__main__":
    asyncio.run(main())