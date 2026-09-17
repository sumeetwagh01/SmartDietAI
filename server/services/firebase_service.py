import asyncio
from typing import Optional

from config.firebase_config import get_db


async def _get_document(collection: str, document_id: str) -> Optional[dict]:
    db = get_db()
    loop = asyncio.get_event_loop()
    snapshot = await loop.run_in_executor(
        None,
        lambda: db.collection(collection).document(document_id).get(),
    )
    return snapshot.to_dict() if snapshot.exists else None


async def _set_document(
    collection: str, document_id: str, data: dict, merge: bool = False
) -> None:
    db = get_db()
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: db.collection(collection).document(document_id).set(
            data, merge=merge
        ),
    )


async def get_user_profile(uid: str) -> Optional[dict]:
    return await _get_document("users", uid)


async def save_user_profile(uid: str, data: dict) -> None:
    await _set_document("users", uid, data)


async def save_meal_plan(uid: str, date_str: str, plan: dict) -> None:
    await _set_document("meal_plans", f"{uid}_{date_str}", plan)


async def get_meal_plan(uid: str, date_str: str) -> Optional[dict]:
    return await _get_document("meal_plans", f"{uid}_{date_str}")


async def save_food_log(uid: str, date_str: str, log: dict) -> None:
    await _set_document("food_logs", f"{uid}_{date_str}", log, merge=True)


async def get_food_log(uid: str, date_str: str) -> Optional[dict]:
    return await _get_document("food_logs", f"{uid}_{date_str}")
