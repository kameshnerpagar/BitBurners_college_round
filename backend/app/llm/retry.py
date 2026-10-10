"""
Second Opinion — Retry logic with exponential backoff + jitter.

Handles HTTP 429 (rate limit) and transient errors.
Auto-fallback happens at the provider.py level.
"""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Callable, Awaitable

logger = logging.getLogger(__name__)


async def call_with_retry(
    provider_fn: Callable[..., Awaitable[str]],
    *,
    prompt: str,
    system_prompt: str,
    temperature: float,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    provider_name: str = "unknown",
) -> str:
    """
    Call a provider function with exponential backoff + jitter on failure.

    Raises the last exception if all retries are exhausted.
    """
    last_exception = None

    for attempt in range(max_retries):
        try:
            result = await provider_fn(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
            )
            return result

        except Exception as e:
            last_exception = e
            err_str = str(e).lower()

            # Check for rate limit (HTTP 429) or resource exhaustion
            is_rate_limit = (
                "429" in err_str
                or "rate" in err_str
                or "quota" in err_str
                or "resource" in err_str
            )

            if attempt < max_retries - 1:
                # Exponential backoff with jitter
                delay = min(base_delay * (2 ** attempt), max_delay)
                jitter = random.uniform(0, delay * 0.5)
                wait_time = delay + jitter

                if is_rate_limit:
                    # Extra delay for rate limits
                    wait_time = min(wait_time * 2, max_delay)

                logger.warning(
                    f"{provider_name}: attempt {attempt + 1}/{max_retries} failed "
                    f"({'rate-limited' if is_rate_limit else 'error'}), "
                    f"retrying in {wait_time:.1f}s — {e}"
                )
                await asyncio.sleep(wait_time)
            else:
                logger.error(
                    f"{provider_name}: all {max_retries} attempts failed: {e}"
                )

    raise last_exception  # type: ignore[misc]
