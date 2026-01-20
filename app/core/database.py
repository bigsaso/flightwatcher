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

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS watched_searches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            rule_id INTEGER NOT NULL,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            depart_date TEXT NOT NULL,
            return_date TEXT,
            flex_days INTEGER NOT NULL,
            adults INTEGER NOT NULL,
            travel_class TEXT NOT NULL,
            currency TEXT NOT NULL,

            enabled INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (rule_id) REFERENCES flight_rules(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS watched_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            watch_id INTEGER NOT NULL,

            total_price REAL NOT NULL,
            base_price REAL NOT NULL,
            currency TEXT NOT NULL,

            carrier TEXT NOT NULL,
            fare_brand TEXT NOT NULL,

            outbound_flight_numbers TEXT NOT NULL,
            inbound_flight_numbers TEXT,

            num_stops INTEGER NOT NULL,
            stop_airports_outbound TEXT NOT NULL,
            stop_airports_inbound TEXT,

            outbound_depart_time TEXT NOT NULL,
            outbound_arrive_time TEXT NOT NULL,
            outbound_duration TEXT,

            inbound_depart_time TEXT,
            inbound_arrive_time TEXT,
            inbound_duration TEXT,

            checked_bags INTEGER NOT NULL,
            cabin_bags INTEGER NOT NULL,
            seats_left INTEGER NOT NULL,

            captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (watch_id) REFERENCES watched_searches(id)
        )
        """
    )

    conn.commit()
    conn.close()