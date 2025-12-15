const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreate() {
  try {
    // First verify 7549 is deleted
    const check = await prisma.jobOrder.findFirst({
      where: { jobNumber: '7549' }
    });
    
    console.log('Job 7549 current state:', {
      exists: !!check,
      isDeleted: check?.isDeleted,
      id: check?.id
    });

    // Try to restore/create it
    if (check && check.isDeleted) {
      console.log('\nRestoring deleted job 7549...');
      const restored = await prisma.jobOrder.update({
        where: { id: check.id },
        data: {
          productName: 'Fabrication of Bollards Only',
          workScope: 'Fabrication of Bollards Only',
          isDeleted: false,
          deletedAt: null,
          deletedBy: null
        },
        include: { items: true }
      });
      
      console.log('✅ Successfully restored job 7549');
      console.log('   productName:', restored.productName);
      console.log('   isDeleted:', restored.isDeleted);
    } else {
      console.log('❌ Job 7549 not found or not deleted');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await prisma.$disconnect();
}

testCreate();
