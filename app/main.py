from fastapi import FastAPI
from app.api.flights.router import router as flights_router
from app.api.rules.router import router as rules_router

app = FastAPI(title="Flights Watcher API")

app.include_router(flights_router)
app.include_router(rules_router)