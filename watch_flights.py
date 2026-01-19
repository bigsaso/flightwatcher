#!/usr/bin/env python3
"""
Watch flight prices per-person for YYZ -> SUF with constraints:
- Air Canada (AC) OR ITA Airways (AZ): max 1 stop
- Air Transat (TS): direct only
Uses Amadeus Flight Offers Search.
Docs: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search
"""

from __future__ import annotations

import argparse
import os
import sqlite3
import sys
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
import requests
import time

from helpers import format_duration, format_time, parse_valid_carriers, generate_date_pairs

AMADEUS_BASE = "https://test.api.amadeus.com"  # use https://api.amadeus.com for production
TOKEN_DB = "flights.db"
TOKEN_SAFETY_MARGIN = 60  # seconds
API_CALL_DELAY_SECONDS = 1.1

@dataclass(frozen=True)
class OfferPick:
    rule_name: str
    # Price
    total_price: float
    base_price: float
    currency: str
    # Airline/Fare
    carrier: str
    fare_brand: str
    # Routing
    num_stops: int
    stop_airports: list[str]
    total_duration: str  # ISO 8601 duration e.g. PT11H30M
    # Timing
    depart_time: str
    arrive_time: str
    # Baggage
    checked_bags: int
    cabin_bags: int
    # Availability
    seats_left: int
    # Identity
    offer_id: str
    # raw: Dict[str, Any]

# Helper function to initialize database if it is first time running
def init_db(token_db: str = TOKEN_DB) -> None:
    conn = sqlite3.connect(token_db)
    cur = conn.cursor()

    # --- Token table ---
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS amadeus_token (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            access_token TEXT NOT NULL,
            expires_at INTEGER NOT NULL
        )
        """
    )

    # --- Rules table ---
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

# Helper function to get token from either API or database
def get_token(client_id: str, client_secret: str, token_db: str = TOKEN_DB) -> str:
    now = int(time.time())

    # --- SQLite setup ---
    conn = sqlite3.connect(token_db)
    cur = conn.cursor()

    # If row exists and token still valid    
    # --- Try existing token ---
    cur.execute(
        "SELECT access_token, expires_at FROM amadeus_token WHERE id = 1"
    )
    row = cur.fetchone()
    if row:
        access_token, expires_at = row
        if now < expires_at - TOKEN_SAFETY_MARGIN:
            conn.close()
            return access_token
    # Else
    # --- Fetch new token ---
    url = f"{AMADEUS_BASE}/v1/security/oauth2/token"
    payload = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    }
    r = requests.post(url, data=payload, headers=headers, timeout=30)
    r.raise_for_status()
    data = r.json()
    access_token = data["access_token"]
    expires_at = now + int(data["expires_in"])

    # --- Store token ---
    cur.execute(
        """
        INSERT INTO amadeus_token (id, access_token, expires_at)
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            access_token = excluded.access_token,
            expires_at = excluded.expires_at
        """,
        (access_token, expires_at),
    )
    conn.commit()
    conn.close()

    return access_token

# Helper function to load rules from database
def load_rules(token_db: str = TOKEN_DB) -> list[dict]:
    conn = sqlite3.connect(token_db)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            rule_name,
            included_airline_codes,
            non_stop,
            max_allowed_stops
        FROM flight_rules
        WHERE enabled = 1
        """
    )

    rules = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rules

# Helper function to search for flights
def flight_offers_search(
    token: str,
    origin: str,
    destination: str,
    depart_date: str,
    return_date: Optional[str],
    adults: int,
    travel_class: str,
    non_stop: Optional[bool],
    included_airline_codes: Optional[str],
    currency: str,
    max_results: int = 50,
) -> Dict[str, Any]:
    headers = {"Authorization": f"Bearer {token}"}

    params = {
        "originLocationCode": origin,
        "destinationLocationCode": destination,
        "departureDate": depart_date,
        "adults": adults,
        "travelClass": travel_class,
        "currencyCode": currency,
        "max": str(max_results),
    }

    if return_date:
        params["returnDate"] = return_date
    if non_stop is True:
        params["nonStop"] = "true"        
    if included_airline_codes:
        params["includedAirlineCodes"] = included_airline_codes

    r = requests.get(
        f"{AMADEUS_BASE}/v2/shopping/flight-offers",
        headers=headers,
        params=params,
        timeout=30,
    )
    r.raise_for_status()
    return r.json()

# Helper function to get stops in a flight path
def get_stops(offer: dict) -> list[str]:
    """
    Returns a list of IATA airport codes where the flight stops.
    Empty list means direct.
    """
    stops = []

    for itinerary in offer.get("itineraries", []):
        segments = itinerary.get("segments", [])
        for seg in segments[:-1]:  # all except final destination
            arrival = seg.get("arrival", {}).get("iataCode")
            if arrival:
                stops.append(arrival)

    return stops

# Helper function to get number of stops in a flight path
def count_stops(offer: Dict[str, Any]) -> int:
    """
    Amadeus offers include itineraries -> segments.
    For a one-way itinerary, stops = segments-1.
    For round-trip, we use the max stops across itineraries.
    """
    itineraries = offer.get("itineraries", [])
    if not itineraries:
        return 99
    max_stops = 0
    for it in itineraries:
        segs = it.get("segments", [])
        stops = max(0, len(segs) - 1)
        max_stops = max(max_stops, stops)
    return max_stops

# Helper function to get total duration of trip
def get_total_duration(offer: dict) -> str:
    return offer["itineraries"][0]["duration"]

# Helper function to get flight times
def get_depart_and_arrive_times(offer: dict) -> tuple[str, str]:
    segments = offer["itineraries"][0]["segments"]
    depart = segments[0]["departure"]["at"]
    arrive = segments[-1]["arrival"]["at"]
    return depart, arrive

# Helper function to get baggage info
def get_baggage_info(offer: dict) -> tuple[int, int]:
    """
    Returns (checked_bags, cabin_bags)
    """
    checked = 0
    cabin = 0

    tp = offer.get("travelerPricings", [])
    if not tp:
        return checked, cabin

    fares = tp[0].get("fareDetailsBySegment", [])
    if not fares:
        return checked, cabin

    checked = fares[0].get("includedCheckedBags", {}).get("quantity", 0)
    cabin = fares[0].get("includedCabinBags", {}).get("quantity", 0)

    return checked, cabin

# Helper function to get fare name
def get_fare_brand(offer: dict) -> str:
    tp = offer.get("travelerPricings", [])
    if not tp:
        return "UNKNOWN"

    fares = tp[0].get("fareDetailsBySegment", [])
    if not fares:
        return "UNKNOWN"

    return fares[0].get("brandedFareLabel", "UNKNOWN")

# Main
def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--origin", default="YYZ")
    p.add_argument("--destination", default="SUF")
    p.add_argument("--depart", required=True, help="YYYY-MM-DD")
    p.add_argument("--return-date", default=None, help="YYYY-MM-DD (optional)")
    p.add_argument("--flex-days", type=int, default=0, help="± days around departure")
    p.add_argument("--adults", type=int, default=1)
    p.add_argument("--class", dest="travel_class", default="ECONOMY",
                   choices=["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"])
    p.add_argument("--currency", default="CAD")
    p.add_argument("--db", default="flight_watch.db")
    p.add_argument("--print-top", type=int, default=5, help="Print top N offers per rule set")
    args = p.parse_args()

    # Load environment
    load_dotenv()
    client_id = os.getenv("CLIENT_ID")
    client_secret = os.getenv("CLIENT_SECRET")
    if not client_id or not client_secret:
        print("Missing CLIENT_ID / CLIENT_SECRET env vars.", file=sys.stderr)
        return 2

    # Init DB if needed
    init_db()

    # Get oauth token
    token = get_token(client_id, client_secret)

    # Rule sets:
    rule_queries = load_rules()

    # Generate date pairs for the trip
    date_pairs = generate_date_pairs(
        base_depart=args.depart,
        base_return=args.return_date,
        flex_days=args.flex_days,
    )

    all_picks: List[OfferPick] = []

    # Go through each date pair in the date+- flex range
    for depart_date, return_date in date_pairs:
        # Go through each rule
        for rq in rule_queries:
            # Look for a flight in the date range + rule
            data = flight_offers_search(
                token=token,
                origin=args.origin,
                destination=args.destination,
                depart_date=depart_date,
                return_date=return_date,
                adults=args.adults,
                travel_class=args.travel_class,
                non_stop=True if rq["non_stop"] == 1 else None,
                included_airline_codes=rq["included_airline_codes"],
                currency=args.currency,
            )
            # Need to wait 1.1s to avoid hitting 429 error on amadeus API
            time.sleep(API_CALL_DELAY_SECONDS)

            # Load all offers
            offers = data.get("data", []) or []
            picks: List[OfferPick] = []
            # Go through each offer
            for offer in offers:
                # Get price
                price_str = offer.get("price", {}).get("total")
                cur = offer.get("price", {}).get("currency", args.currency)
                if not price_str:
                    continue

                # Pick a "main carrier" heuristic: first segment carrierCode
                carrier = None
                try:
                    carrier = offer["itineraries"][0]["segments"][0]["carrierCode"]
                except Exception:
                    carrier = None

                num_stops = count_stops(offer)

                valid_carriers = parse_valid_carriers(rq["included_airline_codes"])
                # Airline filter
                if valid_carriers and carrier not in valid_carriers:
                    continue
                # Stops filter
                if num_stops > rq["max_allowed_stops"]:
                    continue

                stops_list = get_stops(offer)
                # if stops_list:
                #     stops_str = " → ".join(stops_list)
                # else:
                #     stops_str = "DIRECT"
                total_duration = get_total_duration(offer)
                depart_time, arrive_time = get_depart_and_arrive_times(offer)
                checked_bags, cabin_bags = get_baggage_info(offer)
                fare_brand = get_fare_brand(offer)

                picks.append(
                    OfferPick(
                        rule_name=rq["rule_name"],
                        # Price
                        total_price=float(price_str),
                        base_price=float(offer["price"].get("base", 0.0)),
                        currency=cur,
                        # Airline/Fare
                        carrier=carrier,
                        fare_brand=fare_brand,
                        # Routing
                        num_stops=num_stops,
                        stop_airports=stops_list,
                        total_duration=total_duration,
                        # Timing
                        depart_time=depart_time,
                        arrive_time=arrive_time,
                        # Baggage
                        checked_bags=checked_bags,
                        cabin_bags=cabin_bags,
                        # Availability
                        seats_left=offer.get("numberOfBookableSeats", 0),
                        # Identity
                        offer_id=offer.get("id", ""),
                        # raw=offer,
                    )
                )

            picks.sort(key=lambda x: x.total_price)
            if picks:
                all_picks.append(picks[0])

            # Print some context
            trip_str = (
                f"depart={depart_date} return={return_date}"
                if return_date
                else f"depart={depart_date} (ONE-WAY)"
            )
            print(f"\n=== {rq['rule_name']} | {trip_str} ===")
            for i, pk in enumerate(picks[: args.print_top], start=1):
                # Routing
                if pk.num_stops:
                    stops_str = " → ".join(pk.stop_airports)
                else:
                    stops_str = "DIRECT"

                # Timing
                dep_time = format_time(pk.depart_time)
                arr_time = format_time(pk.arrive_time)

                # Duration
                duration = format_duration(pk.total_duration)

                print(f"{i}. {pk.currency} {pk.total_price:.2f} (base {pk.base_price:.2f}) | "
                    f"{pk.carrier} | {pk.fare_brand}")

                print(f"   {dep_time} → {arr_time} | {duration} | "
                    f"{pk.num_stops} stop{'s' if pk.num_stops != 1 else ''} ({stops_str})")

                print(f"   Bags: {pk.checked_bags} checked / {pk.cabin_bags} carry-on | "
                    f"Seats left: {pk.seats_left}")
            if not picks:
                print("No matching offers returned.")

if __name__ == "__main__":
    raise SystemExit(main())

