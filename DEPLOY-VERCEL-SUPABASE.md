# Deploy to Vercel + Supabase (Final Steps)

✅ **GitHub: DONE** - Your code is at: https://github.com/zeelepton-ops/procurement-tracking-system

Now deploy to Vercel and Supabase using this checklist.

---

## Step 1: Deploy to Vercel (10 minutes)

1. Open https://vercel.com
2. Sign up → "Continue with GitHub"
3. Authorize Vercel to access GitHub
4. Click **"Add New"** (top right) → **"Project"**
5. Find and click **"procurement-tracking-system"** repo
6. Click **"Import"**

### Configure Project Settings:
- **Project Name:** `procurement-tracking-system`
- **Framework:** Should show "Next.js" (auto-detected) ✓
- **Root Directory:** `.` (default)
- Click **"Continue"**

### Add Environment Variables (CRITICAL - 3 variables):

Scroll down to **"Environment Variables"** section and add these:

#### Variable 1: DATABASE_URL
- **Name:** `DATABASE_URL`
- **Value:** `postgresql://placeholder` (temporary - will update later)
- Click "Add"

#### Variable 2: NEXTAUTH_URL
- **Name:** `NEXTAUTH_URL`
- **Value:** `https://procurement-tracking-system.vercel.app`
- Click "Add"

#### Variable 3: NEXTAUTH_SECRET
Generate a random secret - open PowerShell and run:
```powershell
[System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```
Copy the output, then:
- **Name:** `NEXTAUTH_SECRET`
- **Value:** (paste the generated string)
- Click "Add"

### Deploy:
- Scroll down and click **"Deploy"** button
- Wait 3-5 minutes for build to complete
- You'll see a link like: `https://procurement-tracking-system.vercel.app`
- **DON'T TEST YET** - database not connected

✅ **Vercel deployment: DONE**

---

## Step 2: Create Supabase Database (10 minutes)

1. Open https://supabase.com
2. Sign up → "Continue with GitHub" (same account)
3. Authorize Supabase
4. Click **"New Project"**

### Project Settings:
- **Database name:** `procurement-db`
- **Password:** Generate a strong password (save it!)
- **Region:** Choose closest to you
- Click **"Create new project"**
- Wait 2-3 minutes for setup

### Get Connection String:
Once the project is created:
1. Left sidebar → Click **"Settings"** (⚙️ icon)
2. Click **"Database"**
3. Under "Connection string" section, click the **"PostgreSQL"** tab
4. Click "Copy" button
5. Paste it somewhere safe - looks like:
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

✅ **Supabase database: DONE**

---

## Step 3: Update Vercel with Real Database URL (5 minutes)

1. Go back to https://vercel.com
2. Click your **"procurement-tracking-system"** project
3. Click **"Settings"** (top menu)
4. Click **"Environment Variables"** (left sidebar)
5. Find `DATABASE_URL` and click the **"Edit"** button (pencil icon)
6. **Delete the placeholder value** and **paste your Supabase connection string**
7. Click **"Save"**
8. The app will auto-redeploy (takes 1-2 minutes)

✅ **Vercel database URL updated: DONE**

---

## Step 4: Run Migrations & Seed Data (10 minutes)

On your local machine, open PowerShell:

```powershell
cd "c:\Users\NBTC-SYSID-0013\Documents\Development\ERP - NBTC\Procurement"

# Create .env.local file with your Supabase connection
# Edit with Notepad or VS Code:
notepad .env.local

# Paste this line (replace with your actual Supabase connection string):
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres

# Save the file
```

Then in PowerShell, run:

```powershell
# Refresh PATH for Git
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Run migrations
npx prisma migrate deploy

# Seed the database with admin user and sample data
node prisma/seed.js
```

You should see:
```
✅ Created admin user (admin@example.com / Admin@123)
✅ Created 3 job orders
✅ Created 4 material requests
✅ Created suppliers
✅ Created inventory items
✅ Created procurement actions
✅ Created purchase orders
🎉 Seeding completed successfully!
```

✅ **Database migrations & seeding: DONE**

---

## Step 5: Test Your Live App! 🎉

1. Open: https://procurement-tracking-system.vercel.app/login
2. Log in with:
   - **Email:** `admin@example.com`
   - **Password:** `Admin@123`

You should see the **Procurement Tracking Dashboard**!

---

## Verify All Features Work:

- [ ] Login page loads
- [ ] Can log in with admin credentials
- [ ] Dashboard shows live data
- [ ] Can create new material requests
- [ ] Can view procurement tracking
- [ ] Can update procurement status
- [ ] Real-time updates work (refresh in 30 seconds)

---

## Summary

| Task | Time | Status |
|------|------|--------|
| Push to GitHub | ✅ 5 min | **DONE** |
| Deploy to Vercel | 10 min | 👈 **Do this** |
| Create Supabase DB | 10 min | 👈 **Then this** |
| Update DB URL | 5 min | 👈 **Then this** |
| Migrations & Seed | 10 min | 👈 **Then this** |
| Test login | 1 min | 👈 **Finally this** |
| **Total** | **~41 min** | ✅ **LIVE APP** |

---

## Your Live App URL

Once deployed: **https://procurement-tracking-system.vercel.app**

---

## Troubleshooting

**404 / Page not found?**
- Wait 5 minutes for Vercel deployment to complete
- Hard refresh (Ctrl+Shift+R)

**Login doesn't work?**
- Verify migrations ran successfully
- Check seed script output showed "✅ Created admin user"
- Verify DATABASE_URL is correct in Vercel settings

**Database connection error?**
- Check Supabase project is running
- Verify connection string in .env.local
- Try running locally first: `npx prisma db execute --stdin < "SELECT NOW();"`

**Deploy failed in Vercel?**
- Check all 3 env vars are set
- Ensure NEXTAUTH_SECRET is a valid hex string (32 bytes)
- Check Vercel build logs for specific errors

---

Let me know when you've completed each step! 🚀
