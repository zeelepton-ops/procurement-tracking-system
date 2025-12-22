# Quick Deploy Guide (Manual Steps Required)

Since I can't install Git directly without admin access, here's what **you** need to do:

## Step 1: Install Git (One-time, ~5 minutes)

1. Download Git from: https://git-scm.com/download/win
2. Run the installer (accept all defaults)
3. Restart PowerShell or open a new terminal

## Step 2: Push Code to GitHub (First time, ~10 minutes)

After Git is installed, open PowerShell and run:

```powershell
cd "c:\Users\NBTC-SYSID-0013\Documents\Development\ERP - NBTC\Procurement"

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Initialize repository
git init
git add .
git commit -m "Initial commit - Procurement Tracking System"
git branch -M main

# You'll need to create a GitHub repo first and replace YOUR_USERNAME
git remote add origin https://github.com/YOUR_USERNAME/procurement-tracking-system.git
git push -u origin main
```

## Step 3: Set Up on Vercel (~15 minutes)

1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel
4. Click "Add New" → "Project"
5. Select `procurement-tracking-system`
6. Click "Import"
7. **Add these 3 Environment Variables BEFORE clicking Deploy:**

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://localhost/procurement` (temporary; will update later) |
| `NEXTAUTH_URL` | `https://procurement-tracking-system.vercel.app` |
| `NEXTAUTH_SECRET` | Generate: Open PowerShell and run: `[System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))` |

8. Click "Deploy"
9. Wait for deployment to complete (~5 min)

---

### Optional: Email / SMS Notifications (configure if you want enquiry circulation to notify suppliers)

If you want the app to send emails and SMS when an enquiry is sent, add these environment variables in Vercel (or your .env.local for local dev):

| Key | Value |
|-----|-------|
| `SMTP_HOST` | e.g., `smtp.mailgun.org` |
| `SMTP_PORT` | e.g., `587` |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `EMAIL_FROM` | Default From address (optional) |
| `TWILIO_SID` | Twilio Account SID (optional) |
| `TWILIO_TOKEN` | Twilio Auth Token (optional) |
| `TWILIO_FROM` | Your Twilio phone number (optional) |

If these are not set, enquiries will still be created; notifications will be skipped and stored with status `FAILED` in the DB.

## Step 4: Set Up Supabase Database (~15 minutes)

1. Go to https://supabase.com
2. Click "Create a project"
3. Sign in with GitHub
4. Name: `procurement-db`
5. Password: Save this somewhere safe!
6. Region: Choose closest to you
7. Click "Create new project"
8. Wait for setup to complete

Once done:
- Click "Settings" (bottom left)
- Click "Database"
- Look for "Connection string" section
- Copy the PostgreSQL connection string (starts with `postgresql://`)

## Step 5: Update Database Connection in Vercel (~5 minutes)

1. Go back to Vercel
2. Click your project
3. Click "Settings"
4. Click "Environment Variables"
5. Find `DATABASE_URL` and click edit
6. **Paste the Supabase connection string** (from Step 4)
7. Click "Save"
8. The app will auto-redeploy

## Step 6: Run Migrations Locally (~5 minutes)

Back in PowerShell:

```powershell
cd "c:\Users\NBTC-SYSID-0013\Documents\Development\ERP - NBTC\Procurement"

# Create .env.local with your Supabase connection
# Add this line to a new file called .env.local in the project folder:
# DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/postgres

# Then run:
npx prisma migrate deploy
node prisma/seed.js
```

You should see:
```
✅ Created admin user (admin@example.com / Admin@123)
✅ Created job orders
...
🎉 Seeding completed successfully!
```

## Step 7: Test Your Live App! 🎉

1. Go to: https://procurement-tracking-system.vercel.app/login
2. Log in with:
   - Email: `admin@example.com`
   - Password: `Admin@123`

**Done! Your app is now live online!**

---

## Summary

| Task | Time | Status |
|------|------|--------|
| Install Git | 5 min | ⏳ You do this |
| Push to GitHub | 10 min | ⏳ You do this |
| Deploy to Vercel | 15 min | ⏳ You do this |
| Create Supabase DB | 15 min | ⏳ You do this |
| Update DB in Vercel | 5 min | ⏳ You do this |
| Run migrations | 5 min | ⏳ You do this |
| Test login | 1 min | ⏳ You do this |
| **TOTAL** | **~56 min** | ✅ **LIVE APP** |

---

## Need Help?

**GitHub not recognizing your email?**
- Make sure you've verified your GitHub email

**Vercel deployment fails?**
- Check all 3 env vars are set correctly
- Make sure Next.js is selected as framework

**Can't connect to Supabase?**
- Verify the connection string is correct
- Check Supabase project status

Once you complete these steps, let me know and I can help with any issues! 💪
