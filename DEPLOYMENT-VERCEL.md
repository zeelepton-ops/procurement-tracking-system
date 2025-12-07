# Vercel Deployment (Recommended)

## 1) Set up the database (Supabase Postgres - free tier)
1. Create a Supabase project (Database password: store safely).
2. In Supabase Project Settings → Database, copy the connection string.
   - It looks like: `postgresql://postgres:<password>@<host>:5432/postgres` (may include options).
3. In this project, update `DATABASE_URL` in Vercel to that string.

## 2) Update Prisma schema to Postgres
- Open `prisma/schema.prisma` and change the datasource block to:
```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
- Commit this change before deploying.

## 3) Environment variables (Vercel → Project Settings → Environment Variables)
- `DATABASE_URL` = your Supabase Postgres connection string
- `NEXTAUTH_URL` = `https://your-domain.com` (or the Vercel preview domain first)
- `NEXTAUTH_SECRET` = a long random string (generate with `openssl rand -hex 32` or online generator)

## 4) Deploy to Vercel
1. Push code to GitHub/GitLab/Bitbucket.
2. Import the repo in Vercel, select the project.
3. Add the env vars above.
4. Set Build Command (defaults are fine): `npm install && npm run build`
5. After first deploy, run migrations:
   - Via Vercel CLI (from your machine, with envs set):
     ```
     vercel env pull .env.local
     npx prisma migrate deploy
     ```
     (Ensure `.env.local` has the same DATABASE_URL.)
   - Or add a Post-install Command in Vercel: `npx prisma migrate deploy`
6. (Optional) Seed admin user once against Supabase DB:
   - Locally, with `.env.local` pointing to Supabase: `node prisma/seed.js`
   - Or via Vercel CLI: `vercel exec node prisma/seed.js`

## 5) Start command
- Vercel handles the start; no custom start command needed. For other hosts: `npm start`.

## 6) Custom domain
- In Vercel → Domains, add your domain, update DNS per instructions.
- Set `NEXTAUTH_URL` to the final https domain.

## 7) Login
- Seeded admin (if you ran seed): `admin@example.com / Admin@123`
- Change the password after first login (update the DB with a new bcrypt hash).

## 8) Health check
- `GET /api/health` should return `{ "status": "ok" }` without auth.

## 9) Notes
- SQLite won’t work on Vercel; use Postgres as above.
- Free tiers are fine to start; monitor DB size/limits.
- If you change models later, run `npx prisma migrate dev` locally, commit migration files, then `npx prisma migrate deploy` against production.
