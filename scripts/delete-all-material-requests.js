const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deleteAllMaterialRequests() {
  try {
    console.log('🗑️  Starting deletion of all Material Requests...\n')

    // Count existing records
    const materialRequestCount = await prisma.materialRequest.count()
    const itemCount = await prisma.materialRequestItem.count()
    const actionCount = await prisma.procurementAction.count()
    const editHistoryCount = await prisma.materialRequestEditHistory.count()
    const statusHistoryCount = await prisma.statusHistory.count()
    
    // Count Purchase Order Items linked to Material Requests
    const allPoItems = await prisma.purchaseOrderItem.findMany({
      select: { id: true, materialRequestId: true }
    })
    const poItemCount = allPoItems.filter(item => item.materialRequestId !== null).length

    console.log('📊 Current counts:')
    console.log(`   - Material Requests: ${materialRequestCount}`)
    console.log(`   - Material Request Items: ${itemCount}`)
    console.log(`   - Procurement Actions: ${actionCount}`)
    console.log(`   - Edit History: ${editHistoryCount}`)
    console.log(`   - Status History: ${statusHistoryCount}`)
    console.log(`   - Purchase Order Items (linked): ${poItemCount}`)
    console.log('')

    if (materialRequestCount === 0) {
      console.log('✅ No Material Requests found. Nothing to delete.')
      return
    }

    // Prompt for confirmation
    console.log('⚠️  WARNING: This will permanently delete ALL Material Requests and related data!')
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
    await new Promise(resolve => setTimeout(resolve, 5000))

    console.log('🔄 Deleting related records...\n')

    // Delete in proper order due to foreign key constraints
    // 1. Delete Purchase Order Items that reference Material Requests
    if (poItemCount > 0) {
      const poDeleted = await prisma.purchaseOrderItem.updateMany({
        where: { 
          materialRequestId: { not: null }
        },
        data: {
          materialRequestId: null
        }
      })
      console.log(`   ✓ Unlinked ${poDeleted.count} Purchase Order Items from Material Requests`)
    }

    // 2. Delete Status History
    if (statusHistoryCount > 0) {
      const statusDeleted = await prisma.statusHistory.deleteMany()
      console.log(`   ✓ Deleted ${statusDeleted.count} Status History records`)
    }

    // 3. Delete Procurement Actions
    if (actionCount > 0) {
      const actionsDeleted = await prisma.procurementAction.deleteMany()
      console.log(`   ✓ Deleted ${actionsDeleted.count} Procurement Actions`)
    }

    // 4. Delete Edit History
    if (editHistoryCount > 0) {
      const editHistoryDeleted = await prisma.materialRequestEditHistory.deleteMany()
      console.log(`   ✓ Deleted ${editHistoryDeleted.count} Edit History records`)
    }

    // 5. Delete Material Request Items (cascade should handle this, but being explicit)
    if (itemCount > 0) {
      const itemsDeleted = await prisma.materialRequestItem.deleteMany()
      console.log(`   ✓ Deleted ${itemsDeleted.count} Material Request Items`)
    }

    // 6. Finally, delete all Material Requests
    const requestsDeleted = await prisma.materialRequest.deleteMany()
    console.log(`   ✓ Deleted ${requestsDeleted.count} Material Requests`)

    console.log('\n✅ Successfully deleted all Material Requests and related data!')
    console.log('\n📊 Final verification:')
    
    const finalCount = await prisma.materialRequest.count()
    const finalItemCount = await prisma.materialRequestItem.count()
    
    console.log(`   - Material Requests remaining: ${finalCount}`)
    console.log(`   - Material Request Items remaining: ${finalItemCount}`)

    if (finalCount === 0 && finalItemCount === 0) {
      console.log('\n✅ All Material Requests successfully deleted!')
    } else {
      console.log('\n⚠️  Warning: Some records may still remain. Please check manually.')
    }

  } catch (error) {
    console.error('❌ Error deleting Material Requests:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllMaterialRequests()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
