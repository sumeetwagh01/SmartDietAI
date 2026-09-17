import pytest

from models.user import ActivityLevel, DietGoal, UserProfile
from services.nutrition_calculator import compute_targets


def profile(**overrides) -> UserProfile:
    values = {
        "uid": "target-test",
        "name": "Target Test",
        "email": "targets@example.com",
        "age": 30,
        "gender": "male",
        "weight_kg": 70,
        "height_cm": 175,
        "activity_level": ActivityLevel.moderate,
        "goal": DietGoal.maintenance,
    }
    values.update(overrides)
    return UserProfile(**values)


def test_male_maintenance_targets():
    targets = compute_targets(profile())

    assert targets.bmr == pytest.approx(1648.75)
    assert targets.tdee == pytest.approx(2555.5625)
    assert targets.target_calories == pytest.approx(2555.5625)
    assert targets.protein_g == pytest.approx(159.72265625)
    assert targets.carbs_g == pytest.approx(319.4453125)
    assert targets.fat_g == pytest.approx(70.98784722)
    assert targets.fibre_g == pytest.approx(35.777875)
    assert targets.sequential_adjustment == 0


def test_female_weight_loss_floor():
    targets = compute_targets(
        profile(
            gender="female",
            weight_kg=45,
            height_cm=150,
            activity_level=ActivityLevel.sedentary,
            goal=DietGoal.weight_loss,
        )
    )

    assert targets.bmr == pytest.approx(1076.5)
    assert targets.tdee == pytest.approx(1291.8)
    assert targets.target_calories == 1200


@pytest.mark.parametrize(
    ("actual_yesterday_kcal", "expected_adjustment"),
    [(0, 300), (5000, -300), (2000, 166.66875)],
)
def test_sequential_adjustment_is_clamped(
    actual_yesterday_kcal, expected_adjustment
):
    targets = compute_targets(
        profile(), actual_yesterday_kcal=actual_yesterday_kcal
    )
    assert targets.sequential_adjustment == pytest.approx(expected_adjustment)


@pytest.mark.parametrize(
    ("goal", "offset"),
    [
        (DietGoal.weight_loss, -500),
        (DietGoal.weight_gain, 400),
        (DietGoal.maintenance, 0),
        (DietGoal.muscle_gain, 200),
    ],
)
def test_goal_offsets(goal, offset):
    targets = compute_targets(profile(goal=goal))
    assert targets.target_calories == pytest.approx(targets.tdee + offset)
