# Maxx Computers Website

A premium, production-ready website for Maxx Computers built with Next.js App Router, Tailwind CSS, and Drizzle ORM.

## Tech Stack
- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS 4
- Framer Motion
- Drizzle ORM + PostgreSQL (`pg`)
- Zustand, React Hook Form + Zod

## Features
- Premium futuristic design
- 3D Interactive laptop visualization (CSS)
- Laptops Ecommerce with cart and checkout
- Service bookings & enquiries
- WhatsApp integration
- Admin Dashboard
- Responsive design

---

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your PostgreSQL database URL:
   ```
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Initialize database schema:
   ```bash
   npx drizzle-kit push
   # or: npm run db:push
   ```

5. Run the dev server:
   ```bash
   npm run dev
   ```

6. Seed demo data:
   Visit `http://localhost:3000/api/seed` once the server is running. This creates the admin user and 13 demo laptops + reviews.

7. Open `http://localhost:3000`

## Admin Access
Visit `/admin`
Password: `admin123`

---

## Vercel Deployment (Recommended)

This project is **fully ready for Vercel**. The database layer is serverless-friendly (SSL + pooled connections, build-safe `DATABASE_URL`, `force-dynamic` for data pages).

### 1. Create a managed Postgres database

Pick one (all provide a `DATABASE_URL`):

- **Neon** (free, recommended): https://neon.tech → Create project → Copy connection string (use the **pooled** URL if offered, with `?sslmode=require`)
- **Vercel Postgres** (Neon-backed): Vercel Dashboard → Storage → Create Postgres
- **Supabase**: https://supabase.com → Database → Connection string

Example pooled URL:
```
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

### 2. Import project to Vercel

- Go to https://vercel.com/new
- Import your GitHub repository `igsonuxd/-maxx-computers` (or this branch `arena/01a08a71-maxx-computers`)
- Framework Preset: **Next.js** (auto-detected)
- Build Command: `npm run build` (default)
- Install Command: `npm install`

### 3. Add Environment Variables in Vercel

In Vercel → Project → **Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | your pooled Postgres URL (with `?sslmode=require` if using Neon) | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` (or your custom domain) | Production |

> Important: The `pg` Pool in `src/db/index.ts` automatically enables `ssl: { rejectUnauthorized: false }` for non-localhost URLs, so Neon/Vercel Postgres/Supabase work out of the box.

### 4. Deploy

Click **Deploy**. First deploy will build without needing a live DB connection (build-safe), then run on Vercel Functions.

### 5. Initialize database on Vercel

After first deploy succeeds, you need to create tables and seed:

**Option A — via Vercel CLI (from your local machine):**
```bash
# Link local to Vercel project
vercel link

# Push schema using the Vercel DATABASE_URL (pull env first)
vercel env pull .env.vercel
# then run drizzle-kit with that env
DATABASE_URL=$(grep DATABASE_URL .env.vercel | cut -d '=' -f2-) npx drizzle-kit push

# Seed (creates admin + demo laptops)
curl https://your-project.vercel.app/api/seed
```

**Option B — via local `DATABASE_URL` pointing at same managed DB:**
```bash
# Temporarily set DATABASE_URL to your Neon/Supabase URL in .env
DATABASE_URL="postgresql://..." npx drizzle-kit push
# Then seed via browser:
# https://your-project.vercel.app/api/seed
```

Verify health:
```
https://your-project.vercel.app/api/health  →  { "status": "ok" }
```

### 6. Custom Domain (optional)

Vercel → Settings → Domains → Add your domain (e.g. `maxxcomputers.in`) and update `NEXT_PUBLIC_SITE_URL` to that domain.

---

## Database Scripts

```bash
npm run db:push      # push schema to DB (drizzle-kit push)
npm run db:generate  # generate migrations
npm run db:migrate   # run migrations
npm run db:studio    # open Drizzle Studio
```

Migrations use:
- `drizzle.config.ts` (reads `process.env.DATABASE_URL` — used on Vercel and when you have env set)
- `drizzle.config.json` (fallback for local dev without env, defaults to `localhost`)

## Vercel Configuration Notes

- `vercel.json` sets `regions: ["bom1"]` (Mumbai) for low latency in India. Remove or change if you serve globally.
- `src/db/index.ts` uses `ssl` only for non-localhost URLs and serverless-friendly Pool settings (`max: 10`).
- Pages that query the DB (`/laptops`, `/laptops/[id]`, `/admin/dashboard`, API routes) are marked `dynamic = "force-dynamic"` so they never try to fetch at build time.
- `src/proxy.ts` (Next 16) + `src/middleware.ts` (legacy alias) protect `/admin/dashboard`. Both export the same check.
- `next.config.ts` allows images from `images.unsplash.com` etc. Add your CMS/image hosts there if needed.

## Troubleshooting Vercel

- **Build fails with `DATABASE_URL is required`**: Fixed — build now warns but succeeds without DB. Ensure you set `DATABASE_URL` in Vercel Env Vars for runtime.
- **API returns `Database connection failed`**: Check `DATABASE_URL` is correct and allows connections from Vercel (Neon → allow all IPs or add Vercel NAT).
- **SSL errors**: Ensure URL ends with `?sslmode=require` for Neon; the pool forces SSL otherwise.
- **Seed returns `Already seeded`**: DB already has products. To reseed, truncate `products` table.
- **Admin not logging in**: Default password is `admin123` (hashed via bcrypt on seed). Clear cookies if stuck.
