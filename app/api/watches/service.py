from typing import List
import sqlite3
import json
from fastapi import HTTPException
from app.api.flights.service import search_flights_service
from app.api.flights.schemas import FlightSearchRequest
from app.api.watches.schemas import WatchCreate, Watch, WatchedResultResponse, WatchedResult
from app.api.watches.helpers import (
    insert_watch,
    fetch_watches,
    fetch_watch,
    update_watch_enabled,
    delete_watch,
    insert_watched_result,
    fetch_watched_results
)
from app.core.config import TOKEN_DB

def create_watch(data: WatchCreate) -> int:
    return insert_watch(data)

def list_watches() -> List[Watch]:
    rows = fetch_watches()
    return [Watch(**dict(row)) for row in rows]

def get_watch(watch_id: int) -> Watch:
    row = fetch_watch(watch_id)
    if not row:
        raise ValueError("Watch not found")
    return Watch(**dict(row))

def set_watch_enabled(watch_id: int, enabled: bool) -> None:
    update_watch_enabled(watch_id, enabled)

def remove_watch(watch_id: int) -> None:
    delete_watch(watch_id)

def run_watch_service(watch_id: int):
    conn = sqlite3.connect(TOKEN_DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Load watch + rule
    cur.execute(
        """
        SELECT w.*, r.*
        FROM watched_searches w
        JOIN flight_rules r ON r.id = w.rule_id
        WHERE w.id = ?
        """,
        (watch_id,),
    )
    row = cur.fetchone()
    if not row:
        raise ValueError("Watch not found")

    watch = dict(row)

    # Execute search using watch params
    search_request = FlightSearchRequest(
        origin=watch["origin"],
        destination=watch["destination"],
        depart=watch["depart_date"],
        return_date=watch["return_date"],
        flex_days=watch["flex_days"],
        adults=watch["adults"],
        travel_class=watch["travel_class"],
        currency=watch["currency"],
    )

    if not watch["enabled"]:
        raise HTTPException(status_code=400, detail="Watch is disabled")
    result = search_flights_service(search_request)

    offers = result["offers"]
    if not offers:
        return None

    # Pick cheapest
    cheapest = min(offers, key=lambda o: o["total_price"])

    # # Store in DB
    result_id = insert_watched_result(watch_id, cheapest)

    # Return response
    return WatchedResultResponse(
        id=result_id,
        watch_id=watch_id,
        total_price=cheapest["total_price"],
        currency=cheapest["currency"],
        carrier=cheapest["carrier"],
        fare_brand=cheapest["fare_brand"],
        outbound_depart_time=cheapest["outbound"]["depart_time"],
        outbound_arrive_time=cheapest["outbound"]["arrive_time"],
        inbound_depart_time=(
            cheapest["inbound"]["depart_time"] if cheapest["inbound"] else None
        ),
        inbound_arrive_time=(
            cheapest["inbound"]["arrive_time"] if cheapest["inbound"] else None
        ),
    )

def list_watched_results(watch_id: int):
    rows = fetch_watched_results(watch_id)

    results = []
    for row in rows:
        data = dict(row)

        # JSON fields
        data["outbound_flight_numbers"] = json.loads(data["outbound_flight_numbers"])
        data["inbound_flight_numbers"] = (
            json.loads(data["inbound_flight_numbers"])
            if data["inbound_flight_numbers"]
            else None
        )
        data["stop_airports_outbound"] = json.loads(data["stop_airports_outbound"])
        data["stop_airports_inbound"] = (
            json.loads(data["stop_airports_inbound"])
            if data["stop_airports_inbound"]
            else None
        )

        results.append(WatchedResult(**data))

    return results