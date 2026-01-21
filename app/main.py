from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from app.api.flights.router import router as flights_router
from app.api.rules.router import router as rules_router
from app.api.watches.router import router as watches_router

from app.core.scheduler import start_scheduler, scheduler

import logging

logging.basicConfig(
    level=logging.INFO,  # 👈 THIS is the key line
    format="%(levelname)s:\t%(message)s",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    start_scheduler()
    yield
    # --- shutdown ---
    scheduler.shutdown()

app = FastAPI(title="Flights Watcher API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
	    "http://sal-testbench:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(flights_router)
app.include_router(rules_router)
app.include_router(watches_router)
