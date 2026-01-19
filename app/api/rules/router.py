from fastapi import APIRouter, HTTPException
from typing import List
from .schemas import RuleCreate, RuleOut, RuleUpdate
from .service import list_rules, create_rule, set_rule_enabled, delete_rule

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("/", response_model=List[RuleOut])
def get_rules():
    return list_rules()


@router.post("/", response_model=RuleOut)
def add_rule(rule: RuleCreate):
    return create_rule(rule)


@router.patch("/{rule_id}")
def update_rule(rule_id: int, update: RuleUpdate):
    if update.enabled is None:
        raise HTTPException(status_code=400, detail="No fields to update")

    return set_rule_enabled(rule_id, update.enabled)

@router.delete("/{rule_id}")
def delete_rule_endpoint(rule_id: int):
    try:
        return delete_rule(rule_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))