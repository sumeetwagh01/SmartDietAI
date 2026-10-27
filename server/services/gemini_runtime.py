import logging
import re

from google import genai
from google.genai import types

from config.settings import settings


logger = logging.getLogger(__name__)
_NON_RECOVERABLE_CODES = {400, 401, 402, 403}


def _status_code(exc: Exception) -> int | None:
    for attribute in ("code", "status_code"):
        value = getattr(exc, attribute, None)
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.isdigit():
            return int(value)
    match = re.search(r"\b([45]\d\d)\b", str(exc))
    return int(match.group(1)) if match else None


def error_summary(exc: Exception) -> str:
    """Return provider diagnostics without logging credentials or request bodies."""
    code = _status_code(exc)
    message = str(getattr(exc, "message", "") or exc)
    message = re.sub(r"AIza[\w-]+", "[redacted-api-key]", message)
    message = " ".join(message.split())[:400]
    prefix = f"{type(exc).__name__} status={code}" if code else type(exc).__name__
    return f"{prefix}: {message}"


def _models() -> list[str]:
    return list(
        dict.fromkeys(
            model.strip()
            for model in (settings.GEMINI_MODEL, settings.GEMINI_FALLBACK_MODEL)
            if model and model.strip()
        )
    )


def generate_text(
    prompt: str,
    system_instruction: str,
    *,
    json_response: bool = False,
) -> str:
    last_error: Exception | None = None
    for index, model_name in enumerate(_models()):
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json" if json_response else None,
            )
            with genai.Client(api_key=settings.GEMINI_API_KEY) as client:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )
            if not response.text:
                raise RuntimeError("Gemini returned an empty response")
            if index:
                logger.info("Gemini fallback model succeeded model=%s", model_name)
            return response.text
        except Exception as exc:
            last_error = exc
            code = _status_code(exc)
            logger.warning(
                "Gemini provider request failed model=%s error=%s",
                model_name,
                error_summary(exc),
            )
            if code in _NON_RECOVERABLE_CODES:
                break

    assert last_error is not None
    raise last_error
