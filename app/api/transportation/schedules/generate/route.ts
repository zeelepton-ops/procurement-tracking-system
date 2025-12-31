import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, shift } = body

    if (!date || !shift) {
      return NextResponse.json({ error: 'Date and shift are required' }, { status: 400 })
    }

    // Delete existing schedules for this date and shift
    await prisma.transportSchedule.deleteMany({
      where: {
        date: new Date(date),
        shift: shift
      }
    })

    // Fetch workers for this shift, sorted by priority (highest first)
    const workers = await prisma.worker.findMany({
      where: {
        isActive: true,
        shift: shift
      },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' }
      ]
    })

    // Fetch available vehicles, sorted by seats (largest first)
    const vehicles = await prisma.vehicle.findMany({
      where: {
        isAvailable: true
      },
      orderBy: [
        { seats: 'desc' },
        { vehicleNumber: 'asc' }
      ]
    })

    if (workers.length === 0) {
      return NextResponse.json({ error: 'No workers found for this shift' }, { status: 400 })
    }

    if (vehicles.length === 0) {
      return NextResponse.json({ error: 'No vehicles available' }, { status: 400 })
    }

    // Auto-assign workers to vehicles using bin-packing algorithm
    const schedules: any[] = []
    let currentVehicleIndex = 0
    let currentVehicleCapacity = vehicles[currentVehicleIndex].seats
    let workersInCurrentVehicle = 0

    // Set pickup times based on shift
    const pickupTime = shift === 'DAY' ? '06:00' : '18:00'
    const dropTime = shift === 'DAY' ? '17:00' : '05:00'

    for (const worker of workers) {
      // If current vehicle is full, move to next vehicle
      if (workersInCurrentVehicle >= currentVehicleCapacity) {
        currentVehicleIndex++
        if (currentVehicleIndex >= vehicles.length) {
          // No more vehicles available, break
          console.warn(`Not enough vehicles to accommodate all workers. ${workers.length - schedules.length} workers left unassigned.`)
          break
        }
        currentVehicleCapacity = vehicles[currentVehicleIndex].seats
        workersInCurrentVehicle = 0
      }

      // Assign worker to current vehicle
      schedules.push({
        date: new Date(date),
        shift: shift,
        workerId: worker.id,
        vehicleId: vehicles[currentVehicleIndex].id,
        pickupTime: pickupTime,
        dropTime: dropTime,
        status: 'SCHEDULED',
        createdBy: session.user?.email || null
      })

      workersInCurrentVehicle++
    }

    // Create all schedules in database
    await prisma.transportSchedule.createMany({
      data: schedules
    })

    // Fetch and return the created schedules with relations
    const createdSchedules = await prisma.transportSchedule.findMany({
      where: {
        date: new Date(date),
        shift: shift
      },
      include: {
        worker: true,
        vehicle: true
      }
    })

    return NextResponse.json({
      message: 'Schedule generated successfully',
      totalWorkers: workers.length,
      assignedWorkers: schedules.length,
      vehiclesUsed: currentVehicleIndex + 1,
      schedules: createdSchedules
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating schedule:', error)
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 })
  }
}
