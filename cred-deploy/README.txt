Reference for fresh chats (no secrets stored)

Core stack
- Next.js 14.2.33 (App Router)
- Prisma 5.22.0 (PostgreSQL/Supabase)
- Build: npm run build (runs prisma generate + next build)

Worker schema highlights
- Fields include nationality?, profession?, visaCategory, qid, passportNo, joiningDate, status, allottedShift, internalCompanyShift, addresses, phone/email, audit fields
- Unique: qid, passportNo
- Optional: profession, nationality, exitDate, addresses, phone/email
- Default: profession falls back to "Not Specified" in create/import; visaCategory defaults to "Work Visa"

Critical endpoints
- POST /api/workers/init  (idempotent; adds nationality column; drops NOT NULL on profession)
- /api/workers  GET (search/status; export=true for CSV), POST, PUT, DELETE
- /api/workers/import  POST (Excel via xlsx; flexible column names)
- /api/workers/attendance  GET/POST/PUT
- /api/workers/salary  GET/POST
- /api/workers/audit  GET
- Other domains present: job-orders, material-requests, purchase-orders, suppliers, enquiries, inventory, assets, users

UI features (workers)
- Sorting: name, QID, status, join date; asc/desc toggle
- Search + status filter + count display
- Bulk select + bulk delete with header checkbox and row highlight
- Import/export buttons; "Initialize Tables" button when empty

Deployment notes
- After schema changes, run POST /api/workers/init
- If P2021/P2022 (missing column/table), re-run init
- Excel import requires dependency: xlsx ^0.18.5

Environment variables (fill these privately; do not commit secrets)
- DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
- NEXTAUTH_SECRET=your-nextauth-secret
- NEXTAUTH_URL=https://your-domain.com
- APP_BASE_URL=https://your-domain.com (used for password reset link construction; falls back to NEXTAUTH_URL or VERCEL_URL)
- SUPABASE_URL=https://your-supabase-instance.supabase.co
- SUPABASE_ANON_KEY=your-anon-key
- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (keep server-side only)
- SMTP_HOST=your-smtp-host
- SMTP_PORT=your-smtp-port (465 if using SSL)
- SMTP_USER=your-smtp-user
- SMTP_PASS=your-smtp-password
- EMAIL_FROM=no-reply@your-domain.com (defaults to SMTP_USER if not set)
- ENCRYPTION_KEY=32-char-random-string

Google Workspace SMTP (info@nbtcqatar.com)
- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=465 (SSL) or 587 (STARTTLS)
- SMTP_USER=info@nbtcqatar.com
- SMTP_PASS=Google App Password for info@nbtcqatar.com (preferred) or SMTP relay credential
- EMAIL_FROM=info@nbtcqatar.com
- Notes: enable 2-Step Verification on the account to create an App Password; avoid "less secure apps". If using Workspace SMTP relay, allowlist your server IP and use STARTTLS on 587.

Service endpoints (replace with your values)
- App base URL: https://your-domain.com
- API base URL: https://your-domain.com/api
- Supabase project URL: https://your-supabase-instance.supabase.co

Auth & rules
- next-auth session required on API routes
- Enforce unique QID and Passport (frontend check + backend constraint)

If you need secrets (DB URL, keys), add them to environment variables in your hosting platform; they are intentionally not stored here.