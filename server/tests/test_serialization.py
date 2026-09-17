import json

import numpy as np

from services.serialization import to_json_safe


def test_optimizer_values_are_strict_json_safe():
    value = {
        "nan": float("nan"),
        "positive_infinity": float("inf"),
        "negative_infinity": np.float64("-inf"),
        "number": np.float64(42.5),
        "integer": np.int64(7),
        "flag": np.bool_(True),
        "nested": [np.float64("nan"), {"value": np.int64(3)}],
    }

    safe = to_json_safe(value)

    assert safe == {
        "nan": None,
        "positive_infinity": None,
        "negative_infinity": None,
        "number": 42.5,
        "integer": 7,
        "flag": True,
        "nested": [None, {"value": 3}],
    }
    json.dumps(safe, allow_nan=False)
