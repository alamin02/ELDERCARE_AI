import json
import logging
from typing import Optional, Dict, Any
import httpx
from backend.app.config import settings

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    def is_available(self) -> bool:
        """Checks if a valid Gemini API key is configured."""
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_mode: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Sends request to Google Gemini API.
        Returns parsed JSON dict if json_mode=True, or None if API key absent or error.
        """
        if not self.is_available():
            return None

        url = f"{self.base_url}?key={self.api_key}"
        headers = {"Content-Type": "application/json"}

        contents = [{"parts": [{"text": prompt}]}]
        body: Dict[str, Any] = {"contents": contents}

        if system_instruction:
            body["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        generation_config: Dict[str, Any] = {
            "temperature": 0.2,
            "maxOutputTokens": 1024,
        }
        if json_mode:
            generation_config["responseMimeType"] = "application/json"

        body["generationConfig"] = generation_config

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, headers=headers, json=body)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if json_mode:
                            return json.loads(text)
                        return {"raw_text": text}
                else:
                    logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return None


gemini_client = GeminiClient()
