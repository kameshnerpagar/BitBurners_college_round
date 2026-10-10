"""
Second Opinion — Disk-based LLM response cache.

Keyed on a hash of (prompt + model). Survives restarts so demos work
even when rate-limited.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


class DiskCache:
    """Simple file-system cache: one JSON file per key."""

    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

    def _path(self, key: str) -> str:
        hashed = hashlib.sha256(key.encode()).hexdigest()[:24]
        return os.path.join(self.cache_dir, f"{hashed}.json")

    def get(self, key: str) -> Optional[str]:
        """Return cached raw text or None."""
        path = self._path(key)
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return data.get("response")
            except Exception:
                return None
        return None

    def set(self, key: str, value: str) -> None:
        """Write raw text to cache."""
        path = self._path(key)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump({"key": key[:100], "response": value}, f)
        except Exception as e:
            logger.warning(f"Cache write failed: {e}")

    def clear(self) -> None:
        """Remove all cached entries."""
        for fname in os.listdir(self.cache_dir):
            if fname.endswith(".json"):
                os.remove(os.path.join(self.cache_dir, fname))
