from datetime import date, timedelta

import pytest

from services.sequential_adapter import get_weekly_average, get_yesterday_intake


class Snapshot:
    def __init__(self, data=None):
        self.exists = data is not None
        self._data = data

    def to_dict(self):
        return self._data


class Document:
    def __init__(self, document_id, documents):
        self.document_id = document_id
        self.documents = documents

    def get(self):
        return Snapshot(self.documents.get(self.document_id))


class Collection:
    def __init__(self, documents):
        self.documents = documents

    def document(self, document_id):
        return Document(document_id, self.documents)


class FakeDb:
    def __init__(self, documents):
        self.documents = documents
        self.requested_collection = None

    def collection(self, name):
        self.requested_collection = name
        return Collection(self.documents)


def document_id(user_id, offset):
    log_date = date.today() - timedelta(days=offset)
    return f"{user_id}_{log_date.isoformat()}"


@pytest.mark.asyncio
async def test_yesterday_intake_reads_expected_food_log():
    db = FakeDb({document_id("user-1", 1): {"total_calories": 1750}})

    result = await get_yesterday_intake("user-1", db)

    assert result == 1750.0
    assert db.requested_collection == "food_logs"


@pytest.mark.asyncio
async def test_yesterday_intake_returns_none_for_missing_document():
    assert await get_yesterday_intake("user-1", FakeDb({})) is None


@pytest.mark.asyncio
async def test_weekly_average_uses_only_non_zero_days():
    db = FakeDb(
        {
            document_id("user-1", 0): {"total_calories": 1800},
            document_id("user-1", 1): {"total_calories": 0},
            document_id("user-1", 2): {"total_calories": 2200},
            document_id("user-1", 3): {"total_calories": None},
        }
    )

    assert await get_weekly_average("user-1", db) == 2000.0


@pytest.mark.asyncio
async def test_weekly_average_returns_none_without_non_zero_days():
    db = FakeDb({document_id("user-1", 0): {"total_calories": 0}})

    assert await get_weekly_average("user-1", db) is None
