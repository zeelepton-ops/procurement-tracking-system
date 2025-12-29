const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } }
  })

  try {
    console.log('Connected to DB: %s', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0])

    // List tables in public schema
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
    console.log('\nPublic tables:')
    tables.forEach(t => console.log('- ' + t.table_name))

    const checks = [
      { name: 'User', fn: () => prisma.user.count() },
      { name: 'JobOrder', fn: () => prisma.jobOrder.count() },
      { name: 'MaterialRequest', fn: () => prisma.materialRequest.count() },
      { name: 'MaterialRequestItem', fn: () => prisma.materialRequestItem.count() },
      { name: 'InventoryItem', fn: () => prisma.inventoryItem.count() },
      { name: 'Supplier', fn: () => prisma.supplier.count() },
      { name: 'PurchaseOrder', fn: () => prisma.purchaseOrder.count() },
      { name: 'PurchaseOrderItem', fn: () => prisma.purchaseOrderItem.count() },
      { name: 'Asset', fn: () => prisma.asset.count() },
      { name: 'ProcurementAction', fn: () => prisma.procurementAction.count() }
    ]

    console.log('\nRow counts:')
    for (const c of checks) {
      try {
        const cnt = await c.fn()
        console.log(`${c.name}: ${cnt}`)
      } catch (err) {
        console.log(`${c.name}: ERROR - ${err.message}`)
      }
    }

    // Show up to 5 recent rows from JobOrder and MaterialRequest for quick inspection
    try {
      const jobs = await prisma.jobOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
      console.log('\nRecent Job Orders:')
      console.log(JSON.stringify(jobs, null, 2))
    } catch (err) {
      console.log('\nRecent Job Orders: ERROR -', err.message)
    }

    try {
      const mrs = await prisma.materialRequest.findMany({ orderBy: { requestedAt: 'desc' }, take: 5 })
      console.log('\nRecent Material Requests:')
      console.log(JSON.stringify(mrs, null, 2))
    } catch (err) {
      console.log('\nRecent Material Requests: ERROR -', err.message)
    }

  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('Inspect script failed:', e.message)
  process.exit(1)
})
