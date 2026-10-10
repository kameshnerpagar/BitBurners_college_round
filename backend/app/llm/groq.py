"""
Second Opinion — Groq LLM client (fallback provider).
"""

from __future__ import annotations

import os
import logging

logger = logging.getLogger(__name__)


async def call_groq(
    prompt: str,
    system_prompt: str = "",
    temperature: float = 0.1,
) -> str:
    """
    Call Groq API (free tier) and return the raw text response.

    Uses the groq Python SDK with llama-3.3-70b-versatile.
    JSON mode is enforced via response_format.
    """
    from groq import Groq

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set in environment")

    client = Groq(api_key=api_key)

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=temperature,
        response_format={"type": "json_object"},
        max_tokens=8192,
    )

    text = response.choices[0].message.content
    if not text:
        raise RuntimeError("Groq returned empty response")

    return text
