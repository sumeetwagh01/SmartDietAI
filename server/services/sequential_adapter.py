import asyncio
from datetime import date, timedelta
from typing import Optional

from config.firebase_config import get_db


async def _get_log(user_id: str, log_date: date):
    db = get_db()
    document_id = f"{user_id}_{log_date.isoformat()}"
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        lambda: db.collection("food_logs").document(document_id).get(),
    )


async def get_yesterday_intake(user_id: str) -> Optional[float]:
    snapshot = await _get_log(user_id, date.today() - timedelta(days=1))
    if not snapshot.exists:
        return None
    return snapshot.to_dict().get("total_calories")


async def get_weekly_average(user_id: str) -> Optional[float]:
    snapshots = await asyncio.gather(
        *(
            _get_log(user_id, date.today() - timedelta(days=offset))
            for offset in range(7)
        )
    )
    calories = [
        snapshot.to_dict().get("total_calories")
        for snapshot in snapshots
        if snapshot.exists and snapshot.to_dict().get("total_calories") is not None
    ]
    if not calories:
        return None
    return sum(calories) / len(calories)
