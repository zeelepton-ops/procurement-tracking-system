import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const materialRequestId = params.id

    // Verify the material request exists
    const materialRequest = await prisma.materialRequest.findUnique({
      where: { id: materialRequestId }
    })

    if (!materialRequest) {
      return NextResponse.json({ error: 'Material request not found' }, { status: 404 })
    }

    // Get the item to verify it belongs to this request
    const item = await prisma.materialRequestItem.findUnique({
      where: { id: itemId }
    })

    if (!item || item.materialRequestId !== materialRequestId) {
      return NextResponse.json({ error: 'Item not found or does not belong to this request' }, { status: 404 })
    }

    // Soft delete the individual item
    await prisma.materialRequestItem.update({
      where: { id: itemId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: session.user.email
      }
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Failed to delete material request item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
