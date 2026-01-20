from typing import List
from app.api.watches.schemas import WatchCreate, Watch
from app.api.watches.helpers import (
    insert_watch,
    fetch_watches,
    fetch_watch,
    update_watch_enabled,
    delete_watch,
)

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
