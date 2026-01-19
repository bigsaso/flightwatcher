import os
from dotenv import load_dotenv

load_dotenv()

AMADEUS_BASE = os.getenv("AMADEUS_BASE", "https://test.api.amadeus.com")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

TOKEN_DB = "flights.db"
TOKEN_SAFETY_MARGIN = 60
API_CALL_DELAY_SECONDS = 1.1