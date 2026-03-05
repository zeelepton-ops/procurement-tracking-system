import { prisma } from '@/lib/prisma'

type PrismaLikeError = {
  code?: string
}

let ensureInFlight: Promise<void> | null = null

const isMissingTableError = (error: unknown) => {
  const dbError = error as PrismaLikeError | undefined
  return dbError?.code === 'P2021'
}

const runEnsure = async () => {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "ManufacturingInventoryItem" (
      "id" TEXT NOT NULL,
      "batchNo" TEXT NOT NULL,
      "itemType" TEXT NOT NULL,
      "size" TEXT,
      "thickness" TEXT,
      "length" TEXT,
      "unit" TEXT NOT NULL,
      "grade" TEXT,
      "storageLocation" TEXT,
      "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "ManufacturingInventoryItem_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "ManufacturingInventoryItem_itemType_idx" ON "ManufacturingInventoryItem"("itemType");`,
    `CREATE INDEX IF NOT EXISTS "ManufacturingInventoryItem_storageLocation_idx" ON "ManufacturingInventoryItem"("storageLocation");`,
    `CREATE TABLE IF NOT EXISTS "ManufacturingDeliveryEntry" (
      "id" TEXT NOT NULL,
      "itemId" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "quantity" DOUBLE PRECISION NOT NULL,
      "unit" TEXT NOT NULL,
      "client" TEXT,
      "remarks" TEXT,
      "createdBy" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "ManufacturingDeliveryEntry_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "ManufacturingDeliveryEntry_date_idx" ON "ManufacturingDeliveryEntry"("date");`,
    `CREATE INDEX IF NOT EXISTS "ManufacturingDeliveryEntry_itemId_idx" ON "ManufacturingDeliveryEntry"("itemId");`,
    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ManufacturingDeliveryEntry_itemId_fkey'
          AND table_name = 'ManufacturingDeliveryEntry'
      ) THEN
        ALTER TABLE "ManufacturingDeliveryEntry"
          ADD CONSTRAINT "ManufacturingDeliveryEntry_itemId_fkey"
          FOREIGN KEY ("itemId") REFERENCES "ManufacturingInventoryItem"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;`,
    `CREATE TABLE IF NOT EXISTS "ManufacturingProductionEntry" (
      "id" TEXT NOT NULL,
      "itemId" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "quantity" DOUBLE PRECISION NOT NULL,
      "unit" TEXT NOT NULL,
      "remarks" TEXT,
      "createdBy" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "ManufacturingProductionEntry_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "ManufacturingProductionEntry_date_idx" ON "ManufacturingProductionEntry"("date");`,
    `CREATE INDEX IF NOT EXISTS "ManufacturingProductionEntry_itemId_idx" ON "ManufacturingProductionEntry"("itemId");`,
    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ManufacturingProductionEntry_itemId_fkey'
          AND table_name = 'ManufacturingProductionEntry'
      ) THEN
        ALTER TABLE "ManufacturingProductionEntry"
          ADD CONSTRAINT "ManufacturingProductionEntry_itemId_fkey"
          FOREIGN KEY ("itemId") REFERENCES "ManufacturingInventoryItem"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;`,
    `CREATE TABLE IF NOT EXISTS "ManufacturingStockUpdate" (
      "id" TEXT NOT NULL,
      "itemId" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "newStock" DOUBLE PRECISION NOT NULL,
      "adjustmentQty" DOUBLE PRECISION NOT NULL,
      "unit" TEXT NOT NULL,
      "remarks" TEXT,
      "createdBy" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "ManufacturingStockUpdate_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "ManufacturingStockUpdate_date_idx" ON "ManufacturingStockUpdate"("date");`,
    `CREATE INDEX IF NOT EXISTS "ManufacturingStockUpdate_itemId_idx" ON "ManufacturingStockUpdate"("itemId");`,
    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ManufacturingStockUpdate_itemId_fkey'
          AND table_name = 'ManufacturingStockUpdate'
      ) THEN
        ALTER TABLE "ManufacturingStockUpdate"
          ADD CONSTRAINT "ManufacturingStockUpdate_itemId_fkey"
          FOREIGN KEY ("itemId") REFERENCES "ManufacturingInventoryItem"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;`,
  ]

  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql)
  }
}

export const ensureManufacturingInventorySchema = async () => {
  if (!ensureInFlight) {
    ensureInFlight = runEnsure().finally(() => {
      ensureInFlight = null
    })
  }
  await ensureInFlight
}

export const withManufacturingInventorySchema = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error
    }

    await ensureManufacturingInventorySchema()
    return operation()
  }
}
