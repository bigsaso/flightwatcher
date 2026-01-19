import sqlite3
import time
import requests
from typing import Optional, Dict, Any

from app.core.config import (
    AMADEUS_BASE,
    CLIENT_ID,
    CLIENT_SECRET,
    TOKEN_DB,
    TOKEN_SAFETY_MARGIN,
)

def get_token() -> str:
    now = int(time.time())
    conn = sqlite3.connect(TOKEN_DB)
    cur = conn.cursor()

    cur.execute("SELECT access_token, expires_at FROM amadeus_token WHERE id = 1")
    row = cur.fetchone()
    if row:
        token, expires_at = row
        if now < expires_at - TOKEN_SAFETY_MARGIN:
            conn.close()
            return token

    r = requests.post(
        f"{AMADEUS_BASE}/v1/security/oauth2/token",
        data={
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    r.raise_for_status()
    data = r.json()

    token = data["access_token"]
    expires_at = now + int(data["expires_in"])

    cur.execute(
        """
        INSERT INTO amadeus_token (id, access_token, expires_at)
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            access_token = excluded.access_token,
            expires_at = excluded.expires_at
        """,
        (token, expires_at),
    )
    conn.commit()
    conn.close()

    return token


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
    if non_stop:
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