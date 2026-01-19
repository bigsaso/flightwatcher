from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.flights.router import router as flights_router
from app.api.rules.router import router as rules_router

app = FastAPI(title="Flights Watcher API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(flights_router)
app.include_router(rules_router)