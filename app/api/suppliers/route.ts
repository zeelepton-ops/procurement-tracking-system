import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const where = q
      ? { OR: [{ name: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }, { tradingName: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }] }
      : undefined

    try {
      const suppliers = await prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, include: { contacts: true, capabilities: true, supplierPrices: true } })
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
            const suppliers = await prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, include: { contacts: true, capabilities: true, supplierPrices: true } })
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
            const suppliers = await prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, include: { contacts: true, capabilities: true, supplierPrices: true } })
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

    try {
      const created = await prisma.supplier.create({
        data: {
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
          // create primary contact if provided
          contacts: body.contact ? { create: { name: body.contact.name, role: body.contact.role || 'Primary', email: body.contact.email || null, phone: body.contact.phone || null, isPrimary: true } } : undefined
        }
      })

      return NextResponse.json(created, { status: 201 })
    } catch (createErr: any) {
      // Handle missing SupplierContact table gracefully (P2021)
      const allowRuntimeFix = process.env.ALLOW_RUNTIME_SCHEMA_FIXES === 'true'
      if (allowRuntimeFix && createErr?.code === 'P2021' && createErr?.meta?.table) {
        const missingTable = String(createErr.meta.table)
        if (missingTable.includes('SupplierContact')) {
          console.warn('Detected missing table SupplierContact on create; attempting to create it then retry (runtime schema fix enabled)')
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
            const created = await prisma.supplier.create({
              data: {
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
                contacts: body.contact ? { create: { name: body.contact.name, role: body.contact.role || 'Primary', email: body.contact.email || null, phone: body.contact.phone || null, isPrimary: true } } : undefined
              }
            })
            return NextResponse.json(created, { status: 201 })
          } catch (retryErr) {
            console.error('Retry create supplier after auto-create table failed:', retryErr)
            return NextResponse.json({ error: (retryErr as any)?.message || String(retryErr) }, { status: 500 })
          }
        }

        if (missingTable.includes('SupplierCapability')) {
          console.warn('Detected missing table SupplierCapability on create; attempting to create it then retry (runtime schema fix enabled)')
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
            const created = await prisma.supplier.create({
              data: {
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
                contacts: body.contact ? { create: { name: body.contact.name, role: body.contact.role || 'Primary', email: body.contact.email || null, phone: body.contact.phone || null, isPrimary: true } } : undefined
              }
            })
            return NextResponse.json(created, { status: 201 })
          } catch (retryErr) {
            console.error('Retry create supplier after auto-create table failed:', retryErr)
            return NextResponse.json({ error: (retryErr as any)?.message || String(retryErr) }, { status: 500 })
          }
        }
      }
      // If runtime fixes are disabled, give a clear error suggesting migration
      if (!allowRuntimeFix && createErr?.code === 'P2021') {
        console.error('Supplier create failed due to missing SupplierContact table; run migration to create SupplierContact')
        return NextResponse.json({ error: 'Schema missing: SupplierContact table. Please apply the migration to create it.' }, { status: 500 })
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