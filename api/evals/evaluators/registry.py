"""Global evaluator registry — maps type names to evaluator classes."""

from __future__ import annotations

from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from .base import Evaluator

EVALUATOR_REGISTRY: dict[str, type[Evaluator]] = {}


def register(name: str):
    """Decorator to register an evaluator class under a type name."""

    def decorator(cls: type[Evaluator]):
        EVALUATOR_REGISTRY[name] = cls
        return cls

    return decorator


def get_evaluator(type_name: str, config: dict[str, Any] | None = None) -> Evaluator:
    """Instantiate an evaluator by type name."""
    cls = EVALUATOR_REGISTRY.get(type_name)
    if cls is None:
        available = ", ".join(sorted(EVALUATOR_REGISTRY))
        raise ValueError(f"Unknown evaluator type '{type_name}'. Available: {available}")
    return cls(config)
