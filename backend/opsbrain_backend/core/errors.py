from dataclasses import dataclass


@dataclass(slots=True)
class OpsBrainError(Exception):
    message: str
    code: str = "opsbrain_error"
    status_code: int = 400
