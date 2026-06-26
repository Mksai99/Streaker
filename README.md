# Streakify

Streakify is a dual-portal SaaS platform designed for Customer Loyalty & Streak Management using QR codes. It enables Shop Owners to manage their business, products, galleries, and customer streaks, while Customers can discover shops, track visits, and redeem rewards.

## Project Architecture

This repository contains three main components:

- `frontend/`: The Customer Portal (React, Vite, Tailwind CSS, Radix UI)
- `frontend-shop/`: The Shop Owner Portal (React, Vite, Tailwind CSS, Radix UI)
- `backend/`: The API Server (Node.js, Express, Supabase/Firebase)

## Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion, Radix UI, React Hook Form
- **Backend**: Node.js, Express.js
- **Database**: Supabase PostgreSQL (via Supabase JS)
- **Authentication**: Firebase Authentication / Custom JWT Auth
- **Storage**: Supabase Storage (Images bucket)

## Getting Started

### 1. Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Copy `.env.example` to `.env` (if applicable) and fill in your Supabase and Firebase credentials:
   - `SUPABASE_URL` and `SUPABASE_KEY`
   - Firebase Admin credentials
   - JWT Secrets
4. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend (Customer App) Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 3. Frontend-Shop (Shop Owner App) Setup
1. Navigate to the `frontend-shop` directory.
2. Install dependencies:
   ```bash
   cd frontend-shop
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Key Features

### For Shop Owners
- **Dashboard & Analytics**: View customer visits, active streaks, and redeemed rewards.
- **Shop Management**: Update shop details, cover images, logos, and operating hours.
- **Product Menu**: Add, edit, and organize products and categories with multi-image gallery support.
- **Gallery**: Upload high-quality promotional images.
- **QR Scanner**: Scan customer QR codes to register a visit and update streaks.

### For Customers
- **Shop Discovery**: Browse approved shops and view their products, galleries, and reviews.
- **Loyalty & Streaks**: Earn streaks by visiting shops and checking in.
- **Rewards**: Redeem streak-based rewards (Bronze, Silver, Gold, Platinum).
- **Reviews**: Leave reviews for shops visited.

## Production Deployment Notes

- The backend is configured to use an actual Supabase Database. Ensure `NODE_ENV=production` and `ALLOWED_ORIGINS` are set correctly to secure CORS.
- All base64 image uploads are processed and stored natively via Supabase Storage in the `images` bucket. Make sure the bucket is created and set to "Public".
- The frontend applications can be built using `npm run build` or converted to native Android apps using Capacitor (`@capacitor/core`).
