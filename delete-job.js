const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteJob() {
  const job = await prisma.jobOrder.update({
    where: { id: 'cmj5pbte500083fi1cbl3jagx' },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: 'admin@system'
    }
  });
  
  console.log('Job 7549 soft-deleted successfully');
  console.log('  isDeleted:', job.isDeleted);
  console.log('  deletedAt:', job.deletedAt);
  
  await prisma.$disconnect();
}

deleteJob();
