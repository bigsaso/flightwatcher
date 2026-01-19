import sqlite3
from app.core.config import TOKEN_DB

def init_db() -> None:
    conn = sqlite3.connect(TOKEN_DB)
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS amadeus_token (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            access_token TEXT NOT NULL,
            expires_at INTEGER NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS flight_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_name TEXT NOT NULL,
            included_airline_codes TEXT,
            non_stop INTEGER,
            max_allowed_stops INTEGER NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1
        )
        """
    )

    conn.commit()
    conn.close()