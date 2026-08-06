# Streakify

Streakify is a monorepo for a QR-based loyalty and streak management SaaS. It includes two React frontends (customer and shop owner) and an Express backend integrated with Supabase and Firebase.

## Project Structure

```text
apps/
  customer-app/      Customer-facing React + Vite application
  shop-owner-app/    Shop-owner React + Vite application
backend/             Express API server (Supabase/Firebase/JWT)
shared/              Shared UI helpers, services, and utilities used across apps
```

## Tech Stack

- **Monorepo:** npm workspaces
- **Frontend:** React, Vite, Tailwind CSS, Radix UI, Framer Motion
- **Backend:** Node.js, Express 5
- **Data/Auth:** Supabase (`@supabase/supabase-js`), Firebase Admin, JWT
- **Infra:** Docker + docker-compose

## Workspace Scripts (run from repo root)

```bash
npm install

npm run dev:backend   # Starts backend workspace (streakify-backend)
npm run dev:customer  # Starts customer app workspace (@streakify/customer-app)
npm run dev:shop      # Starts shop owner app workspace (@streakify/shop-owner-app)
npm run dev:all       # Runs backend + both frontends concurrently
```

## App Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Expected env values include Supabase keys/URL, Firebase Admin credentials, and JWT-related secrets.

### Customer App

```bash
cd apps/customer-app
npm install
cp .env.example .env
npm run dev
```

### Shop Owner App

```bash
cd apps/shop-owner-app
npm install
cp .env.example .env
npm run dev
```

## Docker

The repository includes:

- `backend/Dockerfile`
- `apps/customer-app/Dockerfile`
- `apps/shop-owner-app/Dockerfile`
- root `docker-compose.yml`

> Note: `docker-compose.yml` currently references a `./frontend` build context for the frontend service, while the repo now uses `apps/customer-app` and `apps/shop-owner-app`. Update compose service paths if you want both current frontend apps containerized via Compose.

## Feature Areas

### Shop Owner Portal

- Dashboard and analytics
- Shop profile and media management
- Product/menu management
- QR-based customer check-in workflows

### Customer Portal

- Shop discovery and viewing
- Visit streak tracking
- Reward redemption tiers
- Reviews and engagement

## Shared Package

The `shared` workspace is published internally as `@streakify/shared` and exports:

- `services/*`
- `utilities/*`
- `components/*`
- `hooks/*`
- `ui/*`

## Notes

- Root workspace name: `streakify-monorepo`
- Backend entry point: `backend/src/server.js`
- Backend helper scripts include `npm run seed` (inside `backend`)
