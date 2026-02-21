# AI Travel Guide Agent (Next.js + OpenAI)

A production-ready, modular AI Travel Guide app built with **Next.js App Router**, **TypeScript**, and **Tailwind CSS**.

## Features

- Destination, dates, budget, travel type, and interests form
- Client-side validation and error messages
- AI itinerary generation via secure backend route handler
- Structured JSON output parsing + schema validation
- Day-by-day plan with activities, food, transport, and cost
- Hotel suggestions, food spots, packing list, tips, and safety notes
- Ready for Vercel deployment

## Folder Structure

```text
.
├── app
│   ├── api
│   │   └── travel-plan
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   └── TravelForm.tsx
├── lib
│   ├── prompts.ts
│   ├── types.ts
│   └── validation.ts
├── .env.example
├── .eslintrc.json
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Add your OpenAI key in `.env.local`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4.1-mini
   ```
4. Run development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## API Contract

### `POST /api/travel-plan`

Request body:

```json
{
  "destination": "Kyoto, Japan",
  "startDate": "2026-04-10",
  "endDate": "2026-04-14",
  "budgetRange": "$1800-$2500",
  "travelType": "couple",
  "interests": ["food", "history", "nature"]
}
```

Response shape:

```json
{
  "summary": "",
  "daily_plan": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": [],
      "food": [],
      "transport": "",
      "estimated_cost": ""
    }
  ],
  "hotel_recommendations": [],
  "local_food_spots": [],
  "transportation_overview": [],
  "cost_breakdown": {
    "accommodation": "",
    "food": "",
    "transport": "",
    "activities": "",
    "misc": ""
  },
  "total_estimated_budget": "",
  "packing_list": [],
  "travel_tips": [],
  "safety_notes": []
}
```

## Deployment on Vercel (Step-by-Step)

1. Push the repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. In project settings, add environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional, defaults to `gpt-4.1-mini`)
4. Click **Deploy**.
5. After deploy, test:
   - Open app URL
   - Submit a trip form
   - Confirm itinerary response renders and errors are handled

### Add env vars after deployment

- Vercel Dashboard → Project → **Settings** → **Environment Variables** → add key/value → redeploy.

## Test Production Build Locally

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

## Performance Optimization Tips

- Keep route handlers lean; do validation before model calls.
- Use low temperature for predictable JSON outputs.
- Cache static assets and use Next.js automatic optimizations.
- Split UI into components to reduce rerender complexity.
- Add response caching / persistence once trips are stored.

## SaaS Extension Roadmap

1. **Authentication + Teams**
   - NextAuth / Clerk
   - Organization-based workspaces
2. **Saved Trips Database**
   - Postgres + Prisma
   - CRUD for trip plans and edits
3. **Hotel/Flight Integrations**
   - Booking API, Amadeus/Skyscanner APIs
4. **Maps + Geo Intelligence**
   - Google Maps Places + directions
5. **Payments + Subscription**
   - Stripe metered billing / plans
6. **Observability**
   - Sentry + analytics + cost monitoring
7. **Background Jobs**
   - Queue itinerary enrichment and email delivery

## Security Notes

- API key is never exposed to browser code.
- Input and output are schema-validated.
- The system prompt enforces strict JSON response formatting.
