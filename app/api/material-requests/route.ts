import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canEditOrDelete } from '@/lib/permissions'
import { randomUUID } from 'crypto'

// Force Prisma Client regeneration on Vercel build
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const summary = searchParams.get('summary')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
    const skip = Math.max(0, (page - 1) * pageSize)

    // Lightweight summary mode for faster list loading
    if (summary) {
      const requests = await prisma.materialRequest.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          requestNumber: true,
          itemName: true,
          description: true,
          quantity: true,
          unit: true,
          stockQtyInInventory: true,
          requiredDate: true,
          urgencyLevel: true,
          status: true,
          jobOrder: { select: { jobNumber: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      })
      return NextResponse.json(requests)
    }

    // Full payload with items
    const requests = await prisma.materialRequest.findMany({
      where: {
        isDeleted: false
      },
      include: {
        jobOrder: true,
        items: true,
        procurementActions: {
          orderBy: { actionDate: 'desc' },
          take: 1
        },
        purchaseOrderItems: {
          include: {
            purchaseOrder: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Ensure all records have a status field (fallback to PENDING if missing)
    const safeRequests = requests.map((req: any) => ({
      ...req,
      status: req.status || 'PENDING'
    }))
    
    return NextResponse.json(safeRequests)
  } catch (error) {
    console.error('Failed to fetch material requests:', error)
    // Return empty array instead of error object to prevent frontend filter errors
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
      const rawBody = await request.json()
    console.log('POST /api/material-requests - Received body:', JSON.stringify(rawBody, null, 2))

    // Log database connection info to help debug schema mismatches in production
    try {
      const conn = await prisma.$queryRaw`SELECT current_database() AS db, current_user AS user, inet_server_addr() AS server, current_setting('search_path') AS search_path`
      console.info('DB connection info:', JSON.stringify(conn))
    } catch (connErr) {
      console.warn('Failed to fetch DB connection info:', connErr)
    }

    // Basic validation & sanitization
    const body = {
      requestContext: rawBody.requestContext || 'WORKSHOP',
      jobOrderId: rawBody.jobOrderId || null,
      assetId: rawBody.assetId || null,
      materialType: rawBody.materialType || 'RAW_MATERIAL',
      itemName: rawBody.itemName,
      description: rawBody.description,
      quantity: rawBody.quantity,
      unit: rawBody.unit,
      reasonForRequest: rawBody.reasonForRequest,
      requiredDate: rawBody.requiredDate,
      preferredSupplier: rawBody.preferredSupplier,
      stockQtyInInventory: rawBody.stockQtyInInventory,
      urgencyLevel: rawBody.urgencyLevel || 'NORMAL',
      requestedBy: rawBody.requestedBy || (session?.user?.email ?? 'system'),
      items: Array.isArray(rawBody.items) ? rawBody.items : []
    }

    // Generate request number
    const count = await prisma.materialRequest.count()
    const requestNumber = `MR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

    // Use first item as primary or fallback to legacy fields
    const firstItem = body.items.length > 0 ? body.items[0] : null

    // Use first item's required date or fallback to legacy field or default to 7 days from now
    const requiredDate = firstItem?.requiredDate
      ? new Date(firstItem.requiredDate)
      : body.requiredDate
        ? new Date(body.requiredDate)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    console.log('Creating material request with:', {
      requestNumber,
      jobOrderId: body.jobOrderId,
      hasItems: !!firstItem,
      itemCount: body.items.length,
      requiredDate
    })

    // Sanitize numeric fields and ensure fallbacks
    const mainQuantity = firstItem ? (Number(firstItem.quantity) || 0) : (Number(body.quantity) || 1)
    const mainStockQty = firstItem ? (Number(firstItem.stockQty) || 0) : (Number(body.stockQtyInInventory) || 0)

    // Map items safely
    const itemsCreate = body.items.length > 0 ? body.items.map((item: any) => ({
      itemName: item.itemName || 'Unnamed Item',
      description: item.description || null,
      quantity: Number(item.quantity) || 0,
      unit: item.unit || 'PCS',
      stockQtyInInventory: Number(item.stockQty) || 0,
      reasonForRequest: item.reasonForRequest || null,
      urgencyLevel: item.urgencyLevel || 'NORMAL',
      requiredDate: item.requiredDate ? new Date(item.requiredDate) : null,
      preferredSupplier: item.preferredSupplier || null,
      inventoryItemId: item.inventoryItemId || null
    })) : undefined

    // Ensure we always provide an id to avoid DB-side missing defaults
    const explicitId = randomUUID()

    let materialRequest: any
    try {
      materialRequest = await prisma.materialRequest.create({
        data: {
              id: explicitId,
          requestNumber,
          requestContext: body.requestContext,
          jobOrderId: body.jobOrderId || null,
          assetId: body.assetId || null,
          materialType: body.materialType,
          itemName: firstItem?.itemName || body.itemName || 'Multiple Items',
          description: firstItem?.description || body.description || 'See items list',
          quantity: mainQuantity,
          unit: firstItem?.unit || body.unit || 'PCS',
          reasonForRequest: firstItem?.reasonForRequest || body.reasonForRequest || 'As required',
          requiredDate,
          preferredSupplier: firstItem?.preferredSupplier || body.preferredSupplier || null,
          stockQtyInInventory: mainStockQty,
          urgencyLevel: firstItem?.urgencyLevel || body.urgencyLevel || 'NORMAL',
          requestedBy: body.requestedBy,
          createdBy: session?.user?.email || body.requestedBy,
          items: itemsCreate ? { create: itemsCreate } : undefined
        },
        include: {
          jobOrder: true,
          asset: true,
          items: true
        }
      })
    } catch (err: any) {
      // Handle missing-column schema errors by attempting an additive migration
      if (err?.code === 'P2022' && err?.meta?.column) {
        const missingCol = String(err.meta.column)
        console.warn(`Detected missing column ${missingCol} in MaterialRequest; attempting to add it`)
        try {
          if (missingCol === 'requestContext') {
            await prisma.$executeRaw`ALTER TABLE "MaterialRequest" ADD COLUMN IF NOT EXISTS "requestContext" TEXT NOT NULL DEFAULT 'JOB_ORDER'`
            await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Material Request_requestContext_idx" ON "MaterialRequest"("requestContext")`
          }
          if (missingCol === 'assetId') {
            await prisma.$executeRaw`ALTER TABLE "MaterialRequest" ADD COLUMN IF NOT EXISTS "assetId" TEXT`;
            // Note: foreign key to Asset is not added here to avoid failures if Asset table is missing; run full migration in DB later
          }
          if (missingCol === 'status') {
            // Add status column with default matching Prisma schema
            await prisma.$executeRaw`ALTER TABLE "MaterialRequest" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING'`
            await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Material Request_status_idx" ON "MaterialRequest"("status")`
          }
          // Retry create once
          materialRequest = await prisma.materialRequest.create({
            data: {
              id: explicitId,
              requestNumber,
              requestContext: body.requestContext,
              jobOrderId: body.jobOrderId || null,
              assetId: body.assetId || null,
              materialType: body.materialType,
              itemName: firstItem?.itemName || body.itemName || 'Multiple Items',
              description: firstItem?.description || body.description || 'See items list',
              quantity: mainQuantity,
              unit: firstItem?.unit || body.unit || 'PCS',
              reasonForRequest: firstItem?.reasonForRequest || body.reasonForRequest || 'As required',
              requiredDate,
              preferredSupplier: firstItem?.preferredSupplier || body.preferredSupplier || null,
              stockQtyInInventory: mainStockQty,
              urgencyLevel: firstItem?.urgencyLevel || body.urgencyLevel || 'NORMAL',
              requestedBy: body.requestedBy,
              createdBy: session?.user?.email || body.requestedBy,
              items: itemsCreate ? { create: itemsCreate } : undefined
            },
            include: {
              jobOrder: true,
              asset: true,
              items: true
            }
          })
        } catch (innerErr) {
          console.error('Automatic schema fix failed:', innerErr)
          // If automatic ALTER fails for status, try to create without sending the status property (DB default will apply)
          if (missingCol === 'status') {
            try {
              materialRequest = await prisma.materialRequest.create({
                data: {
                  requestNumber,
                  requestContext: body.requestContext,
                  jobOrderId: body.jobOrderId || null,
                  assetId: body.assetId || null,
                  materialType: body.materialType,
                  itemName: firstItem?.itemName || body.itemName || 'Multiple Items',
                  description: firstItem?.description || body.description || 'See items list',
                  quantity: mainQuantity,
                  unit: firstItem?.unit || body.unit || 'PCS',
                  reasonForRequest: firstItem?.reasonForRequest || body.reasonForRequest || 'As required',
                  requiredDate,
                  preferredSupplier: firstItem?.preferredSupplier || body.preferredSupplier || null,
                  stockQtyInInventory: mainStockQty,
                  urgencyLevel: firstItem?.urgencyLevel || body.urgencyLevel || 'NORMAL',
                  requestedBy: body.requestedBy,
                  createdBy: session?.user?.email || body.requestedBy,
                  items: itemsCreate ? { create: itemsCreate } : undefined
                },
                include: { jobOrder: true, asset: true, items: true }
              })
            } catch (fallbackErr) {
              console.error('Fallback create without status also failed:', fallbackErr)
              // As a last resort, try a raw INSERT that explicitly lists columns (bypassing Prisma's generated column mappings)
              try {
                console.info('Attempting raw INSERT fallback (explicit columns)')
                const now = new Date()
                // Insert main material request row without the status column but include isDeleted so it appears in queries
                const inserted = await prisma.$queryRaw`
                  INSERT INTO "MaterialRequest" ("id","requestNumber","requestContext","jobOrderId","assetId","materialType","itemName","description","quantity","unit","reasonForRequest","requiredDate","preferredSupplier","stockQtyInInventory","urgencyLevel","requestedBy","createdBy","isDeleted","createdAt","updatedAt")
                  VALUES (${explicitId}, ${requestNumber}, ${body.requestContext}, ${body.jobOrderId || null}, ${body.assetId || null}, ${body.materialType}, ${firstItem?.itemName || body.itemName || 'Multiple Items'}, ${firstItem?.description || body.description || 'See items list'}, ${mainQuantity}, ${firstItem?.unit || body.unit || 'PCS'}, ${firstItem?.reasonForRequest || body.reasonForRequest || 'As required'}, ${requiredDate}, ${firstItem?.preferredSupplier || body.preferredSupplier || null}, ${mainStockQty}, ${firstItem?.urgencyLevel || body.urgencyLevel || 'NORMAL'}, ${body.requestedBy}, ${session?.user?.email || body.requestedBy}, false, ${now}, ${now})
                  RETURNING *
                `

                // Insert items if present (use createMany for efficiency)
                if (itemsCreate && itemsCreate.length > 0) {
                  await prisma.materialRequestItem.createMany({
                    data: itemsCreate.map((it: any) => ({
                      id: randomUUID(),
                      materialRequestId: explicitId,
                      itemName: it.itemName,
                      description: it.description,
                      quantity: it.quantity,
                      unit: it.unit,
                      stockQtyInInventory: it.stockQtyInInventory,
                      reasonForRequest: it.reasonForRequest,
                      urgencyLevel: it.urgencyLevel || 'NORMAL',
                      requiredDate: it.requiredDate,
                      preferredSupplier: it.preferredSupplier || null
                      // Note: omitting 'status' field; if the column is missing in DB, default will apply
                    }))
                  })
                }

                // Fetch the created record including items
                materialRequest = await prisma.materialRequest.findUnique({
                  where: { id: explicitId },
                  include: { jobOrder: true, asset: true, items: true }
                })

                if (!materialRequest) throw new Error('Raw insert succeeded but fetch failed')

              } catch (rawErr) {
                console.error('Raw INSERT fallback also failed:', rawErr)
                throw err // rethrow original error to be handled below
              }
            }
          } else {
            throw err // rethrow original error to be handled below
          }
        }
      } else {
        throw err
      }
    }

    console.log('Material request created:', materialRequest.id)
    
    // Create status history (non-blocking: don't fail the request if history insert fails)
    try {
      await prisma.statusHistory.create({
        data: {
          materialRequestId: materialRequest.id,
          oldStatus: '',
          newStatus: 'PENDING',
          changedBy: body.requestedBy,
          notes: 'Material request created'
        }
      })
    } catch (histErr) {
      console.warn('Failed to create status history (non-fatal):', histErr)
    }
    
    return NextResponse.json(materialRequest, { status: 201 })
  } catch (error: any) {
    try {
      console.error('Error creating material request - Full error:', error)
      if (error?.code) console.error('Prisma error code:', error.code)
      if (error?.meta) console.error('Prisma error meta:', JSON.stringify(error.meta))
      // serialize non-enumerable properties as well for richer logs
      try {
        console.error('Serialized error:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
      } catch (serErr) {
        console.error('Failed to serialize error object:', serErr)
      }
    } catch (logErr) {
      console.error('Failed to log error details:', logErr)
    }
    return NextResponse.json({ 
      error: 'Failed to create material request',
      code: error?.code || null,
      details: typeof error?.message === 'string' ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Delete request - Session:', session?.user)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Material request ID is required' }, { status: 400 })
    }

    const materialRequest = await prisma.materialRequest.findUnique({
      where: { id },
      include: {
        purchaseOrderItems: true,
        procurementActions: true
      }
    })

    if (!materialRequest) {
      return NextResponse.json({ error: 'Material request not found' }, { status: 404 })
    }

    if (materialRequest.isDeleted) {
      return NextResponse.json({ message: 'Material request already deleted' }, { status: 200 })
    }

    // Check permission
    const userRole = session.user.role || 'USER'
    const createdAt = materialRequest.createdAt || new Date()
    
    console.log('Permission check:', { 
      userRole, 
      createdAt, 
      canDelete: canEditOrDelete(createdAt, userRole) 
    })
    
    if (!canEditOrDelete(createdAt, userRole)) {
      const daysOld = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return NextResponse.json({ 
        error: `You do not have permission to delete this material request. It was created ${daysOld} days ago and can only be deleted within 4 days or by an admin.` 
      }, { status: 403 })
    }

    // Always soft delete to avoid FK constraint issues (status history, actions)
    const deletionDate = new Date()
    
    await prisma.$transaction([
      // Soft-delete the material request
      prisma.materialRequest.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: deletionDate,
          deletedBy: session.user.email
        }
      }),
      // Record deletion in status history
      prisma.statusHistory.create({
        data: {
          materialRequestId: id,
          oldStatus: materialRequest.status,
          newStatus: materialRequest.status,
          changedBy: session.user.email || 'system',
          notes: `Material request ${materialRequest.requestNumber} deleted on ${deletionDate.toISOString()}`
        }
      })
    ])

    return NextResponse.json({ message: 'Material request deleted successfully' })
  } catch (error) {
    console.error('Failed to delete material request:', error)
    return NextResponse.json({ error: 'Failed to delete material request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, items, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Material request ID is required' }, { status: 400 })
    }

    const existing = await prisma.materialRequest.findUnique({ 
      where: { id },
      include: { items: true }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Material request not found' }, { status: 404 })
    }

    const userRole = session.user.role || 'USER'
    if (!canEditOrDelete(existing.createdAt, userRole)) {
      return NextResponse.json({ 
        error: 'You do not have permission to edit this material request. It can only be edited within 4 days or by an admin.' 
      }, { status: 403 })
    }

    const changes: Record<string, any> = {}
    Object.keys(updateData).forEach(key => {
      if ((updateData as any)[key] !== (existing as any)[key]) {
        changes[key] = {
          from: (existing as any)[key],
          to: (updateData as any)[key]
        }
      }
    })

    // Use first item for main fields if items provided
    const firstItem = items && items.length > 0 ? items[0] : null
    const requiredDate = firstItem?.requiredDate 
      ? new Date(firstItem.requiredDate)
      : updateData.requiredDate 
        ? new Date(updateData.requiredDate)
        : existing.requiredDate

    // Update material request and items in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.materialRequestItem.deleteMany({
        where: { materialRequestId: id }
      })

      // Update material request with new data
      return await tx.materialRequest.update({
        where: { id },
        data: {
          ...updateData,
          itemName: firstItem?.itemName || updateData.itemName || existing.itemName,
          description: firstItem?.description || updateData.description || existing.description,
          quantity: firstItem ? parseFloat(firstItem.quantity) : (updateData.quantity ? parseFloat(updateData.quantity) : existing.quantity),
          unit: firstItem?.unit || updateData.unit || existing.unit,
          reasonForRequest: firstItem?.reasonForRequest || updateData.reasonForRequest || existing.reasonForRequest,
          requiredDate,
          preferredSupplier: firstItem?.preferredSupplier || updateData.preferredSupplier || existing.preferredSupplier,
          stockQtyInInventory: firstItem ? parseFloat(firstItem.stockQty || '0') : (updateData.stockQtyInInventory ? parseFloat(updateData.stockQtyInInventory) : existing.stockQtyInInventory),
          urgencyLevel: firstItem?.urgencyLevel || updateData.urgencyLevel || existing.urgencyLevel,
          lastEditedBy: session.user?.email || 'unknown',
          lastEditedAt: new Date(),
          items: items && items.length > 0 ? {
            create: items.map((item: any) => ({
              itemName: item.itemName,
              description: item.description,
              quantity: parseFloat(item.quantity),
              unit: item.unit,
              stockQtyInInventory: parseFloat(item.stockQty || '0'),
              reasonForRequest: item.reasonForRequest || null,
              urgencyLevel: item.urgencyLevel || 'NORMAL',
              requiredDate: item.requiredDate ? new Date(item.requiredDate) : null,
              preferredSupplier: item.preferredSupplier || null
            }))
          } : undefined
        },
        include: {
          jobOrder: true,
          items: true
        }
      })
    })

    if (Object.keys(changes).length > 0) {
      await prisma.materialRequestEditHistory.create({
        data: {
          materialRequestId: id,
          editedBy: session.user.email || 'unknown',
          changesMade: JSON.stringify(changes)
        }
      })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Failed to update material request:', error)
    return NextResponse.json({ error: 'Failed to update material request', details: error.message }, { status: 500 })
  }
}
