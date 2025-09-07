import os

# Telegram / OpenAI
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
BOT_OWNER = int(os.getenv("BOT_OWNER", "0"))

# Public URL
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "https://your-app.onrender.com")
REDIRECT_PATH = "/auth/instagram"
REDIRECT_URI = f"{PUBLIC_BASE_URL}{REDIRECT_PATH}"

# Meta App (developers.facebook.com)
FB_APP_ID = os.getenv("FB_APP_ID", "")
FB_APP_SECRET = os.getenv("FB_APP_SECRET", "")
FB_SCOPES = ",".join([
    "instagram_basic",
    "pages_show_list",
    "pages_manage_metadata",
    "instagram_manage_comments",
    "instagram_manage_messages",
    "public_profile",
])

# DB / Subs
DB_PATH = "bot.db"
SUB_NO_AI_STARS = 299
SUB_AI_STARS = 599
SUB_DURATION_SECONDS = 30 * 24 * 3600  # 30 days
