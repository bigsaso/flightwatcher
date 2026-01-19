from app.api.rules.helpers import fetch_rules, insert_rule, update_rule, remove_rule


def list_rules():
    return fetch_rules()


def create_rule(rule):
    rule_id = insert_rule(rule.dict())
    return {"id": rule_id, **rule.dict(), "enabled": 1}


def set_rule_enabled(rule_id: int, enabled: int):
    update_rule(rule_id, {"enabled": enabled})
    return {"id": rule_id, "enabled": enabled}

def delete_rule(rule_id: int):
    remove_rule(rule_id)
    return {"status": "deleted", "id": rule_id}