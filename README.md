# PULSO — Financial Companion for University Students

A Progressive Web App that helps university students track spending, set weekly budgets, gain AI-powered insights, and book sessions with peer financial advisors.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion |
| State | Zustand + React Query |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| AI | OpenAI GPT-4o |
| Email | Resend |
| Sessions | Calendly API |
| Deploy | Vercel (frontend) + Railway (backend + DB) |

---

## Quick Start

### 1. Prerequisites
- Node.js 20+
- PostgreSQL 15+
- pnpm (recommended)

### 2. Clone & Install

```bash
git clone <repo>
cd pulso-app

# Backend
cd server && pnpm install

# Frontend
cd ../client && pnpm install
```

### 3. Environment Variables

**server/.env**
```
DATABASE_URL="postgresql://user:password@localhost:5432/pulso"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
OPENAI_API_KEY="sk-..."
CALENDLY_API_TOKEN="eyJ..."
RESEND_API_KEY="re_..."
UPLOADTHING_SECRET="sk_live_..."
FRONTEND_URL="http://localhost:5173"
PORT=3001
```

**client/.env**
```
VITE_API_URL="http://localhost:3001"
```

### 4. Database Setup

```bash
cd server
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

### 5. Run Development

```bash
# Terminal 1 — Backend
cd server && pnpm dev

# Terminal 2 — Frontend
cd client && pnpm dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001

---

## Deploy

### Railway (Backend + DB)
1. Create a Railway project
2. Add PostgreSQL service
3. Deploy the `server/` directory
4. Set environment variables in Railway dashboard
5. Run `pnpm prisma migrate deploy` via Railway CLI

### Vercel (Frontend)
1. Connect GitHub repo to Vercel
2. Set root directory to `client/`
3. Set `VITE_API_URL` to your Railway backend URL
4. Deploy

---

## Project Structure

```
pulso-app/
├── client/                  # React PWA
│   ├── public/
│   │   ├── manifest.json    # PWA manifest
│   │   └── sw.js            # Service worker
│   └── src/
│       ├── api/             # Axios API client + endpoints
│       ├── components/      # Reusable UI components
│       ├── hooks/           # React Query hooks
│       ├── lib/             # Utilities
│       ├── pages/           # Route-level page components
│       ├── store/           # Zustand stores
│       ├── types/           # TypeScript types
│       └── App.tsx
├── server/                  # Express API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── controllers/     # Route handlers
│       ├── lib/             # DB client, JWT, OpenAI, etc.
│       ├── middleware/      # Auth, validation, error handling
│       ├── routes/          # Express routers
│       └── services/        # Business logic
└── README.md
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/user/profile | Get current user profile |
| PATCH | /api/user/profile | Update profile + onboarding |
| POST | /api/transacciones | Create transaction |
| GET | /api/transacciones | List transactions |
| GET | /api/transacciones/weekly-summary | Weekly spending summary |
| POST | /api/metas | Create goal |
| GET | /api/metas/active | Get active goals |
| PATCH | /api/metas/:id | Update goal |
| GET | /api/sesiones | List user sessions |
| POST | /api/sesiones/book | Book a session |
| GET | /api/sesiones/disponibilidad | Get advisor availability |
| PATCH | /api/sesiones/:id/cancel | Cancel session |
| POST | /api/insights/generate | Generate AI insights |
