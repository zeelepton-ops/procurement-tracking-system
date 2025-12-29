# Deployment Instructions

## Overview
This document provides step-by-step instructions to deploy the new material request and PO features.

## Pre-Deployment Checklist

- [ ] Backup your database
- [ ] Review all changes in `IMPLEMENTATION-SUMMARY-2025-12-29.md`
- [ ] Have a staging environment to test
- [ ] Notify users of upcoming changes

---

## Step 1: Update Database Schema

### Option A: Using Prisma Migrations (Recommended)

```bash
# Navigate to project root
cd "ERP - NBTC/Procurement"

# Run the migration
npx prisma migrate deploy

# Or if you need to create the migration first:
npx prisma migrate dev --name add_payment_terms
```

### Option B: Manual SQL (If migrations disabled)

Execute this SQL on your database:

```sql
ALTER TABLE "PurchaseOrder" ADD COLUMN "paymentTerms" TEXT;
```

**Database:** PostgreSQL  
**Table:** PurchaseOrder  
**New Column:** paymentTerms (TEXT, nullable)

---

## Step 2: Deploy Code Changes

### Files to Deploy:

1. **New Files (Upload):**
   ```
   app/api/material-requests/[id]/items/route.ts
   prisma/migrations/20251229_add_payment_terms.sql
   ```

2. **Modified Files (Replace):**
   ```
   app/material-request/page.tsx
   app/purchase-orders/prepare/page.tsx
   app/api/purchase-orders/route.ts
   prisma/schema.prisma
   ```

### Via Git:
```bash
git add .
git commit -m "feat: Material request item deletion and PO supplier auto-population"
git push origin main
```

### Via Vercel/Server:
- Push changes to your repository
- Deployment should happen automatically
- Or redeploy manually from your hosting platform

---

## Step 3: Verify Deployment

### Test Material Request Deletion:
1. Create a test material request with 3+ items
2. Delete one item via the UI
3. Verify only that item is deleted
4. Verify request still exists with other items
5. Check network tab shows DELETE to `/api/material-requests/[id]/items`

### Test PO Creation:
1. Navigate to "Procurement → Purchase Orders → Prepare PO"
2. Verify supplier dropdown loads (check console for any errors)
3. Select a supplier
4. Verify fields auto-populate:
   - Contact information
   - Payment terms
5. Add 2-3 items
6. Create PO
7. Verify PO is saved in database

### Database Verification:
```sql
-- Check new column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'PurchaseOrder' AND column_name = 'paymentTerms';

-- Should return: paymentTerms

-- Check data
SELECT id, "poNumber", "supplierName", "paymentTerms" 
FROM "PurchaseOrder" LIMIT 5;
```

---

## Step 4: User Communication

### Notify Users:

**Subject:** New Features Available - Material Requests & Purchase Orders

**Message:**
```
We've deployed two important improvements to streamline your procurement workflow:

1. Material Request Management
   - You can now delete individual line items independently
   - Each item has its own delete button
   - Other items in the same request remain unaffected

2. Purchase Order Creation
   - New user-friendly interface (no more JSON entry!)
   - Supplier dropdown with auto-populated details:
     * Contact information
     * Address
     * Payment terms
     * Lead time
   - Easy item management with add/remove buttons

See QUICK-START-GUIDE.md for detailed usage instructions.
```

---

## Step 5: Monitor & Support

### Watch For Issues:
- Check application logs for errors
- Monitor database performance (new queries)
- Verify API response times are normal

### Common Issues & Solutions:

#### Issue: "Unknown column 'paymentTerms'"
**Solution:** Run the database migration
```bash
npx prisma migrate deploy
```

#### Issue: Supplier dropdown is empty
**Solution:** 
- Verify suppliers exist in database
- Check supplier status is "APPROVED"
- Refresh browser cache

#### Issue: Item deletion not working
**Solution:**
- Clear browser cache
- Check API endpoint is accessible
- Verify user has delete permissions

#### Issue: TypeScript errors after deployment
**Solution:**
- Run `npm run build` locally to verify
- Check all files are properly copied
- Restart your application server

---

## Rollback Plan

If you need to rollback these changes:

### Rollback Code:
```bash
git revert <commit-hash>
git push origin main
```

### Rollback Database (If needed):
```sql
-- Remove the new column (WARNING: Data will be lost)
ALTER TABLE "PurchaseOrder" DROP COLUMN "paymentTerms";
```

Or with Prisma:
```bash
npx prisma migrate resolve --rolled-back 20251229_add_payment_terms
```

---

## Post-Deployment Checklist

- [ ] Database migration completed successfully
- [ ] All new files are in place
- [ ] Material request deletion works correctly
- [ ] PO creation with supplier dropdown works
- [ ] No console errors in browser
- [ ] API responses are correct and quick
- [ ] Users notified of changes
- [ ] Documentation (QUICK-START-GUIDE.md) shared with team

---

## Performance Impact

- **Database:** Minimal - only 1 new nullable column
- **API:** No performance impact - using existing endpoints
- **Frontend:** Improved UX, same performance
- **Storage:** Negligible increase

---

## Support

### For Issues:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check server logs for API errors
4. Verify all files are properly deployed
5. Contact development team with error messages

### For Feature Questions:
- Review QUICK-START-GUIDE.md
- See IMPLEMENTATION-SUMMARY-2025-12-29.md for technical details

---

## Files Reference

- Implementation Details: `IMPLEMENTATION-SUMMARY-2025-12-29.md`
- User Guide: `QUICK-START-GUIDE.md`
- This File: `DEPLOYMENT-INSTRUCTIONS.md`
