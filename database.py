import sqlite3
from contextlib import closing
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Tuple
from config import DB_PATH, SUB_DURATION_SECONDS

Path(DB_PATH).touch(exist_ok=True)

def _conn():
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def init_db():
    with closing(_conn()) as conn, conn:
        c = conn.cursor()
        c.execute("""CREATE TABLE IF NOT EXISTS users(
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            plan TEXT DEFAULT 'free',
            ai_enabled INTEGER DEFAULT 0,
            expires_at INTEGER
        )""")
        c.execute("""CREATE TABLE IF NOT EXISTS ig_links(
            user_id INTEGER PRIMARY KEY,
            fb_user_id TEXT,
            page_id TEXT,
            ig_id TEXT,
            short_token TEXT,
            long_token TEXT,
            token_expires_at INTEGER
        )""")
        c.execute("""CREATE TABLE IF NOT EXISTS auth_states(
            state TEXT PRIMARY KEY,
            user_id INTEGER,
            created_at INTEGER
        )""")

def add_user(user_id: int, username: Optional[str]):
    with closing(_conn()) as conn, conn:
        conn.execute("INSERT OR IGNORE INTO users(user_id, username) VALUES(?,?)", (user_id, username))

def all_user_ids():
    with closing(_conn()) as conn:
        return [r[0] for r in conn.execute("SELECT user_id FROM users").fetchall()]

def set_subscription(user_id: int, ai: bool):
    expires = int((datetime.utcnow() + timedelta(seconds=SUB_DURATION_SECONDS)).timestamp())
    with closing(_conn()) as conn, conn:
        conn.execute("UPDATE users SET plan=?, ai_enabled=?, expires_at=? WHERE user_id=?",
                     ("pro_ai" if ai else "pro", 1 if ai else 0, expires, user_id))

def get_user_plan(user_id: int) -> Tuple[str, int, int]:
    with closing(_conn()) as conn:
        row = conn.execute("SELECT plan, ai_enabled, COALESCE(expires_at,0) FROM users WHERE user_id=?", (user_id,)).fetchone()
        return row if row else ("free", 0, 0)

def save_state(state: str, user_id: int):
    with closing(_conn()) as conn, conn:
        conn.execute("INSERT OR REPLACE INTO auth_states(state,user_id,created_at) VALUES(?,?, strftime('%s','now'))", (state, user_id))

def pop_state(state: str) -> Optional[int]:
    with closing(_conn()) as conn, conn:
        row = conn.execute("SELECT user_id FROM auth_states WHERE state=?", (state,)).fetchone()
        if not row: return None
        conn.execute("DELETE FROM auth_states WHERE state=?", (state,))
        return int(row[0])

def save_ig_tokens(user_id: int, fb_user_id: str, page_id: str, ig_id: str, short_token: str, long_token: str, expires_at: int):
    with closing(_conn()) as conn, conn:
        conn.execute("""INSERT OR REPLACE INTO ig_links(user_id, fb_user_id, page_id, ig_id, short_token, long_token, token_expires_at)
                        VALUES(?,?,?,?,?,?,?)""", (user_id, fb_user_id, page_id, ig_id, short_token, long_token, expires_at))

def get_ig(user_id: int):
    with closing(_conn()) as conn:
        return conn.execute("SELECT fb_user_id,page_id,ig_id,long_token,token_expires_at FROM ig_links WHERE user_id=?", (user_id,)).fetchone()