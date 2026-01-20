import sqlite3
from typing import List, Dict, Any, Optional
from app.core.config import TOKEN_DB

def insert_watch(data) -> int:
    conn = sqlite3.connect(TOKEN_DB)
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO watched_searches (
            rule_id,
            origin,
            destination,
            depart_date,
            return_date,
            flex_days,
            adults,
            travel_class,
            currency
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data.rule_id,
            data.origin,
            data.destination,
            data.depart_date,
            data.return_date,
            data.flex_days,
            data.adults,
            data.travel_class,
            data.currency,
        ),
    )

    watch_id = cur.lastrowid
    conn.commit()
    conn.close()
    return watch_id

def fetch_watches() -> List[sqlite3.Row]:
    conn = sqlite3.connect(TOKEN_DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            w.id,
            w.rule_id,
            r.rule_name,
            w.origin,
            w.destination,
            w.depart_date,
            w.return_date,
            w.flex_days,
            w.adults,
            w.travel_class,
            w.currency,
            w.enabled,
            w.created_at
        FROM watched_searches w
        JOIN flight_rules r ON r.id = w.rule_id
        ORDER BY w.id DESC
        """
    )

    rows = cur.fetchall()
    conn.close()
    return rows

def fetch_watch(watch_id: int) -> Optional[sqlite3.Row]:
    conn = sqlite3.connect(TOKEN_DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM watched_searches WHERE id = ?",
        (watch_id,),
    )

    row = cur.fetchone()
    conn.close()
    return row

def update_watch_enabled(watch_id: int, enabled: bool) -> None:
    conn = sqlite3.connect(TOKEN_DB)
    cur = conn.cursor()

    cur.execute(
        """
        UPDATE watched_searches
        SET enabled = ?
        WHERE id = ?
        """,
        (1 if enabled else 0, watch_id),
    )

    if cur.rowcount == 0:
        conn.close()
        raise ValueError("Watch not found")

    conn.commit()
    conn.close()

def delete_watch(watch_id: int) -> None:
    conn = sqlite3.connect(TOKEN_DB)
    cur = conn.cursor()

    cur.execute(
        "DELETE FROM watched_searches WHERE id = ?",
        (watch_id,),
    )

    if cur.rowcount == 0:
        conn.close()
        raise ValueError("Watch not found")

    conn.commit()
    conn.close()
