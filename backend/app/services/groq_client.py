import httpx
import asyncio
import re
import logging
from typing import Dict, Any, List
from ..config import settings

logger = logging.getLogger(__name__)

class GroqClient:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.base_url = settings.GROQ_BASE_URL
        self.model = settings.GROQ_MODEL
        self.client = httpx.AsyncClient(timeout=60.0)

    async def _make_request(
        self,
        messages: List[Dict[str, str]],
        response_format: Dict[str, str] = None,
        max_retries: int = 5
    ) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.0,
        }
        if response_format:
            payload["response_format"] = response_format

        for attempt in range(max_retries):
            try:
                response = await self.client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 429:
                    error_text = response.text
                    wait_time = None

                    # Check retry-after header
                    if "retry-after" in response.headers:
                        try:
                            wait_time = float(response.headers["retry-after"]) + 1.0
                        except ValueError:
                            pass

                    # Parse 'Please try again in X.Xs' from Groq error message
                    if wait_time is None:
                        match = re.search(r"try again in ([0-9.]+)s", error_text)
                        if match:
                            wait_time = float(match.group(1)) + 1.5
                        else:
                            wait_time = min(30.0, (2 ** attempt) * 3.0)

                    if attempt < max_retries - 1:
                        print(f"[GroqClient] Rate limit (429) hit. Waiting {wait_time:.2f}s before retry (attempt {attempt + 1}/{max_retries})...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        response.raise_for_status()

                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    match = re.search(r"try again in ([0-9.]+)s", e.response.text)
                    wait_time = float(match.group(1)) + 1.5 if match else min(30.0, (2 ** attempt) * 3.0)
                    print(f"[GroqClient] Rate limit (429) hit. Waiting {wait_time:.2f}s before retry (attempt {attempt + 1}/{max_retries})...")
                    await asyncio.sleep(wait_time)
                    continue
                raise RuntimeError(f"Groq API error: {e.response.text}")
            except httpx.RequestError as e:
                if attempt < max_retries - 1:
                    wait_time = 2.0 * (attempt + 1)
                    print(f"[GroqClient] Request error: {e}. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue
                raise RuntimeError(f"Request to Groq failed: {str(e)}")

groq_client = GroqClient()

