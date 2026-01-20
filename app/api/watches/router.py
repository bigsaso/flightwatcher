from fastapi import APIRouter, HTTPException
from typing import List
from app.api.watches.schemas import WatchCreate, Watch, WatchUpdate
from app.api.watches.service import (
    create_watch,
    list_watches,
    get_watch,
    set_watch_enabled,
    remove_watch,
)

router = APIRouter(prefix="/watches", tags=["watches"])

@router.post("", response_model=int)
def create(data: WatchCreate):
    return create_watch(data)

@router.get("", response_model=List[Watch])
def list_all():
    return list_watches()

@router.get("/{watch_id}", response_model=Watch)
def get_one(watch_id: int):
    try:
        return get_watch(watch_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Watch not found")

@router.patch("/{watch_id}")
def update(watch_id: int, data: WatchUpdate):
    try:
        set_watch_enabled(watch_id, data.enabled)
        return {"status": "ok"}
    except ValueError:
        raise HTTPException(status_code=404, detail="Watch not found")

@router.delete("/{watch_id}")
def delete(watch_id: int):
    try:
        remove_watch(watch_id)
        return {"status": "ok"}
    except ValueError:
        raise HTTPException(status_code=404, detail="Watch not found")
