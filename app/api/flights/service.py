import time
from app.core.amadeus import get_token, flight_offers_search
from app.utils.dates import generate_date_pairs
from app.utils.formatting import parse_valid_carriers
from app.core.config import API_CALL_DELAY_SECONDS
from app.api.rules.helpers import fetch_active_rules

from .helpers import (
    extract_flight_numbers,
    count_stops,
    extract_stops_by_itinerary,
    get_total_duration,
    extract_itinerary_times,
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

                # Airline filter
                if valid_carriers and carrier not in valid_carriers:
                    continue

                # Stop filter
                if num_stops > rule["max_allowed_stops"]:
                    continue

                outbound_flight_numbers, inbound_flight_numbers = extract_flight_numbers(offer)
                stops = extract_stops_by_itinerary(offer)
                timing = extract_itinerary_times(offer)
                checked_bags, cabin_bags = get_baggage_info(offer)

                results.append({
                    "rule_name": rule["rule_name"],

                    "total_price": float(offer["price"]["total"]),
                    "base_price": float(offer["price"]["base"]),
                    "currency": offer["price"]["currency"],

                    "carrier": carrier,
                    "outbound_flight_numbers": outbound_flight_numbers,
                    "inbound_flight_numbers": inbound_flight_numbers,
                    "fare_brand": get_fare_brand(offer),

                    "num_stops": num_stops,
                    "total_duration": get_total_duration(offer),
                    "stop_airports_outbound": stops["stop_airports_outbound"],
                    "stop_airports_inbound": stops["stop_airports_inbound"],

                    "outbound": timing["outbound"],
                    "inbound": timing["inbound"],

                    "checked_bags": checked_bags,
                    "cabin_bags": cabin_bags,

                    "seats_left": offer.get("numberOfBookableSeats", 0),
                })
    print(results)

    return {"offers": results}
