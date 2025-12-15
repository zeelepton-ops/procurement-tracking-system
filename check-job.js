const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkJob() {
  const job = await prisma.jobOrder.findFirst({ 
    where: { jobNumber: '7549' } 
  });
  
  if (job) {
    console.log('Job 7549 found:');
    console.log('  ID:', job.id);
    console.log('  isDeleted:', job.isDeleted);
    console.log('  createdAt:', job.createdAt);
    console.log('  deletedAt:', job.deletedAt);
    console.log('  deletedBy:', job.deletedBy);
  } else {
    console.log('Job 7549 NOT found in database');
  }
  
  await prisma.$disconnect();
}

checkJob();
