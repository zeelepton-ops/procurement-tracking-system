import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, qid, joiningDate, department, position, phone } = body

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: 'Email, password, and name are required' 
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Determine role and status
    // info@nbtcqatar.com is always ADMIN and auto-approved
    const isAdmin = email.toLowerCase() === 'info@nbtcqatar.com'
    const role = isAdmin ? 'ADMIN' : 'USER'
    const status = isAdmin ? 'APPROVED' : 'PENDING'

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        hashedPassword,
        role,
        status,
        qid: qid || null,
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        department: department || null,
        position: position || null,
        phone: phone || null,
        approvedBy: isAdmin ? 'system' : null,
        approvedAt: isAdmin ? new Date() : null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    })

    return NextResponse.json({
      message: isAdmin 
        ? 'Admin account created successfully' 
        : 'Registration submitted. Please wait for admin approval.',
      user
    }, { status: 201 })

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'Failed to register user',
      details: error.message 
    }, { status: 500 })
  }
}
