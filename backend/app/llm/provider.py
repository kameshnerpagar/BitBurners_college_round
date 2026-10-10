"""
Second Opinion — Provider-agnostic LLM interface.

Abstracts over Gemini and Groq with:
- Structured JSON output + Pydantic validation
- Retry with exponential backoff + jitter on 429
- Auto-fallback to secondary provider
- Disk-based response cache
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional, Type

from pydantic import BaseModel, ValidationError

from app.llm.cache import DiskCache
from app.llm.retry import call_with_retry
from app.llm.gemini import call_gemini
from app.llm.groq import call_groq

logger = logging.getLogger(__name__)

_cache = DiskCache(cache_dir=os.path.join("cache"))


def _strip_json_fences(text: str) -> str:
    """Remove markdown code fences that LLMs sometimes wrap JSON in."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _parse_and_validate(raw: str, schema: Optional[Type[BaseModel]]) -> Any:
    """Parse JSON string and optionally validate against a Pydantic model."""
    cleaned = _strip_json_fences(raw)
    data = json.loads(cleaned)
    if schema is None:
        return data
    if isinstance(data, list):
        return [schema.model_validate(item) for item in data]
    return schema.model_validate(data)


async def llm_call(
    prompt: str,
    system_prompt: str = "",
    schema: Optional[Type[BaseModel]] = None,
    response_is_list: bool = False,
    cache_key: Optional[str] = None,
    max_retries: int = 3,
    temperature: float = 0.1,
) -> Any:
    """
    Make a structured LLM call with retry, fallback, and caching.

    Args:
        prompt: The user/task prompt.
        system_prompt: System-level instructions.
        schema: Pydantic model to validate response against.
        response_is_list: If True, expect a JSON array of schema objects.
        cache_key: If provided, cache and reuse results under this key.
        max_retries: Number of retries per provider before fallback.
        temperature: Sampling temperature.

    Returns:
        Parsed and validated response (dict, list, or Pydantic model).
    """
    # Check cache first
    if cache_key:
        cached = _cache.get(cache_key)
        if cached is not None:
            logger.info(f"Cache hit for key: {cache_key[:40]}...")
            try:
                return _parse_and_validate(cached, schema)
            except (json.JSONDecodeError, ValidationError):
                logger.warning("Cached value failed validation, re-fetching")

    # Build JSON schema hint for the LLM
    schema_hint = ""
    if schema is not None:
        json_schema = schema.model_json_schema()
        if response_is_list:
            schema_hint = (
                "\n\nYou MUST respond with a valid JSON array. "
                f"Each element must conform to this schema:\n{json.dumps(json_schema, indent=2)}"
            )
        else:
            schema_hint = (
                "\n\nYou MUST respond with a single valid JSON object conforming to this schema:\n"
                f"{json.dumps(json_schema, indent=2)}"
            )

    full_prompt = prompt + schema_hint

    # Try primary provider (Gemini)
    providers = [
        ("gemini", call_gemini),
        ("groq", call_groq),
    ]

    last_error = None
    for provider_name, provider_fn in providers:
        try:
            raw_text = await call_with_retry(
                provider_fn,
                prompt=full_prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_retries=max_retries,
                provider_name=provider_name,
            )

            result = _parse_and_validate(raw_text, schema)

            # Cache the raw text on success
            if cache_key:
                _cache.set(cache_key, raw_text)

            logger.info(f"LLM call succeeded with {provider_name}")
            return result

        except (json.JSONDecodeError, ValidationError) as e:
            logger.warning(
                f"{provider_name}: JSON/validation error after retries: {e}"
            )
            last_error = e
            continue
        except Exception as e:
            logger.warning(f"{provider_name}: failed: {e}")
            last_error = e
            continue

    raise RuntimeError(
        f"All LLM providers failed. Last error: {last_error}"
    )
