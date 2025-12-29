const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default admin user
  const adminEmail = 'info@nbtcqatar.com'
  const adminPassword = 'Admin@123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'System Admin',
      hashedPassword,
      role: 'ADMIN'
    }
  })

  console.log('✅ Created admin user (info@nbtcqatar.com / Admin@123)')

  // Clear existing data to avoid duplicates
  await prisma.materialReceipt.deleteMany()
  await prisma.purchaseOrderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.procurementAction.deleteMany()
  await prisma.statusHistory.deleteMany()
  await prisma.materialRequest.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.jobOrder.deleteMany()

  // Create Job Orders
  const jobOrder1 = await prisma.jobOrder.create({
    data: {
      jobNumber: 'JO-2024-001',
      productName: 'Steel Tank - 5000L',
      drawingRef: 'DWG-ST-5000-001',
      contactPerson: 'NBTC Contact',
      phone: '+974 4411 2233',
      clientContactPerson: 'Client Rep A',
      clientContactPhone: '+974 5555 1111'
    }
  })

  const jobOrder2 = await prisma.jobOrder.create({
    data: {
      jobNumber: 'JO-2024-002',
      productName: 'Steel Frame Structure',
      drawingRef: 'DWG-SFS-2024-002',
      contactPerson: 'NBTC Contact',
      phone: '+974 4411 2244',
      clientContactPerson: 'Client Rep B',
      clientContactPhone: '+974 5555 2222'
    }
  })

  const jobOrder3 = await prisma.jobOrder.create({
    data: {
      jobNumber: 'JO-2024-003',
      productName: 'Pressure Vessel',
      drawingRef: 'DWG-PV-2024-003',
      contactPerson: 'NBTC Contact',
      phone: '+974 4411 2255',
      clientContactPerson: 'Client Rep C',
      clientContactPhone: '+974 5555 3333'
    }
  })

  console.log('✅ Created job orders')

  // Create Inventory Items
  await prisma.inventoryItem.createMany({
    data: [
      {
        itemName: 'Steel Plate - Grade A36',
        description: '10mm thickness steel plate',
        currentStock: 500,
        unit: 'KG',
        minimumStock: 200,
        location: 'Warehouse A'
      },
      {
        itemName: 'Welding Electrodes E7018',
        description: '3.2mm welding rods',
        currentStock: 50,
        unit: 'KG',
        minimumStock: 20,
        location: 'Tool Store'
      },
      {
        itemName: 'Steel Angle 50x50x5',
        description: 'L-shaped steel angle',
        currentStock: 150,
        unit: 'METER',
        minimumStock: 50,
        location: 'Warehouse B'
      }
    ]
  })

  console.log('✅ Created inventory items')

  // Create Suppliers
  await prisma.supplier.createMany({
    data: [
      {
        name: 'Premium Steel Co.',
        contactPerson: 'John Smith',
        email: 'john@premiumsteel.com',
        phone: '+1-555-0101',
        address: '123 Industrial Ave',
        rating: 4.5
      },
      {
        name: 'Global Metals Ltd.',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@globalmetals.com',
        phone: '+1-555-0202',
        address: '456 Commerce Blvd',
        rating: 4.2
      },
      {
        name: 'Industrial Supplies Inc.',
        contactPerson: 'Mike Chen',
        email: 'mike@indsupplies.com',
        phone: '+1-555-0303',
        address: '789 Factory Road',
        rating: 4.8
      }
    ]
  })

  console.log('✅ Created suppliers')

  // Create Material Requests
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  
  const twoWeeks = new Date()
  twoWeeks.setDate(twoWeeks.getDate() + 14)

  const mr1 = await prisma.materialRequest.create({
    data: {
      requestNumber: 'MR-2024-0001',
      jobOrderId: jobOrder1.id,
      materialType: 'RAW_MATERIAL',
      itemName: 'Steel Plate - Grade A36',
      description: '10mm thickness, 2000x1000mm sheets',
      quantity: 300,
      unit: 'KG',
      reasonForRequest: 'Tank bottom and side plates fabrication',
      requiredDate: tomorrow,
      preferredSupplier: 'Premium Steel Co.',
      stockQtyInInventory: 500,
      urgencyLevel: 'CRITICAL',
      status: 'PENDING',
      requestedBy: 'Production Team - John Doe'
    }
  })

  const mr2 = await prisma.materialRequest.create({
    data: {
      requestNumber: 'MR-2024-0002',
      jobOrderId: jobOrder1.id,
      materialType: 'CONSUMABLE',
      itemName: 'Welding Electrodes E7018',
      description: '3.2mm diameter, AWS A5.1 certified',
      quantity: 25,
      unit: 'KG',
      reasonForRequest: 'Tank welding operations',
      requiredDate: nextWeek,
      preferredSupplier: 'Industrial Supplies Inc.',
      stockQtyInInventory: 50,
      urgencyLevel: 'HIGH',
      status: 'IN_PROCUREMENT',
      requestedBy: 'Production Team - Jane Smith'
    }
  })

  const mr3 = await prisma.materialRequest.create({
    data: {
      requestNumber: 'MR-2024-0003',
      jobOrderId: jobOrder2.id,
      materialType: 'RAW_MATERIAL',
      itemName: 'Steel Angle 50x50x5',
      description: 'Hot rolled steel angle, 6m lengths',
      quantity: 120,
      unit: 'METER',
      reasonForRequest: 'Frame structure corner supports',
      requiredDate: nextWeek,
      preferredSupplier: 'Global Metals Ltd.',
      stockQtyInInventory: 150,
      urgencyLevel: 'NORMAL',
      status: 'ORDERED',
      requestedBy: 'Production Team - Mike Wilson'
    }
  })

  const mr4 = await prisma.materialRequest.create({
    data: {
      requestNumber: 'MR-2024-0004',
      jobOrderId: jobOrder3.id,
      materialType: 'RAW_MATERIAL',
      itemName: 'Steel Plate - Grade SA516-70',
      description: '15mm thickness pressure vessel quality',
      quantity: 450,
      unit: 'KG',
      reasonForRequest: 'Pressure vessel shell fabrication',
      requiredDate: twoWeeks,
      preferredSupplier: 'Premium Steel Co.',
      stockQtyInInventory: 0,
      urgencyLevel: 'HIGH',
      status: 'IN_PROCUREMENT',
      requestedBy: 'Production Team - Sarah Lee'
    }
  })

  console.log('✅ Created material requests')

  // Create Status History
  await prisma.statusHistory.createMany({
    data: [
      {
        materialRequestId: mr1.id,
        oldStatus: '',
        newStatus: 'PENDING',
        changedBy: 'Production Team - John Doe',
        notes: 'Material request created'
      },
      {
        materialRequestId: mr2.id,
        oldStatus: '',
        newStatus: 'PENDING',
        changedBy: 'Production Team - Jane Smith',
        notes: 'Material request created'
      },
      {
        materialRequestId: mr2.id,
        oldStatus: 'PENDING',
        newStatus: 'IN_PROCUREMENT',
        changedBy: 'Procurement Team',
        notes: 'Assigned to procurement team'
      },
      {
        materialRequestId: mr3.id,
        oldStatus: '',
        newStatus: 'PENDING',
        changedBy: 'Production Team - Mike Wilson',
        notes: 'Material request created'
      },
      {
        materialRequestId: mr3.id,
        oldStatus: 'PENDING',
        newStatus: 'IN_PROCUREMENT',
        changedBy: 'Procurement Team',
        notes: 'Quotations requested'
      },
      {
        materialRequestId: mr3.id,
        oldStatus: 'IN_PROCUREMENT',
        newStatus: 'ORDERED',
        changedBy: 'Procurement Team',
        notes: 'Purchase order created'
      }
    ]
  })

  console.log('✅ Created status history')

  // Create Procurement Actions
  await prisma.procurementAction.createMany({
    data: [
      {
        materialRequestId: mr2.id,
        actionType: 'ASSIGNED',
        actionBy: 'Procurement Manager',
        notes: 'Assigned to procurement team for processing',
        actionDate: new Date()
      },
      {
        materialRequestId: mr2.id,
        actionType: 'QUOTATION_REQUESTED',
        actionBy: 'Procurement Officer - Alice',
        notes: 'Requested quotations from 3 suppliers',
        actionDate: new Date()
      },
      {
        materialRequestId: mr3.id,
        actionType: 'QUOTATION_RECEIVED',
        actionBy: 'Procurement Officer - Bob',
        notes: 'Quotation received and approved',
        quotationAmount: 1250.50,
        supplierName: 'Global Metals Ltd.',
        actionDate: new Date()
      },
      {
        materialRequestId: mr3.id,
        actionType: 'PO_CREATED',
        actionBy: 'Procurement Manager',
        notes: 'Purchase order PO-2024-101 created',
        actionDate: new Date()
      },
      {
        materialRequestId: mr4.id,
        actionType: 'ASSIGNED',
        actionBy: 'Procurement Manager',
        notes: 'High priority - requesting quotes urgently',
        actionDate: new Date()
      }
    ]
  })

  console.log('✅ Created procurement actions')

  // Create Purchase Order
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2024-101',
      supplierName: 'Global Metals Ltd.',
      supplierContact: 'sarah@globalmetals.com',
      orderDate: new Date(),
      expectedDelivery: nextWeek,
      status: 'SENT',
      createdBy: 'Procurement Manager'
    }
  })

  const poItem1 = await prisma.purchaseOrderItem.create({
    data: {
      purchaseOrderId: po1.id,
      materialRequestId: mr3.id,
      orderedQuantity: 120,
      receivedQuantity: 0,
      unitPrice: 10.42,
      totalPrice: 1250.50,
      deliveryStatus: 'PENDING'
    }
  })

  console.log('✅ Created purchase orders')

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
