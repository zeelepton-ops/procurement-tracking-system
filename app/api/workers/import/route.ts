import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as XLSX from 'xlsx'

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

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data found in Excel file' }, { status: 400 })
    }

    const workers = []
    const errors = []

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i]
        
        // Map Excel column names (flexible matching)
        const getField = (row: any, ...possibleNames: string[]) => {
          for (const name of possibleNames) {
            if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
              return row[name]
            }
          }
          return null
        }

        const name = getField(row, 'Name', 'name', 'NAME')
        const qid = getField(row, 'QID', 'qid', 'QID')
        const passportNo = getField(row, 'Passport', 'passportNo', 'PASSPORT', 'passport')
        const visaCategory = getField(row, 'Visa', 'visaCategory', 'VISA') || 'Work Visa'
        const joiningDate = getField(row, 'Joining Date', 'joiningDate', 'JOINING_DATE', 'JoiningDate')

        // Required fields validation
        if (!name || !qid || !passportNo) {
          errors.push(`Row ${i + 1}: Missing required fields (Name, QID, Passport)`)
          continue
        }

        // Check for duplicates
        const existing = await prisma.worker.findFirst({
          where: {
            OR: [
              { qid: String(qid) },
              { passportNo: String(passportNo) }
            ]
          }
        })

        if (existing) {
          errors.push(`Row ${i + 1}: Worker with QID/Passport already exists`)
          continue
        }

        const worker = await prisma.worker.create({
          data: {
            name: String(name),
            qid: String(qid),
            qidExpiryDate: getField(row, 'QID Expiry', 'qidExpiryDate') ? new Date(getField(row, 'QID Expiry', 'qidExpiryDate')) : null,
            passportNo: String(passportNo),
            passportExpiryDate: getField(row, 'Passport Expiry', 'passportExpiryDate') ? new Date(getField(row, 'Passport Expiry', 'passportExpiryDate')) : null,
            nationality: getField(row, 'Nationality', 'nationality') || null,
            profession: getField(row, 'Profession', 'profession') || null,
            visaCategory: String(visaCategory),
            accommodationAddress: getField(row, 'Accommodation Address', 'accommodationAddress') || null,
            permanentAddress: getField(row, 'Permanent Address', 'permanentAddress') || null,
            phone: getField(row, 'Phone', 'phone') || null,
            email: getField(row, 'Email', 'email') || null,
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            exitDate: getField(row, 'Exit Date', 'exitDate') ? new Date(getField(row, 'Exit Date', 'exitDate')) : null,
            status: getField(row, 'Status', 'status') || 'ACTIVE',
            allottedShift: getField(row, 'Allotted Shift', 'allottedShift') || null,
            internalCompanyShift: getField(row, 'Internal Company Shift', 'internalCompanyShift') || null,
            createdBy: session.user?.email || 'system'
          }
        })

        await prisma.workerAuditLog.create({
          data: {
            workerId: worker.id,
            action: 'IMPORT',
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
