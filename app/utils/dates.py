from datetime import date, timedelta
from typing import Optional

def generate_date_pairs(
    base_depart: str,
    base_return: Optional[str],
    flex_days: int,
) -> list[tuple[str, Optional[str]]]:
    base_depart_dt = date.fromisoformat(base_depart)

    if base_return:
        base_return_dt = date.fromisoformat(base_return)
        trip_length = (base_return_dt - base_depart_dt).days
        if trip_length <= 0:
            raise ValueError("return-date must be after depart date")
    else:
        trip_length = None

    pairs = []
    for delta in range(-flex_days, flex_days + 1):
        depart = base_depart_dt + timedelta(days=delta)
        if trip_length is not None:
            ret = depart + timedelta(days=trip_length)
            pairs.append((depart.isoformat(), ret.isoformat()))
        else:
            pairs.append((depart.isoformat(), None))
    return pairs
