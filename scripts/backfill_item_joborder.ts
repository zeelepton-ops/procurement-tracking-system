import { prisma } from '@/lib/prisma'

async function run() {
  console.log('Starting backfill of MaterialRequestItem.jobOrderId...')
  try {
    console.log('Step 1: copying parent MR.jobOrderId to items')
    const res1 = await prisma.$executeRawUnsafe(`
      UPDATE "MaterialRequestItem" mri
      SET "jobOrderId" = mr."jobOrderId"
      FROM "MaterialRequest" mr
      WHERE mri."jobOrderId" IS NULL
        AND mr.id = mri."materialRequestId"
        AND mr."jobOrderId" IS NOT NULL
    `)
    console.log('Step1 result:', res1)

    console.log('Step 2: extracting job numbers from reasonForRequest and mapping')
    const res2 = await prisma.$executeRawUnsafe(`
      UPDATE "MaterialRequestItem" mri
      SET "jobOrderId" = jo.id
      FROM "JobOrder" jo
      WHERE mri."jobOrderId" IS NULL
        AND mri."reasonForRequest" IS NOT NULL
        AND mri."reasonForRequest" ILIKE '%' || jo."jobNumber" || '%'
    `)
    console.log('Step2 result:', res2)

    const summary = await prisma.$queryRawUnsafe(`
      SELECT jo."jobNumber", COUNT(*) AS item_count
      FROM "MaterialRequestItem" mri
      JOIN "JobOrder" jo ON jo.id = mri."jobOrderId"
      GROUP BY jo."jobNumber"
      ORDER BY item_count DESC
      LIMIT 50
    `)
    console.log('Backfill summary (top 50):')
    console.table(summary)
  } catch (err) {
    console.error('Backfill failed:', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

run()