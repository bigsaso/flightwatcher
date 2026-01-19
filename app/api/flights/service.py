import time
from app.core.amadeus import get_token, flight_offers_search
from app.utils.dates import generate_date_pairs
from app.utils.formatting import parse_valid_carriers
from app.core.config import API_CALL_DELAY_SECONDS
from app.api.rules.helpers import fetch_active_rules

from .helpers import (
    get_stops,
    count_stops,
    get_total_duration,
    get_depart_and_arrive_times,
    get_baggage_info,
    get_fare_brand,
)

def search_flights_service(req):
    token = get_token()
    results = []

    # Load enabled rules
    rules = fetch_active_rules()
    if not rules:
        return {"offers": []}

    date_pairs = generate_date_pairs(
        req.depart,
        req.return_date,
        req.flex_days,
    )

    for depart_date, return_date in date_pairs:
        for rule in rules:
            data = flight_offers_search(
                token=token,
                origin=req.origin,
                destination=req.destination,
                depart_date=depart_date,
                return_date=return_date,
                adults=req.adults,
                travel_class=req.travel_class,
                non_stop=True if rule["non_stop"] == 1 else None,
                included_airline_codes=rule["included_airline_codes"],
                currency=req.currency,
            )

            time.sleep(API_CALL_DELAY_SECONDS)

            valid_carriers = parse_valid_carriers(
                rule["included_airline_codes"]
            )

            for offer in data.get("data", []):
                carrier = offer["validatingAirlineCodes"][0]
                num_stops = count_stops(offer)

                # ✅ Airline filter
                if valid_carriers and carrier not in valid_carriers:
                    continue

                # ✅ Stop filter
                if num_stops > rule["max_allowed_stops"]:
                    continue

                stops = get_stops(offer)
                depart_time, arrive_time = get_depart_and_arrive_times(offer)
                checked_bags, cabin_bags = get_baggage_info(offer)

                results.append({
                    "rule_name": rule["rule_name"],

                    "total_price": float(offer["price"]["total"]),
                    "base_price": float(offer["price"]["base"]),
                    "currency": offer["price"]["currency"],

                    "carrier": carrier,
                    "fare_brand": get_fare_brand(offer),

                    "num_stops": num_stops,
                    "stop_airports": stops,
                    "total_duration": get_total_duration(offer),

                    "depart_time": depart_time,
                    "arrive_time": arrive_time,

                    "checked_bags": checked_bags,
                    "cabin_bags": cabin_bags,

                    "seats_left": offer.get("numberOfBookableSeats", 0),
                })

    return {"offers": results}
