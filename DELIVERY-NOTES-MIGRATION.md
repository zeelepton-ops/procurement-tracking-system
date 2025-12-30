# Database Migration: DeliveryNote Tables

## Issue
The delivery notes feature was added to the codebase, but the database tables did not exist in the production environment (Vercel/Supabase), causing the following error:

```
Invalid `prisma.deliveryNote.findMany()` invocation:
The table `public.DeliveryNote` does not exist in the current database.
```

## Solution
A Prisma migration has been created and committed to add the DeliveryNote and DeliveryNoteItem tables.

## Files Changed
- **New Migration**: `prisma/migrations/20251231_add_delivery_note_tables/migration.sql`
- **Updated Form**: `app/store/delivery-notes/page.tsx` (previous commit)

## Migration Details

### Tables Created

#### DeliveryNote
- `id` (TEXT, Primary Key)
- `deliveryNoteNumber` (TEXT, UNIQUE)
- `date` (TIMESTAMP)
- `jobOrderId` (TEXT, Foreign Key to JobOrder, nullable)
- Client details: `client`, `country`, `division`, `department`, `fabrication`, `refPoNumber`, `jobSalesOrder`
- Shipment info: `shipmentTo`, `totalQuantity`, `totalWeight`, `comments`, `shipmentType`
- Personnel: `representativeName`, `representativeNo`, `qidNumber`
- Vehicle: `vehicleNumber`, `vehicleType`
- Status: `status` (DRAFT, ISSUED, DELIVERED), `issuedAt`, `deliveredAt`, `issuedBy`
- Audit: `createdBy`, `createdAt`, `updatedAt`

#### DeliveryNoteItem
- `id` (TEXT, Primary Key)
- `deliveryNoteId` (TEXT, Foreign Key to DeliveryNote with CASCADE delete)
- `itemDescription` (TEXT)
- `unit` (TEXT)
- `quantity` (DOUBLE PRECISION)
- `weight` (DOUBLE PRECISION, nullable)
- `remarks` (TEXT, nullable)
- Audit: `createdAt`, `updatedAt`

### Indexes Created
- `DeliveryNote_deliveryNoteNumber_key` (UNIQUE)
- `DeliveryNote_jobOrderId_idx`
- `DeliveryNote_status_idx`
- `DeliveryNoteItem_deliveryNoteId_idx`

### Foreign Keys
- DeliveryNote → JobOrder (jobOrderId, onDelete: SET NULL)
- DeliveryNoteItem → DeliveryNote (deliveryNoteId, onDelete: CASCADE)

## Deployment

### On Vercel/Supabase
The migration will automatically run when:
1. The git push is detected by Vercel
2. The build process triggers
3. Prisma migrations are applied before the Next.js build completes

**Status**: Pushed to main branch - automatic deployment in progress

### Manual Application (if needed)
If you need to manually run the migration on Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the SQL from `prisma/migrations/20251231_add_delivery_note_tables/migration.sql`
3. Run the SQL query
4. Verify tables are created

## Verification
After deployment, verify the tables exist:

```sql
SELECT * FROM "DeliveryNote" LIMIT 1;
SELECT * FROM "DeliveryNoteItem" LIMIT 1;
```

Both queries should return empty results but confirm the tables exist.

## Next Steps
Once the migration is applied:
1. The delivery notes feature will work without errors
2. Users can create delivery notes from `/store/delivery-notes`
3. Job orders will auto-populate client details
4. Delivery notes can be printed and viewed

## Related Commits
- `0f19557`: Add DeliveryNote and DeliveryNoteItem database tables migration
- `61daca9`: Enhance delivery notes form with job order auto-fill and field organization

## Rollback (if needed)
If you need to rollback, Prisma will handle the migration history. Contact your database administrator for Supabase to verify the rollback process.
