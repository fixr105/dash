# Dash

Dash is a full-stack TypeScript application scaffold with a Vite + React frontend and an Express backend.

## Development

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:4000/api/health`

## Prisma + Neon setup

Create `backend/.env` from `backend/.env.example` and set a Neon Postgres `DATABASE_URL`.

Then run:

```bash
npm -w backend run prisma:migrate -- --name init_shared_schema
npm -w backend run prisma:generate
npm -w backend run prisma:seed
```
