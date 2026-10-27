import os

import pytest


os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("FIREBASE_PRIVATE_KEY", "test")
os.environ.setdefault("FIREBASE_CLIENT_EMAIL", "test@example.com")
os.environ.setdefault("FIREBASE_WEB_API_KEY", "test")
os.environ.setdefault("JWT_SECRET", "test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("ENVIRONMENT", "test")

from services import gemini_runtime


class ClientError(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


class FakeResponse:
    text = "generated answer"


class FakeModels:
    def __init__(self, calls):
        self.calls = calls

    def generate_content(self, *, model, contents, config):
        self.calls.append(model)
        if len(self.calls) == 1:
            raise ClientError(429, "429 quota exceeded")
        return FakeResponse()


class FakeClient:
    def __init__(self, calls, **_kwargs):
        self.models = FakeModels(calls)

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None


def test_generate_text_falls_back_after_primary_quota_error(monkeypatch):
    calls = []
    monkeypatch.setattr(
        gemini_runtime.genai,
        "Client",
        lambda **kwargs: FakeClient(calls, **kwargs),
    )
    monkeypatch.setattr(gemini_runtime.settings, "GEMINI_MODEL", "primary")
    monkeypatch.setattr(gemini_runtime.settings, "GEMINI_FALLBACK_MODEL", "fallback")

    result = gemini_runtime.generate_text("hello", "be helpful")

    assert result == "generated answer"
    assert calls == ["primary", "fallback"]


def test_generate_text_does_not_fallback_for_invalid_key(monkeypatch):
    calls = []

    class UnauthorizedModels:
        def generate_content(self, *, model, contents, config):
            calls.append(model)
            raise ClientError(403, "API key rejected")

    monkeypatch.setattr(FakeClient, "__init__", lambda self, **_kwargs: setattr(self, "models", UnauthorizedModels()))
    monkeypatch.setattr(gemini_runtime.genai, "Client", FakeClient)
    monkeypatch.setattr(gemini_runtime.settings, "GEMINI_MODEL", "primary")
    monkeypatch.setattr(gemini_runtime.settings, "GEMINI_FALLBACK_MODEL", "fallback")

    with pytest.raises(ClientError):
        gemini_runtime.generate_text("hello", "be helpful")

    assert calls == ["primary"]


def test_error_summary_redacts_api_keys():
    summary = gemini_runtime.error_summary(
        ClientError(429, "key AIzaabcdefghijklmnopqrstuvwxyz0123456789 quota exceeded")
    )

    assert "AIza" not in summary
    assert "status=429" in summary
