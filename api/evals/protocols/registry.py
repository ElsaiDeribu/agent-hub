"""Protocol adapter registry."""

from __future__ import annotations

from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from .base import ProtocolAdapter

PROTOCOL_REGISTRY: dict[str, type[ProtocolAdapter]] = {}


def register_protocol(name: str):
    """Decorator to register a protocol adapter."""

    def decorator(cls: type[ProtocolAdapter]):
        PROTOCOL_REGISTRY[name] = cls
        return cls

    return decorator


def get_protocol_adapter(protocol: str) -> ProtocolAdapter:
    """Instantiate a protocol adapter by name."""
    cls = PROTOCOL_REGISTRY.get(protocol)
    if cls is None:
        available = ", ".join(sorted(PROTOCOL_REGISTRY))
        raise ValueError(f"Unknown protocol '{protocol}'. Available: {available}")
    return cls()
