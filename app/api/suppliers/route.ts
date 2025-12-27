import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const status = searchParams.get('status')
    const where: any = {}
    if (q) {
      where.OR = [{ name: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }, { tradingName: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }]
    }
    if (status && status !== 'ALL') {
      where.status = status
    }
    const whereClause = Object.keys(where).length ? where : undefined

    try {
      const suppliers = await prisma.supplier.findMany({ where: whereClause, orderBy: { name: 'asc' }, include: { contacts: true, capabilities: true, supplierPrices: true } })
      return NextResponse.json(suppliers)
    } catch (innerErr: any) {
      // If the SupplierContact table is missing in the DB, we *may* attempt an idempotent CREATE TABLE to repair schema then retry once.
      // This behavior is gated behind ALLOW_RUNTIME_SCHEMA_FIXES and is disabled by default to avoid unexpected schema changes in production.
      const allowRuntimeFix = process.env.ALLOW_RUNTIME_SCHEMA_FIXES === 'true'
      if (allowRuntimeFix && innerErr?.code === 'P2021' && innerErr?.meta?.table) {
        const missingTable = String(innerErr.meta.table)
        // Handle SupplierContact missing table
        if (missingTable.includes('SupplierContact')) {
          console.warn('Detected missing table SupplierContact; attempting to create it via SQL (runtime schema fix enabled)')
          try {
            await prisma.$executeRaw`
              CREATE TABLE IF NOT EXISTS "SupplierContact" (
                "id" TEXT PRIMARY KEY,
                "supplierId" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "role" TEXT,
                "email" TEXT,
                "phone" TEXT,
                "isPrimary" BOOLEAN NOT NULL DEFAULT false,
                "notes" TEXT,
                "createdAt" TIMESTAMP(3) DEFAULT now()
              )`
            await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SupplierContact_supplierId_idx" ON "SupplierContact"("supplierId")`
            // Add FK if not exists
            await prisma.$executeRaw`
              DO $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_constraint c
                  JOIN pg_class t ON c.conrelid = t.oid
                  WHERE t.relname = 'SupplierContact' AND c.conname = 'SupplierContact_supplierId_fkey'
                ) THEN
                  ALTER TABLE "SupplierContact" ADD CONSTRAINT "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
                END IF;
              END$$;`
            const suppliers = await prisma.supplier.findMany({ where: whereClause, orderBy: { name: 'asc' }, include: { contacts: true, capabilities: true, supplierPrices: true } })
            return NextResponse.json(suppliers)
          } catch (createErr) {
            console.error('Failed to auto-create SupplierContact table:', createErr)
            throw createErr
          }
        }

        // Handle SupplierCapability missing table
        if (missingTable.includes('SupplierCapability')) {
          console.warn('Detected missing table SupplierCapability; attempting to create it via SQL (runtime schema fix enabled)')
          try {
            await prisma.$executeRaw`
              CREATE TABLE IF NOT EXISTS "SupplierCapability" (
                "id" TEXT PRIMARY KEY,
                "supplierId" TEXT NOT NULL,
                "category" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "details" TEXT,
                "capacity" TEXT,
                "createdAt" TIMESTAMP(3) DEFAULT now()
              )`
            await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SupplierCapability_supplierId_idx" ON "SupplierCapability"("supplierId")`
            await prisma.$executeRaw`
              DO $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_constraint c
                  JOIN pg_class t ON c.conrelid = t.oid
                  WHERE t.relname = 'SupplierCapability' AND c.conname = 'SupplierCapability_supplierId_fkey'
                ) THEN
                  ALTER TABLE "SupplierCapability" ADD CONSTRAINT "SupplierCapability_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
                END IF;
              END$$;`
            const suppliers = await prisma.supplier.findMany({ where: whereClause, orderBy: { name: 'asc' }, include: { contacts: true, capabilities: true, supplierPrices: true } })
            return NextResponse.json(suppliers)
          } catch (createErr) {
            console.error('Failed to auto-create SupplierCapability table:', createErr)
            throw createErr
          }
        }
      }
      // If runtime fixes are not allowed, rethrow the original error so it surfaces clearly (and can be fixed via migrations).
      throw innerErr
    }
  } catch (err: any) {
    console.error('Failed to list suppliers', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Minimal validation
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    // Build nested create payload
    const supplierData: any = {
      name: body.name,
      tradingName: body.tradingName || null,
      contactPerson: body.contactPerson || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      website: body.website || null,
      paymentTerms: body.paymentTerms || null,
      leadTimeDays: body.leadTimeDays ?? null,
      defaultCurrency: body.defaultCurrency || 'QAR',
      taxId: body.taxId || null,
      tradeLicense: body.tradeLicense || null,
      notes: body.notes || null,
      status: body.status || undefined
    }

    // Optional nested creates
    if (Array.isArray(body.contacts) && body.contacts.length > 0) {
      supplierData.contacts = { create: body.contacts.map((c: any) => ({ name: c.name, role: c.role || null, email: c.email || null, phone: c.phone || null, isPrimary: !!c.isPrimary, notes: c.notes || null })) }
    } else if (body.contact) {
      // legacy single contact field
      supplierData.contacts = { create: [{ name: body.contact.name, role: body.contact.role || 'Primary', email: body.contact.email || null, phone: body.contact.phone || null, isPrimary: true }] }
    }

    if (Array.isArray(body.capabilities) && body.capabilities.length > 0) {
      supplierData.capabilities = { create: body.capabilities.map((c: any) => ({ category: c.category || 'SERVICE', name: c.name, details: c.details || null, capacity: c.capacity || null })) }
    }

    if (Array.isArray(body.certifications) && body.certifications.length > 0) {
      supplierData.certifications = { create: body.certifications.map((c: any) => ({ name: c.name, certNumber: c.certNumber || null, issuedBy: c.issuedBy || null, validFrom: c.validFrom ?? null, validTo: c.validTo ?? null, documentId: c.documentId || null })) }
    }

    if (Array.isArray(body.prices) && body.prices.length > 0) {
      supplierData.supplierPrices = { create: body.prices.map((p: any) => ({ itemKey: p.itemKey, unitPrice: Number(p.unitPrice) || 0, currency: p.currency || 'QAR', effectiveFrom: p.effectiveFrom ?? null })) }
    } else if (body.price) {
      supplierData.supplierPrices = { create: [{ itemKey: body.price.itemKey || 'UNKNOWN', unitPrice: Number(body.price.unitPrice) || 0, currency: body.price.currency || 'QAR', effectiveFrom: body.price.effectiveFrom ?? null }] }
    }

    try {
      const created = await prisma.supplier.create({ data: supplierData, include: { contacts: true, capabilities: true, certifications: true, supplierPrices: true } })
      return NextResponse.json(created, { status: 201 })
    } catch (createErr: any) {
      // existing runtime-fix handlers for missing tables (P2021) — attempt same logic as before for tables that may be missing
      const allowRuntimeFix = process.env.ALLOW_RUNTIME_SCHEMA_FIXES === 'true'
      if (allowRuntimeFix && createErr?.code === 'P2021' && createErr?.meta?.table) {
        const missingTable = String(createErr.meta.table)
        console.warn('Detected missing table on create:', missingTable)
        // Try creating common supplier-related tables if they're missing, then retry once
        try {
          if (missingTable.includes('SupplierContact')) {
            await prisma.$executeRaw`
              CREATE TABLE IF NOT EXISTS "SupplierContact" (
                "id" TEXT PRIMARY KEY,
                "supplierId" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "role" TEXT,
                "email" TEXT,
                "phone" TEXT,
                "isPrimary" BOOLEAN NOT NULL DEFAULT false,
                "notes" TEXT,
                "createdAt" TIMESTAMP(3) DEFAULT now()
              )`
            await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SupplierContact_supplierId_idx" ON "SupplierContact"("supplierId")`
            await prisma.$executeRaw`
              DO $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_constraint c
                  JOIN pg_class t ON c.conrelid = t.oid
                  WHERE t.relname = 'SupplierContact' AND c.conname = 'SupplierContact_supplierId_fkey'
                ) THEN
                  ALTER TABLE "SupplierContact" ADD CONSTRAINT "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
                END IF;
              END$$;`
          }

          if (missingTable.includes('SupplierCapability')) {
            await prisma.$executeRaw`
              CREATE TABLE IF NOT EXISTS "SupplierCapability" (
                "id" TEXT PRIMARY KEY,
                "supplierId" TEXT NOT NULL,
                "category" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "details" TEXT,
                "capacity" TEXT,
                "createdAt" TIMESTAMP(3) DEFAULT now()
              )`
            await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SupplierCapability_supplierId_idx" ON "SupplierCapability"("supplierId")`
            await prisma.$executeRaw`
              DO $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_constraint c
                  JOIN pg_class t ON c.conrelid = t.oid
                  WHERE t.relname = 'SupplierCapability' AND c.conname = 'SupplierCapability_supplierId_fkey'
                ) THEN
                  ALTER TABLE "SupplierCapability" ADD CONSTRAINT "SupplierCapability_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
                END IF;
              END$$;`
          }

          if (missingTable.includes('SupplierCertification')) {
            await prisma.$executeRaw`
              CREATE TABLE IF NOT EXISTS "SupplierCertification" (
                "id" TEXT PRIMARY KEY,
                "supplierId" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "certNumber" TEXT,
                "issuedBy" TEXT,
                "validFrom" TIMESTAMP(3),
                "validTo" TIMESTAMP(3),
                "documentId" TEXT,
                "createdAt" TIMESTAMP(3) DEFAULT now()
              )`
            await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SupplierCertification_supplierId_idx" ON "SupplierCertification"("supplierId")`
            await prisma.$executeRaw`
              DO $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_constraint c
                  JOIN pg_class t ON c.conrelid = t.oid
                  WHERE t.relname = 'SupplierCertification' AND c.conname = 'SupplierCertification_supplierId_fkey'
                ) THEN
                  ALTER TABLE "SupplierCertification" ADD CONSTRAINT "SupplierCertification_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
                END IF;
              END$$;`
          }

          if (missingTable.includes('SupplierPrice')) {
            await prisma.$executeRaw`
              CREATE TABLE IF NOT EXISTS "SupplierPrice" (
                "id" TEXT PRIMARY KEY,
                "supplierId" TEXT NOT NULL,
                "itemKey" TEXT,
                "unitPrice" DOUBLE PRECISION,
                "currency" TEXT DEFAULT 'QAR',
                "effectiveFrom" TIMESTAMP(3),
                "createdAt" TIMESTAMP(3) DEFAULT now()
              )`
            await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SupplierPrice_supplierId_idx" ON "SupplierPrice"("supplierId")`
            await prisma.$executeRaw`
              DO $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_constraint c
                  JOIN pg_class t ON c.conrelid = t.oid
                  WHERE t.relname = 'SupplierPrice' AND c.conname = 'SupplierPrice_supplierId_fkey'
                ) THEN
                  ALTER TABLE "SupplierPrice" ADD CONSTRAINT "SupplierPrice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id);
                END IF;
              END$$;`
          }

          // Retry once
          const created = await prisma.supplier.create({ data: supplierData, include: { contacts: true, capabilities: true, certifications: true, supplierPrices: true } })
          return NextResponse.json(created, { status: 201 })
        } catch (retryErr) {
          console.error('Retry create supplier after auto-create table failed:', retryErr)
          return NextResponse.json({ error: (retryErr as any)?.message || String(retryErr) }, { status: 500 })
        }
      }

      // If runtime fixes are disabled, give a clear error suggesting migration
      if (!allowRuntimeFix && createErr?.code === 'P2021') {
        console.error('Supplier create failed due to missing tables; run migration to create required tables')
        return NextResponse.json({ error: 'Schema missing: supplier related table. Please apply the migration to create it.' }, { status: 500 })
      }
      console.error('Failed to create supplier', createErr)
      return NextResponse.json({ error: (createErr as any)?.message || String(createErr) }, { status: 500 })
    }
  } catch (err: any) {
    console.error('Failed to create supplier', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const updated = await prisma.supplier.update({ where: { id: body.id }, data: body })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('Failed to update supplier', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.supplier.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err: any) {
    console.error('Failed to delete supplier', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}