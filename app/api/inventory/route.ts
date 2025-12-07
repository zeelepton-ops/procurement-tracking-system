import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const inventory = await prisma.inventoryItem.findMany({
      orderBy: {
        itemName: 'asc'
      }
    })
    
    return NextResponse.json(inventory)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
