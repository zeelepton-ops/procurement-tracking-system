# Vercel Step-by-Step Guide for Beginners

## Pre-requisite: Push code to GitHub

Before you go to Vercel, your code must be on GitHub.

### 1. Install Git (if not already installed)
- Download from https://git-scm.com/download/win
- Install with default settings

### 2. Create a GitHub account
- Go to https://github.com
- Sign up (free)
- Verify your email

### 3. Create a new repository on GitHub
- Click "+" (top right) → "New repository"
- Name: `procurement-tracking-system`
- Description: "Steel Production Procurement Tracking"
- Choose "Public" or "Private" (either works)
- Click "Create repository"

### 4. Push your code to GitHub
In PowerShell, in the Procurement folder:

```powershell
cd "c:\Users\NBTC-SYSID-0013\Documents\Development\ERP - NBTC\Procurement"

# Configure Git with your GitHub details
git config --global user.name "zeelepton-ops"
git config --global user.email "zeelepton@gmail.com"

# Initialize and push
git init
git add .
git commit -m "Initial commit - Procurement Tracking System"
git branch -M main
git remote add origin https://github.com/zeelepton-ops/procurement-tracking-system.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Now: Deploy to Vercel (Step-by-Step)

### Step 1: Go to Vercel website
- Open https://vercel.com
- Click **"Sign Up"** (top right)
- Click **"Continue with GitHub"**
- Log in with your GitHub account
- Authorize Vercel to access GitHub

### Step 2: Import your repository
After logging into Vercel:
- You'll see the **Vercel dashboard**
- Click **"Add New"** button (top right)
- Select **"Project"**

### Step 3: Find and select your repo
- A list of your GitHub repos appears
- Find **"procurement-tracking-system"**
- Click **"Import"**

**Screenshot mental model:**
```
┌────────────────────────────────────────┐
│ Vercel Dashboard                       │
│                                        │
│ [Add New ▼]                           │
│                                        │
│ Your GitHub repositories:              │
│ ☐ repo-1                              │
│ ☐ procurement-tracking-system  ← CLICK │
│ ☐ repo-3                              │
│                                        │
│          [Import] button               │
└────────────────────────────────────────┘
```

### Step 4: Configure project settings
After clicking Import, you'll see a configuration page:

**Project Name:**
- Leave as `procurement-tracking-system` (or rename)

**Framework Preset:**
- Should auto-detect "Next.js" ✓
- If not, select it from dropdown

**Root Directory:**
- Leave as `.` (default)

**Build Command:**
- Leave as `npm install && npm run build`

**Output Directory:**
- Leave as `.next`

**Install Command:**
- Leave as `npm install`

**Screenshot mental model:**
```
┌─────────────────────────────────────────┐
│ Configure Project                       │
├─────────────────────────────────────────┤
│                                         │
│ Project Name:                           │
│ [procurement-tracking-system         ]  │
│                                         │
│ Framework Preset:                       │
│ [Next.js ▼]                            │
│                                         │
│ Root Directory:                         │
│ [.                                   ]  │
│                                         │
│ Build Command:                          │
│ [npm install && npm run build        ]  │
│                                         │
│ Output Directory:                       │
│ [.next                                ]  │
│                                         │
│ Install Command:                        │
│ [npm install                         ]  │
│                                         │
└─────────────────────────────────────────┘
```

### Step 5: Add Environment Variables ← **CRITICAL**
**Scroll down and look for "Environment Variables" section**

You need to add 3 variables. **BEFORE** you click Deploy, add these:

**Variable 1: DATABASE_URL**
- Name: `DATABASE_URL`
- Value: Your Supabase Postgres connection string
  - Go to https://supabase.com
  - Create a project
  - Go to Settings → Database → Connection String
  - Copy the `postgresql://...` URL
  - Paste it here

**Variable 2: NEXTAUTH_URL**
- Name: `NEXTAUTH_URL`
- Value: `https://procurement-tracking-system.vercel.app` (or your custom domain later)

**Variable 3: NEXTAUTH_SECRET**
- Name: `NEXTAUTH_SECRET`
- Value: A random long string. Generate one:
  - Option A: Open PowerShell and run:
    ```powershell
    -join ((0..31) | ForEach-Object { [char][byte]::Parse(('{0:X2}' -f (Get-Random -min 0 -max 256))) })
    ```
  - Option B: Go to https://generate-random.org/ and generate a 32-character hex string

**Screenshot mental model:**
```
┌─────────────────────────────────────────────┐
│ Environment Variables                       │
├─────────────────────────────────────────────┤
│                                             │
│ Name: DATABASE_URL                          │
│ Value: postgresql://postgres:pass@host:5432 │
│ [Add]                                       │
│                                             │
│ Name: NEXTAUTH_URL                          │
│ Value: https://procurement-tracking-system. │
│        vercel.app                           │
│ [Add]                                       │
│                                             │
│ Name: NEXTAUTH_SECRET                       │
│ Value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r │
│ [Add]                                       │
│                                             │
└─────────────────────────────────────────────┘
```

### Step 6: Click Deploy
- Scroll down and click **"Deploy"** button
- Vercel will build your app (takes 2-5 minutes)
- You'll see a **deployment progress screen** with a spinning animation
- Wait for "Deployment Complete ✓"

**Screenshot mental model:**
```
┌──────────────────────────────────┐
│ Deployment Progress              │
├──────────────────────────────────┤
│                                  │
│ ⏳ Building...                   │
│ ⏳ Installing dependencies...    │
│ ⏳ Running build...              │
│ ✓ Build complete                 │
│                                  │
│ Visit:                            │
│ https://procurement-tracking-... │
│                                  │
└──────────────────────────────────┘
```

### Step 7: Open your deployed app
- After deployment completes, click the **URL** shown on the page
- Or go to: `https://procurement-tracking-system.vercel.app`
- You'll see your procurement app! 🎉

---

## After Deployment: Set Up Database

### Step 1: Open Supabase
- Go to https://supabase.com
- Sign up with GitHub (same account as Vercel)

### Step 2: Create a project
- Click **"New Project"**
- Name: `procurement-db`
- Password: Save this securely
- Region: Choose closest to you
- Click **"Create new project"**
- Wait for setup (2-3 minutes)

### Step 3: Get the database connection string
- In Supabase, click **"Settings"** (bottom left)
- Click **"Database"**
- Look for **"Connection string"**
- Click to reveal the PostgreSQL connection
- Copy it (looks like: `postgresql://postgres:password@host:5432/postgres`)

### Step 4: Update Vercel with the real DATABASE_URL
- Go back to Vercel
- Click your project name
- Click **"Settings"**
- Click **"Environment Variables"**
- Find `DATABASE_URL` and click edit
- Paste your Supabase connection string
- Click **"Save"**
- The app will auto-redeploy

### Step 5: Run migrations on Supabase
On your local machine, in PowerShell:

```powershell
cd "c:\Users\NBTC-SYSID-0013\Documents\Development\ERP - NBTC\Procurement"

# Create a .env.local file with your Supabase details
# (Vercel CLI can also do this, but manual is simpler)

# Then run migrations
npx prisma migrate deploy

# Then seed the admin user
node prisma/seed.js
```

You'll see:
```
✅ Created admin user (admin@example.com / Admin@123)
✅ Created job orders
...
🎉 Seeding completed successfully!
```

### Step 6: Test the live app
- Go to `https://procurement-tracking-system.vercel.app/login`
- Log in with:
  - Email: `admin@example.com`
  - Password: `Admin@123`
- Change the password after first login (in your profile or DB)

---

## Using your own domain (Optional)

### Step 1: Add domain in Vercel
- In Vercel, click your project
- Click **"Settings"** → **"Domains"**
- Click **"Add Domain"**
- Type your domain name (e.g., `procurement.yourdomain.com`)
- Click **"Add"**

### Step 2: Update DNS
- Vercel shows DNS records to add in your domain registrar (GoDaddy, Namecheap, etc.)
- Log into your registrar
- Add the DNS records Vercel shows
- Wait 5-30 minutes for DNS to propagate

### Step 3: Update NEXTAUTH_URL in Vercel
- Go back to Vercel Settings → Environment Variables
- Edit `NEXTAUTH_URL`
- Change to `https://procurement.yourdomain.com`
- Save and redeploy

---

## Troubleshooting

**App won't load / 500 error:**
- Check that all 3 env vars are set correctly in Vercel
- Ensure DATABASE_URL is a valid Supabase connection string
- Run `npx prisma migrate deploy` locally to verify DB schema

**Login doesn't work:**
- Make sure you ran `node prisma/seed.js` to create the admin user
- Check `NEXTAUTH_SECRET` is set

**Database not connecting:**
- Test the Supabase connection locally first:
  ```powershell
  npx prisma db execute --stdin < "SELECT NOW();"
  ```

---

## Summary Timeline

1. **Push code to GitHub** (5 min)
2. **Sign up on Vercel + import repo** (5 min)
3. **Add env vars + deploy** (10 min + 5 min build time)
4. **Create Supabase project** (10 min)
5. **Run migrations + seed locally** (5 min)
6. **Test login** (1 min)
7. **Done!** 🎉

**Total: ~40 minutes to live production app.**

---

Let me know when you're ready to start!
