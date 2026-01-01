import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File is empty or invalid' }, { status: 400 })
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const workers = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const workerData: any = {}
        
        headers.forEach((header, index) => {
          workerData[header] = values[index] || null
        })

        // Required fields validation
        if (!workerData.name || !workerData.qid || !workerData.passportNo || 
            !workerData.profession || !workerData.visaCategory || !workerData.joiningDate) {
          errors.push(`Row ${i + 1}: Missing required fields`)
          continue
        }

        // Check for duplicates
        const existing = await prisma.worker.findFirst({
          where: {
            OR: [
              { qid: workerData.qid },
              { passportNo: workerData.passportNo }
            ]
          }
        })

        if (existing) {
          errors.push(`Row ${i + 1}: Worker with QID ${workerData.qid} or Passport ${workerData.passportNo} already exists`)
          continue
        }

        const worker = await prisma.worker.create({
          data: {
            name: workerData.name,
            qid: workerData.qid,
            qidExpiryDate: workerData.qidExpiryDate ? new Date(workerData.qidExpiryDate) : null,
            passportNo: workerData.passportNo,
            passportExpiryDate: workerData.passportExpiryDate ? new Date(workerData.passportExpiryDate) : null,
            profession: workerData.profession,
            visaCategory: workerData.visaCategory,
            accommodationAddress: workerData.accommodationAddress || null,
            permanentAddress: workerData.permanentAddress || null,
            phone: workerData.phone || null,
            email: workerData.email || null,
            joiningDate: new Date(workerData.joiningDate),
            exitDate: workerData.exitDate ? new Date(workerData.exitDate) : null,
            status: workerData.status || 'ACTIVE',
            allottedShift: workerData.allottedShift || null,
            internalCompanyShift: workerData.internalCompanyShift || null,
            createdBy: session.user?.email || 'system'
          }
        })

        await prisma.workerAuditLog.create({
          data: {
            workerId: worker.id,
            action: 'CREATE',
            description: `Worker ${worker.name} imported from Excel`,
            createdBy: session.user?.email || 'system'
          }
        })

        workers.push(worker)
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      imported: workers.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Failed to import workers:', error)
    return NextResponse.json({ error: 'Failed to import workers' }, { status: 500 })
  }
}
