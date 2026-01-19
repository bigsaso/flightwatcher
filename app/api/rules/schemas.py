from pydantic import BaseModel
from typing import Optional

class RuleBase(BaseModel):
    rule_name: str
    included_airline_codes: Optional[str] = None
    non_stop: Optional[int] = None
    max_allowed_stops: int


class RuleCreate(RuleBase):
    pass


class RuleOut(RuleBase):
    id: int
    enabled: int


class RuleUpdate(BaseModel):
    enabled: Optional[int] = None
