# SmartDiet AI

An AI-assisted nutrition platform that builds clinically aware, personalized Indian meal plans.

## What it does

- Selects balanced meals with linear programming instead of relying on generative guesses.
- Carries calorie differences forward from the previous day with a bounded sequential adjustment.
- Uses Gemini to explain computed plans, followed by a faithfulness check that rejects unsupported claims.
- Searches a normalized database of 1,075 Indian foods with nutrition and dietary metadata.

## Architecture

```text
React (Vercel)
      |
      v
FastAPI (Render)
      |
      +--> Firebase Firestore
      +--> LP Optimizer (PuLP/CBC)
      +--> Gemini API
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
pip install -r requirements.txt
uvicorn main:app --reload
```

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

## Team

Rakshit Rajput · Krushna Mahajan · Sumeet Wagh  
Guide: Prof. Sonia Relan  
MPSTME NMIMS, Shirpur
