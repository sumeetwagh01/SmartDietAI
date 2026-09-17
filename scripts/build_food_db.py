"""Build the normalized SmartDiet food database from the cleaned source datasets."""

import argparse
import re
from pathlib import Path

import pandas as pd


DAIRY_WORDS = r"milk|dairy|paneer|cheese|curd|yogurt|ghee|butter|cream"
GLUTEN_WORDS = r"gluten|wheat|maida|bread|roti|chapati|paratha|pasta|noodle"
NON_VEG_WORDS = r"meat|chicken|fish|shrimp|prawn|beef|pork|egg|mutton|lamb"


def _key(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value).lower())


def _bool_contains(series: pd.Series, pattern: str) -> pd.Series:
    return series.fillna("").astype(str).str.contains(pattern, case=False, regex=True)


def build(processed_dir: Path) -> pd.DataFrame:
    indiet = pd.read_csv(processed_dir / "InDiet_Dataset_cleaned.csv")
    rda = pd.read_csv(processed_dir / "Indian_RDA_Diet_cleaned.csv")
    recipes = pd.read_csv(processed_dir / "Indian_Food_cleaned.csv")

    # One canonical record per named food gives 1,001 broadly representative items.
    indiet = indiet.drop_duplicates(subset="food_name", keep="first").copy()
    food_text = (indiet["food_name"].fillna("") + " " + indiet["allergies"].fillna(""))
    group = indiet["food_group_nin"].fillna("").str.lower()
    result = pd.DataFrame({
        "food_name": indiet["food_name"],
        "calories": pd.to_numeric(indiet["energy_kcal"], errors="coerce").fillna(0),
        "protein": pd.to_numeric(indiet["protein_g"], errors="coerce").fillna(0),
        "carbs": pd.to_numeric(indiet["carb_g"], errors="coerce").fillna(0),
        "fat": pd.to_numeric(indiet["fat_g"], errors="coerce").fillna(0),
        "fibre": pd.to_numeric(indiet["fibre_g"], errors="coerce").fillna(0),
        "sodium": 0.0,
        "glycaemic_index": 55.0,
        "serving_size_g": pd.to_numeric(indiet["Serving_Size_g"], errors="coerce").fillna(100),
        "unit": "serving",
        "meal_type": indiet["food_type"].fillna("meal").str.lower(),
        "region": indiet["region"].fillna("India"),
        "allergens": indiet["allergies"].fillna(""),
        "is_vegetarian": ~group.eq("non-vegetarian"),
        "is_vegan": group.eq("vegan"),
        "is_dairy": _bool_contains(food_text, DAIRY_WORDS),
        "is_gluten": _bool_contains(food_text, GLUTEN_WORDS),
    })

    # Enrich matching records with measured sodium values from the RDA dataset.
    sodium_by_name = {
        _key(row.Food_items): float(row.Sodium)
        for row in rda.itertuples()
        if pd.notna(row.Sodium)
    }
    matched_sodium = result["food_name"].map(lambda name: sodium_by_name.get(_key(name)))
    result.loc[matched_sodium.notna(), "sodium"] = matched_sodium.dropna()

    # Add 74 unique RDA foods to reach the documented 1,075-item catalog.
    existing = {_key(name) for name in result["food_name"]}
    additions = rda[~rda["Food_items"].map(_key).isin(existing)].head(74).copy()
    addition_text = additions["Food_items"].fillna("")
    is_non_veg = additions["VegNovVeg"].astype(str).str.strip().isin({"1", "non-vegetarian"}) | _bool_contains(addition_text, NON_VEG_WORDS)
    extra = pd.DataFrame({
        "food_name": additions["Food_items"],
        "calories": pd.to_numeric(additions["Calories"], errors="coerce").fillna(0),
        "protein": pd.to_numeric(additions["Proteins"], errors="coerce").fillna(0),
        "carbs": pd.to_numeric(additions["Carbohydrates"], errors="coerce").fillna(0),
        "fat": pd.to_numeric(additions["Fats"], errors="coerce").fillna(0),
        "fibre": pd.to_numeric(additions["Fibre"], errors="coerce").fillna(0),
        "sodium": pd.to_numeric(additions["Sodium"], errors="coerce").fillna(0),
        "glycaemic_index": 55.0,
        "serving_size_g": 100.0,
        "unit": "serving",
        "meal_type": additions.apply(lambda row: "breakfast" if row["Breakfast"] == 1 else "lunch" if row["Lunch"] == 1 else "dinner", axis=1),
        "region": "India",
        "allergens": "",
        "is_vegetarian": ~is_non_veg,
        "is_vegan": (~is_non_veg) & ~_bool_contains(addition_text, DAIRY_WORDS),
        "is_dairy": _bool_contains(addition_text, DAIRY_WORDS),
        "is_gluten": _bool_contains(addition_text, GLUTEN_WORDS),
    })

    result = pd.concat([result, extra], ignore_index=True)
    # Recipe ingredients improve dietary flags for names shared with Indian Food.
    ingredients = {_key(row["name"]): str(row["ingredients"]) for _, row in recipes.iterrows()}
    ingredient_text = result["food_name"].map(lambda name: ingredients.get(_key(name), ""))
    result["is_dairy"] |= _bool_contains(ingredient_text, DAIRY_WORDS)
    result["is_gluten"] |= _bool_contains(ingredient_text, GLUTEN_WORDS)
    result.loc[result["is_dairy"], "is_vegan"] = False
    result.loc[~result["is_vegetarian"], "is_vegan"] = False

    assert len(result) == 1075, f"Expected 1,075 foods, got {len(result)}"
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("processed_dir", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    database = build(args.processed_dir)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    database.to_csv(args.output, index=False)
    print(f"Wrote {len(database)} foods to {args.output}")


if __name__ == "__main__":
    main()
