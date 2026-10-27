# SmartDiet AI frontend changelog

## Personalized Indian meals and food search

- Fixed empty API plan envelopes being rendered as zero-calorie plans and removed stale cached empty plans.
- Strengthened meal generation prompts to return recognizable Indian dishes instead of generic meal names.
- Removed provider-generated labels from meal-plan screens while preserving the nutrition medical disclaimer.
- Upgraded food-log autocomplete to rank 1,075 Indian foods and filter suggestions by vegetarian, vegan, allergy, lactose, and gluten profile rules.

## Gemini targets and meal plans

- Added protected AI-plan endpoints for cached Gemini nutrition targets and daily meal plans, with configurable model selection, quota/cooldown controls, retry handling and Firestore persistence.
- Added strict server-side Pydantic and safety validation for nutrition plausibility, allergens, diet rules, disliked foods and condition-specific sodium/protein limits.
- Switched the live Dashboard, onboarding, Diet Plan, Progress, NutriBites context and You page away from the legacy `/meal-plan/*` UI path.
- Added persisted cuisine, meal-count, spice, cooking-time, budget, disliked-food, target-weight and fasting preferences.
- Added robust per-user cleanup on logout, session expiry, cross-tab logout and account switching while preserving the theme.
- NutriBites assistant responses now render structured Gemini Markdown with accessible headings, lists, links, tables, quotes and code blocks.

## Phase 5

- Rebuilt NutriBites with an intro screen, full-screen chat, contextual prompts from real profile/plan/log state, complete conversation history, copy, retry, typing feedback, keyboard sending and a persistent medical disclaimer.
- Rebuilt You with meal-plan history, device favourites, read-only targets, Home customization, food-timeline sharing, preferences, 28-day restart, device-data clearing, About information and logout.
- Added a complete contract-safe profile editor that sends only changed fields and preserves canonical health-condition, allergy and diet values.
- Added an app-wide offline banner, session-expiry handling, reduced-motion-aware transitions and keyboard focus trapping for bottom sheets.
- Added metric/imperial preference storage and expanded client-data reset behavior.
- Removed unused legacy dashboard, food-log and progress components.

## Earlier frontend phases

- Added the persisted 10-step onboarding flow and staged meal-plan generation.
- Rebuilt Home, Food Log, Diet Plan and Progress with real API data, local water/fasting/grocery state, charts, CSV export and clinical-filter-safe errors.
- Added dark/light themes, responsive bottom navigation/sidebar, skeletons, retry/empty states and 90-second API timeouts.

## Intentionally not included

- Delete Account, Premium, Club, steps/sleep tracking, camera scanning, supplements and editable macro targets were intentionally omitted because they are not supported by the current backend contract or were explicitly excluded.
- Historical plan dates are shown only when the backend supplies an identifiable date; the frontend does not guess dates for undated history records.
