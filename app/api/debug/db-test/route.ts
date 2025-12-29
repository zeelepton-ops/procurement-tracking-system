import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test 1: Basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    // Test 2: Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    // Test 3: Count JobOrder records
    const jobOrderCount = await prisma.jobOrder.count()
    
    // Test 4: Count MaterialRequest records
    const materialRequestCount = await prisma.materialRequest.count()
    
    // Test 5: Get sample JobOrder with items
    const sampleJobOrder = await prisma.jobOrder.findFirst({
      include: { items: true },
      where: { isDeleted: false }
    })
    
    // Test 6: Get sample MaterialRequest with items
    const sampleMaterialRequest = await prisma.materialRequest.findFirst({
      include: { items: true, jobOrder: true },
      where: { isDeleted: false }
    })
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      tables: tables,
      counts: {
        jobOrders: jobOrderCount,
        materialRequests: materialRequestCount
      },
      samples: {
        jobOrder: sampleJobOrder,
        materialRequest: sampleMaterialRequest
      }
    })
  } catch (error: any) {
    console.error('Database connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      meta: error.meta,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
