"""
Second Opinion — Gemini Flash LLM client.
"""

from __future__ import annotations

import os
import logging

logger = logging.getLogger(__name__)


async def call_gemini(
    prompt: str,
    system_prompt: str = "",
    temperature: float = 0.1,
) -> str:
    """
    Call Google Gemini Flash (free tier) and return the raw text response.

    Uses google-genai SDK. Structured JSON is requested via prompt instruction;
    Gemini Flash supports response_mime_type for enforced JSON mode.
    Tries gemini-flash-lite-latest first for higher throughput/RPM, falling back to gemini-3.8-flash.
    """
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in environment")

    client = genai.Client(api_key=api_key)

    config = types.GenerateContentConfig(
        temperature=temperature,
        response_mime_type="application/json",
    )

    if system_prompt:
        config.system_instruction = system_prompt

    models_to_try = ["gemini-flash-lite-latest", "gemini-3.8-flash"]
    last_err = None

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            if response.text:
                return response.text
        except Exception as e:
            logger.warning(f"Gemini model {model_name} failed: {e}")
            last_err = e
            continue

    raise RuntimeError(f"All Gemini models failed. Last error: {last_err}")
