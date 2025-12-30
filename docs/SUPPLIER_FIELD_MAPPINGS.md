# Supplier Field Mappings - Complete Reference

## Database Schema vs Registration Form

### ✅ Correctly Mapped Fields

| Form Field | Database Field | Type | Notes |
|------------|---------------|------|-------|
| companyName | name | String | Primary identifier (unique) |
| tradingName | tradingName | String | Optional |
| email | email | String | Contact email |
| phone | phone | String | Contact phone |
| address | address | String | Full address |
| city | city | String | City name |
| state | state | String | State/Province |
| postalCode | postalCode | String | Postal/ZIP code |
| country | country | String | Default: Qatar |
| website | website | String | Company website |
| category | category | String | Business category |
| businessType | businessType | String | Type (Manufacturer/Distributor/etc) |
| yearEstablished | yearEstablished | Int | Year company founded |
| numberOfEmployees | numberOfEmployees | Int | Employee count |
| crNumber | crNumber | String | Commercial Registration number |
| crExpiry | crExpiry | DateTime | CR expiry date |
| taxIdNumber | taxId | String | Tax ID/number |
| taxIdExpiry | taxIdExpiry | DateTime | Tax ID expiry date |
| businessDescription | notes | String | Company description/notes |
| paymentTerms | paymentTerms | String | Payment terms (e.g., "Net 30") |
| leadTimeDays | leadTimeDays | Int | Lead time in days |
| minimumOrderValue | minimumOrderValue | Float | Minimum order value |
| currency | defaultCurrency | String | Default: QAR |

### 👤 Contact Information

| Form Field | Mapping | Notes |
|------------|---------|-------|
| contactName | contactPerson + contacts[0].name | Stored in both main table and contacts relation |
| contactTitle | contacts[0].role | Stored in SupplierContact relation |
| contactEmail | contacts[0].email | Primary contact email |
| contactPhone | contacts[0].phone | Primary contact phone |
| contactMobile | contacts[0].mobile | Mobile number |

### 🏦 Banking Information

| Form Field | Database Field | Table | Notes |
|------------|---------------|-------|-------|
| bankName | bankName | SupplierBankDetails | Related table |
| accountHolder | accountName | SupplierBankDetails | Account holder name |
| iban | iban | SupplierBankDetails | IBAN number |
| currency | currency | SupplierBankDetails | Bank account currency |

### 📄 Documents

| Form Field | Database Field | Notes |
|------------|---------------|-------|
| documents.cr | crDocumentUrl | CR document URL |
| documents.taxCard | taxCardUrl | Tax card document URL |
| documents.icv | icvUrl | ICV certificate URL |
| documents.bankDocument | - | Stored in SupplierDocument relation |

### 🔄 Audit Fields

| Field | Type | Populated By | Notes |
|-------|------|-------------|-------|
| createdBy | String | API (session.user.email/name) | User who created record |
| updatedBy | String | API (session.user.email/name) | Last user who updated record |
| createdAt | DateTime | Prisma @default(now()) | Creation timestamp |
| updatedAt | DateTime | Prisma @updatedAt | Last update timestamp |
| status | SupplierStatus | Default: PENDING | PENDING/APPROVED/REJECTED/SUSPENDED |

## API Mapping Logic

### POST /api/suppliers
```typescript
// Field mappings with fallbacks
name: body.name ?? body.companyName ?? body.tradingName
contactPerson: body.contactPerson ?? body.contactName ?? body.contact?.name
taxId: body.taxId ?? body.taxIdNumber
defaultCurrency: body.defaultCurrency ?? body.currency ?? 'QAR'
notes: body.notes ?? body.businessDescription
createdBy: session?.user?.email ?? session?.user?.name ?? 'System'

// Nested creates
contacts: body.contacts OR body.contact (legacy)
bankDetails: body.bankDetails (if provided)
capabilities: body.capabilities (if provided)
certifications: body.certifications (if provided)
```

### PATCH /api/suppliers/[id]
```typescript
// Adds updatedBy automatically
updatedBy: session?.user?.email ?? session?.user?.name ?? 'Unknown'
```

## Migration Files Required

Run these SQL files in Supabase SQL Editor:

1. **20251230_add_createdby_updatedby_supplier.sql**
   - Adds createdBy and updatedBy columns

2. **20251230_add_missing_supplier_fields.sql**
   - Adds state, postalCode
   - Adds numberOfEmployees
   - Adds crExpiry, taxIdExpiry
   - Adds minimumOrderValue

3. **Previous migrations** (if not already run):
   - sql/fix_supplier_columns.sql (for certification, reference, bank details columns)

## Field Not in Form (Auto-generated/System)

- id (cuid)
- rating (not collected in registration)
- isActive (default: true)
- preferred (default: false)
- tradeLicense (not in form but in schema)
- supplierPrices, supplierQuotes, enquiryResponses, notifications (relations)

## Display Mappings (Detail Page)

### Fields with Special Display Logic
- Contact Person: Falls back to `primaryContact?.name` if `contactPerson` is empty
- Description: Shows `notes` field
- Banking Details: Shows from `bankDetails` relation
- Additional Contacts: Shows from `contacts` relation array
- Documents: Shows from `documents` relation array

### Hidden Fields (Not shown on detail page)
- rating (not collected, removed from display)
- SWIFT (not collected, removed from display)
- preferred, isActive (internal flags)

## Summary

**Total Fields in Form:** 32
**Total Fields in Database:** 38 (including audit fields)
**Relations:** 6 (contacts, capabilities, certifications, documents, references, bankDetails)
**All fields properly mapped:** ✅ Yes
