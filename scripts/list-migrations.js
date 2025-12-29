const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })
  try {
    const rows = await prisma.$queryRaw`SELECT id, migration_name, finished_at FROM public._prisma_migrations ORDER BY finished_at`;
    console.log('Applied migrations:')
    for (const r of rows) {
      console.log(`- ${r.migration_name}  (finished_at: ${r.finished_at})`)
    }
  } catch (err) {
    console.error('Error querying _prisma_migrations:', err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()