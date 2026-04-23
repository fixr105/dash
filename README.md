# Money Multiplier

`Money Multiplier` is a backend-ready dashboard rebuild of the original `money_multiplier.html` prototype.

## Workspace Structure

- `frontend/`: Vite + React + TypeScript dashboard UI
- `backend/`: Express + TypeScript API with in-memory repositories and seed data
- `money_multiplier.html`: original single-file prototype retained as a reference source

## What Ships In V1

- Capital dashboard
- Client management
- Transaction tracking
- Commercial setup
- Revenue split analytics
- Liquidity engine
- Cashflow timeline
- Decision engine
- Metric engine calculators

The backend intentionally uses in-memory seed data for now, but it already separates:

- repository/state storage
- request context middleware for future auth
- analytics/service calculations
- REST endpoints for frontend consumption

That makes it straightforward to introduce authentication, database persistence, or LOS integration later.

## Local Development

Install dependencies from the workspace root:

```bash
npm install
```

Run both frontend and backend:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Verification Commands

Backend tests:

```bash
npm run test --workspace backend
```

Backend typecheck:

```bash
npm run typecheck --workspace backend
```

Frontend production build:

```bash
npm run build --workspace frontend
```

Workspace build:

```bash
npm run build
```
