import sqlite3
from typing import List, Dict, Any, Optional
import json
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

def insert_watched_result(watch_id: int, offer: dict) -> int:
    conn = sqlite3.connect(TOKEN_DB)
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO watched_results (
            watch_id,
            total_price,
            base_price,
            currency,
            carrier,
            fare_brand,
            outbound_flight_numbers,
            inbound_flight_numbers,
            num_stops,
            stop_airports_outbound,
            stop_airports_inbound,
            outbound_depart_time,
            outbound_arrive_time,
            outbound_duration,
            inbound_depart_time,
            inbound_arrive_time,
            inbound_duration,
            checked_bags,
            cabin_bags,
            seats_left
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            watch_id,
            offer["total_price"],
            offer["base_price"],
            offer["currency"],
            offer["carrier"],
            offer["fare_brand"],
            json.dumps(offer["outbound_flight_numbers"]),
            json.dumps(offer["inbound_flight_numbers"]) if offer["inbound_flight_numbers"] else None,
            offer["num_stops"],
            json.dumps(offer["stop_airports_outbound"]),
            json.dumps(offer["stop_airports_inbound"]) if offer["stop_airports_inbound"] else None,
            offer["outbound"]["depart_time"],
            offer["outbound"]["arrive_time"],
            offer["outbound"].get("duration"),
            offer["inbound"]["depart_time"] if offer["inbound"] else None,
            offer["inbound"]["arrive_time"] if offer["inbound"] else None,
            offer["inbound"].get("duration") if offer["inbound"] else None,
            offer["checked_bags"],
            offer["cabin_bags"],
            offer["seats_left"],
        ),
    )

    conn.commit()
    return cur.lastrowid

def fetch_watched_results(watch_id: int):
    conn = sqlite3.connect(TOKEN_DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            wr.*,
            ws.adults
        FROM watched_results wr
        JOIN watched_searches ws ON ws.id = wr.watch_id
        WHERE wr.watch_id = ?
        ORDER BY wr.captured_at DESC
        """,
        (watch_id,),
    )

    rows = cur.fetchall()
    conn.close()
    return rows