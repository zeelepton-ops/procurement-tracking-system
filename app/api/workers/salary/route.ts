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
    const workerId = searchParams.get('workerId')
    const month = searchParams.get('month')
    const status = searchParams.get('status')

    const whereClause: any = {}
    if (workerId) whereClause.workerId = workerId
    if (month) whereClause.month = month
    if (status) whereClause.paymentStatus = status

    const salaries = await prisma.workerSalary.findMany({
      where: whereClause,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            qid: true,
            profession: true
          }
        }
      },
      orderBy: { month: 'desc' }
    })

    return NextResponse.json(salaries)
  } catch (error) {
    console.error('Failed to fetch salaries:', error)
    return NextResponse.json({ error: 'Failed to fetch salaries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Calculate overtime pay and total salary
    const overtimePay = (body.overtimeHours || 0) * (body.overtimeRate || 0)
    const totalSalary = (body.basicSalary || 0) + overtimePay + (body.allowances || 0) - (body.deductions || 0)

    const salary = await prisma.workerSalary.create({
      data: {
        workerId: body.workerId,
        month: body.month,
        basicSalary: body.basicSalary,
        overtimeHours: body.overtimeHours || 0,
        overtimeRate: body.overtimeRate || 0,
        overtimePay,
        allowances: body.allowances || 0,
        deductions: body.deductions || 0,
        totalSalary,
        paidDate: body.paidDate ? new Date(body.paidDate) : null,
        paymentStatus: body.paymentStatus || 'PENDING',
        paymentMethod: body.paymentMethod || null,
        notes: body.notes || null,
        createdBy: session.user?.email || 'system'
      }
    })

    return NextResponse.json(salary)
  } catch (error) {
    console.error('Failed to create salary:', error)
    return NextResponse.json({ error: 'Failed to create salary' }, { status: 500 })
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

    // Recalculate if salary components changed
    if (updateData.basicSalary || updateData.overtimeHours || updateData.overtimeRate || 
        updateData.allowances || updateData.deductions) {
      const existing = await prisma.workerSalary.findUnique({ where: { id } })
      if (existing) {
        const basicSalary = updateData.basicSalary ?? existing.basicSalary
        const overtimeHours = updateData.overtimeHours ?? existing.overtimeHours
        const overtimeRate = updateData.overtimeRate ?? existing.overtimeRate
        const allowances = updateData.allowances ?? existing.allowances
        const deductions = updateData.deductions ?? existing.deductions
        
        updateData.overtimePay = overtimeHours * overtimeRate
        updateData.totalSalary = basicSalary + updateData.overtimePay + allowances - deductions
      }
    }

    const salary = await prisma.workerSalary.update({
      where: { id },
      data: {
        ...updateData,
        paidDate: updateData.paidDate ? new Date(updateData.paidDate) : undefined,
        updatedBy: session.user?.email || 'system'
      }
    })

    return NextResponse.json(salary)
  } catch (error) {
    console.error('Failed to update salary:', error)
    return NextResponse.json({ error: 'Failed to update salary' }, { status: 500 })
  }
}
