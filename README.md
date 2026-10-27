# SmartDiet AI

An AI-assisted nutrition platform that builds safety-checked, personalized Indian meal plans.

## What it does

- Uses Gemini to calculate daily calorie, macro, fibre and water targets and to generate the live UI meal plan.
- Validates every Gemini result with strict Pydantic schemas, nutrition plausibility checks and server-side diet/allergen/medical keyword safety rules before returning it.
- Keeps the original linear-programming planner, clinical filter and sequential adjustment routes for compatibility and their existing tests; the React UI no longer calls that planner.
- Searches a normalized database of 1,075 Indian foods with nutrition and dietary metadata.

## Architecture

```text
React (Vercel)
      |
      v
FastAPI (Render)
      |
      +--> Firebase Firestore
      +--> Gemini API (targets + meal plans)
      +--> Server-side AI safety validation
      +--> Legacy LP Optimizer (retained, not used by the UI)
```

## Local setup

### Prerequisites

- Python 3.11
- Node.js 20
- A Firebase project
- A Gemini API key

### Backend

```bash
cd server
cp .env.example .env
# Fill in your values
# GEMINI_MODEL defaults to gemini-3.6-flash and can be overridden as models change.
pip install -r requirements.txt
uvicorn main:app --reload
```

### AI plan API

All routes require the existing Firebase bearer token:

- `GET /api/v1/ai-plan/targets` returns cached targets and whether profile changes made them stale.
- `POST /api/v1/ai-plan/targets` calculates or reuses targets for the profile/preference hash.
- `GET /api/v1/ai-plan/today?date=YYYY-MM-DD` returns a cached plan or `null`.
- `POST /api/v1/ai-plan/meal-plan` generates or reuses a safety-checked plan.

Generation is limited to 12 Gemini calls per user per day with a 10-second cooldown. Invalid, unsafe or timed-out output is retried twice and then returns a safe error without partial data. The safety scan is keyword-based and may miss unusual ingredient names or over-block a safe name; all nutrition values are Gemini estimates and are not backed by the food database. SmartDiet AI is not medical advice.

### Frontend

```bash
cd client
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

## Deployment

- Backend: Render.com (start command: `uvicorn main:app --host 0.0.0.0 --port 10000`)
- Frontend: Vercel (root directory: `client`)

Pushes to `main` trigger the Render and Vercel deployment hooks configured in GitHub repository secrets. Pull requests to `main` or `develop` run backend tests and frontend build checks.

## Rebuilding the food database

The committed database can be regenerated from the cleaned source datasets:

```bash
python scripts/build_food_db.py /path/to/data/processed server/data/food_db_final.csv
```

## Team

Rakshit Rajput · Krushna Mahajan · Sumeet Wagh  
Guide: Prof. Sonia Relan  
MPSTME NMIMS, Shirpur
