from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

# Helper function to format flight duration to human readable
def format_duration(iso_duration: str) -> str:
    """
    Converts ISO-8601 duration (e.g. PT11H30M) → 11h 30m
    """
    h = m = 0
    if "H" in iso_duration:
        h = int(iso_duration.split("H")[0].replace("PT", ""))
    if "M" in iso_duration:
        m = int(iso_duration.split("H")[-1].replace("M", ""))
    return f"{h}h {m}m" if m else f"{h}h"

# Helper function to format time
def format_time(ts: str) -> str:
    """
    2026-08-10T17:00:00 → 17:00
    """
    return ts.split("T")[1][:5]

# Helper function to parse valid_carriers from included_airline_codes
def parse_valid_carriers(included_airline_codes: str | None) -> set[str]:
    if not included_airline_codes:
        return set()
    return {c.strip().upper() for c in included_airline_codes.split(",")}

# Helper function to generate date pairs
def generate_date_pairs(
    base_depart: str,
    base_return: Optional[str],
    flex_days: int,
) -> list[tuple[str, Optional[str]]]:
    """
    Generates (depart_date, return_date) pairs.
    If base_return is provided, trip length is inferred.
    """
    base_depart_dt = date.fromisoformat(base_depart)
    pairs: list[tuple[str, Optional[str]]] = []

    # Infer trip length if round-trip
    if base_return:
        base_return_dt = date.fromisoformat(base_return)
        trip_length = (base_return_dt - base_depart_dt).days
        if trip_length <= 0:
            raise ValueError("return-date must be after depart date")
    else:
        trip_length = None

    for delta in range(-flex_days, flex_days + 1):
        depart = base_depart_dt + timedelta(days=delta)

        if trip_length is not None:
            ret = depart + timedelta(days=trip_length)
            pairs.append((depart.isoformat(), ret.isoformat()))
        else:
            pairs.append((depart.isoformat(), None))

    return pairs