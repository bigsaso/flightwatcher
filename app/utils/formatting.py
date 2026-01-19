def format_duration(iso_duration: str) -> str:
    h = m = 0
    if "H" in iso_duration:
        h = int(iso_duration.split("H")[0].replace("PT", ""))
    if "M" in iso_duration:
        m = int(iso_duration.split("H")[-1].replace("M", ""))
    return f"{h}h {m}m" if m else f"{h}h"


def format_time(ts: str) -> str:
    return ts.split("T")[1][:5]


def parse_valid_carriers(included_airline_codes: str | None) -> set[str]:
    if not included_airline_codes:
        return set()
    return {c.strip().upper() for c in included_airline_codes.split(",")}
