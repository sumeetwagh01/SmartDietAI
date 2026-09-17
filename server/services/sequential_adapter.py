import asyncio
from datetime import date, timedelta
from typing import Optional

async def _get_log(user_id: str, log_date: date, db):
    document_id = f"{user_id}_{log_date.isoformat()}"
    return await asyncio.to_thread(
        lambda: db.collection("food_logs").document(document_id).get(),
    )


async def get_yesterday_intake(user_id: str, db) -> Optional[float]:
    snapshot = await _get_log(
        user_id, date.today() - timedelta(days=1), db
    )
    if not snapshot.exists:
        return None
    total_calories = snapshot.to_dict().get("total_calories")
    return float(total_calories) if total_calories is not None else None


async def get_weekly_average(user_id: str, db) -> Optional[float]:
    snapshots = await asyncio.gather(
        *(
            _get_log(
                user_id, date.today() - timedelta(days=offset), db
            )
            for offset in range(7)
        )
    )
    calories = [
        float(snapshot.to_dict().get("total_calories"))
        for snapshot in snapshots
        if snapshot.exists and (snapshot.to_dict().get("total_calories") or 0) > 0
    ]
    if not calories:
        return None
    return sum(calories) / len(calories)
