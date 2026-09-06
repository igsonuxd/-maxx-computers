# Maxx Computers Website

A premium, production-ready website for Maxx Computers built with Next.js App Router, Tailwind CSS, Three.js, and Drizzle ORM.

## Tech Stack
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Three.js / React Three Fiber
- Drizzle ORM
- PostgreSQL
- Zustand
- React Hook Form + Zod

## Features
- Premium futuristic design
- 3D Interactive laptop visualization
- Laptops Ecommerce with cart and checkout
- Service bookings
- WhatsApp integration
- Admin Dashboard
- Responsive design

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your PostgreSQL database URL.

4. Initialize database schema:
   ```bash
   npx drizzle-kit push
   ```

5. Seed placeholder data:
   Start the dev server and visit `http://localhost:3000/api/seed` in your browser. This will populate demo products and admin user.

6. Run local development server:
   ```bash
   npm run dev
   ```

## Admin Access
Visit `/admin`
Password: `admin123`

## Vercel Deployment
1. Import project in Vercel.
2. Add `DATABASE_URL` to Vercel environment variables.
3. Deploy!
