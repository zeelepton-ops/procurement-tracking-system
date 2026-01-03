import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'ALL'
    const exportCsv = searchParams.get('export') === 'true'

    const whereClause: any = {}
    
    if (status !== 'ALL') {
      whereClause.status = status
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { qid: { contains: search, mode: 'insensitive' } },
        { passportNo: { contains: search, mode: 'insensitive' } },
        { profession: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Try to fetch workers, but handle table not existing
    let workers = []
    try {
      workers = await prisma.worker.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              attendances: true,
              salaries: true
            }
          }
        }
      })
    } catch (dbError: any) {
      // If table doesn't exist (P2021), return empty array
      if (dbError.code === 'P2021') {
        console.log('Worker table does not exist yet - initialization needed')
        return NextResponse.json([])
      }
      throw dbError
    }

    if (exportCsv) {
      const headers = [
        'Name',
        'QID',
        'QID Expiry',
        'Passport',
        'Passport Expiry',
        'Nationality',
        'Profession',
        'Visa',
        'Phone',
        'Email',
        'Joining Date',
        'Exit Date',
        'Status',
        'Allotted Shift',
        'Internal Company Shift',
        'Accommodation Address',
        'Permanent Address',
        'Created At',
        'Updated At'
      ]

      const rows = workers.map((w: any) => [
        w.name,
        w.qid,
        w.qidExpiryDate ? new Date(w.qidExpiryDate).toISOString().split('T')[0] : '',
        w.passportNo,
        w.passportExpiryDate ? new Date(w.passportExpiryDate).toISOString().split('T')[0] : '',
        w.nationality || '',
        w.profession || '',
        w.visaCategory,
        w.phone || '',
        w.email || '',
        w.joiningDate ? new Date(w.joiningDate).toISOString().split('T')[0] : '',
        w.exitDate ? new Date(w.exitDate).toISOString().split('T')[0] : '',
        w.status,
        w.allottedShift || '',
        w.internalCompanyShift || '',
        w.accommodationAddress || '',
        w.permanentAddress || '',
        w.createdAt ? new Date(w.createdAt).toISOString() : '',
        w.updatedAt ? new Date(w.updatedAt).toISOString() : ''
      ])

      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n')

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="workers.csv"'
        }
      })
    }

    return NextResponse.json(workers)
  } catch (error) {
    console.error('Failed to fetch workers:', error)
    // Return empty array instead of error object to prevent frontend iteration errors
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check for duplicate QID or Passport
    let existingWorker = null
    try {
      existingWorker = await prisma.worker.findFirst({
        where: {
          OR: [
            { qid: body.qid },
            { passportNo: body.passportNo }
          ]
        }
      })
    } catch (dbError: any) {
      // If table doesn't exist, return helpful error
      if (dbError.code === 'P2021') {
        return NextResponse.json({ 
          error: 'Worker tables not initialized. Please click the "Initialize Tables" button first.' 
        }, { status: 400 })
      }
      throw dbError
    }

    if (existingWorker) {
      return NextResponse.json({ 
        error: 'Worker with this QID or Passport number already exists' 
      }, { status: 400 })
    }

    const worker = await prisma.worker.create({
      data: {
        name: body.name,
        qid: body.qid,
        qidExpiryDate: body.qidExpiryDate ? new Date(body.qidExpiryDate) : null,
        passportNo: body.passportNo,
        passportExpiryDate: body.passportExpiryDate ? new Date(body.passportExpiryDate) : null,
        nationality: body.nationality || null,
        profession: body.profession || 'Not Specified',
        visaCategory: body.visaCategory,
        accommodationAddress: body.accommodationAddress || null,
        permanentAddress: body.permanentAddress || null,
        phone: body.phone || null,
        email: body.email || null,
        joiningDate: new Date(body.joiningDate),
        exitDate: body.exitDate ? new Date(body.exitDate) : null,
        status: body.status || 'ACTIVE',
        allottedShift: body.allottedShift || null,
        internalCompanyShift: body.internalCompanyShift || null,
        createdBy: session.user?.email || 'system'
      }
    })

    // Create audit log
    await prisma.workerAuditLog.create({
      data: {
        workerId: worker.id,
        action: 'CREATE',
        description: `Worker ${worker.name} created`,
        createdBy: session.user?.email || 'system'
      }
    })

    return NextResponse.json(worker)
  } catch (error) {
    console.error('Failed to create worker:', error)
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 })
    }

    // Get old worker data for audit
    const oldWorker = await prisma.worker.findUnique({ where: { id } })
    if (!oldWorker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
    }

    // Check for duplicate QID or Passport (excluding current worker)
    if (updateData.qid || updateData.passportNo) {
      const existingWorker = await prisma.worker.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { qid: updateData.qid || oldWorker.qid },
                { passportNo: updateData.passportNo || oldWorker.passportNo }
              ]
            }
          ]
        }
      })

      if (existingWorker) {
        return NextResponse.json({ 
          error: 'Worker with this QID or Passport number already exists' 
        }, { status: 400 })
      }
    }

    const worker = await prisma.worker.update({
      where: { id },
      data: {
        ...updateData,
        qidExpiryDate: updateData.qidExpiryDate ? new Date(updateData.qidExpiryDate) : undefined,
        passportExpiryDate: updateData.passportExpiryDate ? new Date(updateData.passportExpiryDate) : undefined,
        joiningDate: updateData.joiningDate ? new Date(updateData.joiningDate) : undefined,
        exitDate: updateData.exitDate ? new Date(updateData.exitDate) : undefined,
        updatedBy: session.user?.email || 'system'
      }
    })

    // Create audit logs for changed fields
    const changedFields = Object.keys(updateData).filter(
      key => oldWorker[key as keyof typeof oldWorker] !== updateData[key]
    )

    for (const field of changedFields) {
      await prisma.workerAuditLog.create({
        data: {
          workerId: worker.id,
          action: 'UPDATE',
          field,
          oldValue: String(oldWorker[field as keyof typeof oldWorker] || ''),
          newValue: String(updateData[field] || ''),
          description: `Field ${field} updated`,
          createdBy: session.user?.email || 'system'
        }
      })
    }

    return NextResponse.json(worker)
  } catch (error) {
    console.error('Failed to update worker:', error)
    return NextResponse.json({ error: 'Failed to update worker' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 })
    }

    const worker = await prisma.worker.findUnique({ where: { id } })
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
    }

    // Create audit log, then delete worker (SetNull will preserve the log)
    await prisma.workerAuditLog.create({
      data: {
        workerId: id,
        action: 'DELETE',
        description: `Worker ${worker.name} deleted`,
        createdBy: session.user?.email || 'system'
      }
    })

    await prisma.worker.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete worker:', error)
    return NextResponse.json({ error: 'Failed to delete worker' }, { status: 500 })
  }
}
