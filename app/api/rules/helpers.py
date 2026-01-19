import sqlite3
from typing import List, Dict, Any
from app.core.config import TOKEN_DB


def fetch_rules() -> list[dict]:
    conn = sqlite3.connect(TOKEN_DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            id,
            rule_name,
            included_airline_codes,
            non_stop,
            max_allowed_stops,
            enabled
        FROM flight_rules
        """
    )

    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def fetch_active_rules() -> list[dict]:
    conn = sqlite3.connect(TOKEN_DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            id,
            rule_name,
            included_airline_codes,
            non_stop,
            max_allowed_stops
        FROM flight_rules
        WHERE enabled = 1
        """
    )

    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def insert_rule(rule: dict) -> int:
    conn = sqlite3.connect(TOKEN_DB)
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO flight_rules (
            rule_name,
            included_airline_codes,
            non_stop,
            max_allowed_stops,
            enabled
        )
        VALUES (?, ?, ?, ?, 1)
        """,
        (
            rule["rule_name"],
            rule.get("included_airline_codes"),
            rule.get("non_stop"),
            rule["max_allowed_stops"],
        ),
    )

    rule_id = cur.lastrowid
    conn.commit()
    conn.close()
    return rule_id


def update_rule(rule_id: int, fields: dict) -> None:
    conn = sqlite3.connect(TOKEN_DB)
    cur = conn.cursor()

    for k, v in fields.items():
        cur.execute(
            f"UPDATE flight_rules SET {k} = ? WHERE id = ?",
            (v, rule_id),
        )

    conn.commit()
    conn.close()

def remove_rule(rule_id: int) -> None:
    conn = sqlite3.connect(TOKEN_DB)
    cur = conn.cursor()
    cur.execute(
        f"DELETE FROM flight_rules WHERE id = ?",
        (rule_id,),
    )
    if cur.rowcount == 0:
        conn.close()
        raise ValueError("Rule not found")

    conn.commit()
    conn.close()