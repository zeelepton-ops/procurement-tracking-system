import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Add status column to MaterialRequestItem if it doesn't exist
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'MaterialRequestItem' 
          AND column_name = 'status'
        ) THEN
          ALTER TABLE "MaterialRequestItem" 
          ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';
          
          -- Copy status from MaterialRequest to all its items
          UPDATE "MaterialRequestItem" mri
          SET status = mr.status
          FROM "MaterialRequest" mr
          WHERE mri."materialRequestId" = mr.id;
        END IF;
      END $$;
    `)

    return NextResponse.json({ success: true, message: 'Migration completed' })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
