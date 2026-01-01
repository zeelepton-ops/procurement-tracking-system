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

    // Settings
    const basicHours = body.basicHours ?? 8
    const monthsPerYear = body.monthsPerYear ?? 12
    const weekdayFactor = body.weekdayFactor ?? 1
    const weekendFactor = body.weekendFactor ?? 1.5
    const holidayFactor = body.holidayFactor ?? 2

    const basicSalaryNum = body.basicSalary || 0
    const overtimeHoursNum = body.overtimeHours || 0
    const allowancesNum = body.allowances || 0
    const deductionsNum = body.deductions || 0

    const hourlyRate = (basicSalaryNum * monthsPerYear) / 365 / basicHours
    const dayType: 'weekday' | 'weekend' | 'holiday' = body.dayType || body.paymentStatus || 'weekday'
    let factor = weekdayFactor
    if (dayType === 'weekend') factor = weekendFactor
    if (dayType === 'holiday') factor = holidayFactor

    const baseDaySalary = basicHours * hourlyRate
    const overtimePay = overtimeHoursNum * hourlyRate * factor
    const totalSalary = baseDaySalary + overtimePay + allowancesNum - deductionsNum

    const salary = await prisma.workerSalary.create({
      data: {
        workerId: body.workerId,
        month: body.month,
        basicSalary: body.basicSalary,
        overtimeHours: overtimeHoursNum,
        overtimeRate: hourlyRate,
        overtimePay,
        allowances: allowancesNum,
        deductions: deductionsNum,
        totalSalary,
        paidDate: body.paidDate ? new Date(body.paidDate) : null,
        paymentStatus: dayType,
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

    // Recalculate if salary components changed using same formula
    if (updateData.basicSalary || updateData.overtimeHours || updateData.allowances || updateData.deductions) {
      const existing = await prisma.workerSalary.findUnique({ where: { id } })
      if (existing) {
        const basicHours = updateData.basicHours ?? 8
        const monthsPerYear = updateData.monthsPerYear ?? 12
        const weekdayFactor = updateData.weekdayFactor ?? 1
        const weekendFactor = updateData.weekendFactor ?? 1.5
        const holidayFactor = updateData.holidayFactor ?? 2
        const dayType: 'weekday' | 'weekend' | 'holiday' = updateData.dayType || existing.paymentStatus as any || 'weekday'

        const basicSalary = updateData.basicSalary ?? existing.basicSalary
        const overtimeHours = updateData.overtimeHours ?? existing.overtimeHours
        const allowances = updateData.allowances ?? existing.allowances
        const deductions = updateData.deductions ?? existing.deductions

        const hourlyRate = (basicSalary * monthsPerYear) / 365 / basicHours
        let factor = weekdayFactor
        if (dayType === 'weekend') factor = weekendFactor
        if (dayType === 'holiday') factor = holidayFactor

        updateData.overtimeRate = hourlyRate
        updateData.overtimePay = overtimeHours * hourlyRate * factor
        updateData.totalSalary = (basicHours * hourlyRate) + updateData.overtimePay + allowances - deductions
        updateData.paymentStatus = dayType
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
