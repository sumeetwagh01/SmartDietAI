import asyncio
from datetime import UTC, datetime
from typing import Optional

from firebase_admin import firestore

from config.firebase_config import get_db


class AiUsageError(RuntimeError):
    pass


AI_USAGE_RECOVERY_VERSION = 1


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


async def get_ai_targets(uid: str) -> Optional[dict]:
    return await _get_document("ai_targets", uid)


async def save_ai_targets(uid: str, data: dict) -> None:
    await _set_document("ai_targets", uid, data)


async def get_ai_plan(uid: str, date_str: str) -> Optional[dict]:
    return await _get_document("ai_plans", f"{uid}_{date_str}")


async def save_ai_plan(uid: str, date_str: str, data: dict) -> None:
    await _set_document("ai_plans", f"{uid}_{date_str}", data)


async def claim_ai_generations(uid: str, date_str: str, count: int = 1) -> None:
    db = get_db()
    reference = db.collection("ai_usage").document(f"{uid}_{date_str}")
    targets_reference = db.collection("ai_targets").document(uid)

    @firestore.transactional
    def claim(transaction):
        snapshot = reference.get(transaction=transaction)
        current = snapshot.to_dict() if snapshot.exists else {}
        used = int(current.get("count", 0) or 0)
        if used + count > 12:
            targets_snapshot = targets_reference.get(transaction=transaction)
            recovery_version = int(current.get("recovery_version", 0) or 0)
            if not targets_snapshot.exists and recovery_version < AI_USAGE_RECOVERY_VERSION:
                # The structured-output production bug consumed reservations
                # without ever creating targets. Recover those failed calls once.
                used = 0
                current["recovery_version"] = AI_USAGE_RECOVERY_VERSION
            else:
                raise AiUsageError("Daily AI limit reached. Try again tomorrow.")
        now = datetime.now(UTC)
        previous = current.get("last_generated_at")
        if previous:
            try:
                parsed = datetime.fromisoformat(str(previous).replace("Z", "+00:00"))
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=UTC)
                if (now - parsed).total_seconds() < 10:
                    raise AiUsageError("Please wait a few seconds before generating again.")
            except ValueError:
                pass
        transaction.set(
            reference,
            {
                "count": used + count,
                "last_generated_at": now.isoformat(),
                "date": date_str,
                **(
                    {"recovery_version": current["recovery_version"]}
                    if "recovery_version" in current
                    else {}
                ),
            },
            merge=True,
        )

    await asyncio.to_thread(claim, db.transaction())


async def release_ai_generations(uid: str, date_str: str, count: int = 1) -> None:
    """Release a generation reservation when the provider fails.

    Failed Gemini requests must not consume the user's daily allowance or leave
    the short retry cooldown active.
    """
    db = get_db()
    reference = db.collection("ai_usage").document(f"{uid}_{date_str}")

    @firestore.transactional
    def release(transaction):
        snapshot = reference.get(transaction=transaction)
        if not snapshot.exists:
            return
        current = snapshot.to_dict() or {}
        transaction.set(
            reference,
            {
                "count": max(0, int(current.get("count", 0) or 0) - count),
                "last_generated_at": "1970-01-01T00:00:00+00:00",
                "date": date_str,
            },
            merge=True,
        )

    await asyncio.to_thread(release, db.transaction())
