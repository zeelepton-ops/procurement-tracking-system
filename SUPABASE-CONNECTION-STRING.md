# How to Find Your Supabase Connection String

## Quick Visual Guide

### Step 1: Go to Supabase Dashboard
- Open https://supabase.com
- Make sure you're logged in (you should see your project list)

### Step 2: Click Your Project
- You should see a project named `procurement-db` (or similar)
- **Click on it to enter the project**

### Step 3: Find Settings
Look at the **LEFT SIDEBAR**. You should see:
```
┌─────────────────────┐
│ procurement-db      │
├─────────────────────┤
│ Project Settings    │
│ SQL Editor          │
│ Auth                │
│ Database            │ ← CLICK THIS
│ Storage             │
│ Functions           │
│ Realtime            │
└─────────────────────┘
```

**Click "Database"** in the left sidebar

### Step 4: Find Connection String
After clicking "Database", you should see:

```
┌──────────────────────────────────────┐
│ Database Settings                    │
├──────────────────────────────────────┤
│                                      │
│ Connection String                    │
│                                      │
│ [PostgreSQL] [URI] [Bash]           │
│   ↑ Click this tab                  │
│                                      │
│ Connection Details                   │
│ Host: db.xxxxx.supabase.co           │
│ Port: 5432                           │
│ Database: postgres                   │
│ User: postgres                       │
│ Password: [hidden]                   │
│                                      │
│ URI CONNECTION STRING:                │
│ ┌──────────────────────────────────┐ │
│ │postgresql://postgres:[PASSWORD]@ │ │
│ │db.xxxxx.supabase.co:5432/postgr │ │
│ │ SQL?sslmode=require              │ │
│ │                              [C] │ │ ← COPY BUTTON
│ └──────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
```

### Step 5: Copy the Connection String
- Click the **[C]** (copy) button on the right side of the URI box
- The string is now in your clipboard

### What It Looks Like
```
postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres?sslmode=require
```

---

## Can't Find It?

### Alternative Path 1: Via Project Settings
1. Left sidebar → **Project Settings** (at the top)
2. Click **Database** tab
3. Scroll down → you should see the connection string

### Alternative Path 2: Check Your Browser Tab
- You should be at a URL like: `https://supabase.com/dashboard/project/xxxxx/database/tables`
- If not, go to https://supabase.com/dashboard
- Click your project name
- Look for "Database" in the left sidebar

---

## Still Can't Find It?

**Try this:**
1. Log out and log back in to Supabase
2. Make sure your project is fully created (check for green checkmark)
3. Try using a different browser (Chrome/Edge/Firefox)
4. Check if you're in the right project (top of page should say "procurement-db")

---

## Once You Have It

Copy the entire string (it should start with `postgresql://` and end with `postgres` or `sslmode=require`)

Then paste it here or in your next message, and I'll set everything up!

Example format (don't use this, use YOUR actual string):
```
postgresql://postgres:abc123def456@db.abcdefghijk.supabase.co:5432/postgres?sslmode=require
```
