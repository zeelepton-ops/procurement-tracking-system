import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptSecret, decryptSecret } from '@/lib/crypto'

const SMTP_KEY = 'smtp'

type SmtpSettingPayload = {
  host: string | null
  port: number | null
  user: string | null
  from: string | null
  secure: boolean | null
  password?: string
}

type SanitizedSetting = {
  host: string | null
  port: number | null
  user: string | null
  from: string | null
  secure: boolean | null
  hasPassword: boolean
  updatedBy: string | null
  updatedAt: Date | null
}

function getEnvDefaults() {
  const host = process.env.SMTP_HOST || null
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : null
  const user = process.env.SMTP_USER || null
  const from = process.env.EMAIL_FROM || user
  return {
    host,
    port,
    user,
    from: from || null,
    secure: port === 465,
    hasPassword: Boolean(process.env.SMTP_PASS),
  }
}

function sanitize(setting: any, updatedAt: Date | null): SanitizedSetting {
  return {
    host: setting?.host ?? null,
    port: setting?.port !== undefined ? Number(setting.port) : null,
    user: setting?.user ?? null,
    from: setting?.from ?? null,
    secure: typeof setting?.secure === 'boolean' ? setting.secure : null,
    hasPassword: Boolean(setting?.passwordEncrypted),
    updatedBy: setting?.updatedBy ?? null,
    updatedAt,
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const setting = await prisma.systemSetting.findUnique({ where: { key: SMTP_KEY } })
  const value = (setting?.value ?? null) as any

  return NextResponse.json({
    source: value ? 'db' : 'env',
    config: value ? sanitize(value, setting?.updatedAt ?? null) : null,
    envDefaults: getEnvDefaults(),
  })
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as SmtpSettingPayload
    const host = body.host?.trim() || null
    const port = body.port !== null && body.port !== undefined ? Number(body.port) : null
    const user = body.user?.trim() || null
    const from = body.from?.trim() || null
    const secure = body.secure ?? null
    const newPassword = body.password?.trim()

    if (!host || !port || !user) {
      return NextResponse.json({ error: 'Host, port, and user are required.' }, { status: 400 })
    }

    if (!Number.isFinite(port) || port <= 0) {
      return NextResponse.json({ error: 'Port must be a positive number.' }, { status: 400 })
    }

    const existing = await prisma.systemSetting.findUnique({ where: { key: SMTP_KEY } })
    const existingValue = (existing?.value ?? {}) as any

    let passwordEncrypted = existingValue.passwordEncrypted as string | undefined

    if (newPassword) {
      try {
        passwordEncrypted = encryptSecret(newPassword)
      } catch (error) {
        console.error('Failed to encrypt SMTP password', error)
        return NextResponse.json({ error: 'Encryption key missing or invalid.' }, { status: 500 })
      }
    }

    const value = {
      host,
      port,
      user,
      from: from || user,
      secure: secure ?? port === 465,
      passwordEncrypted,
      updatedBy: session.user.email,
    }

    await prisma.systemSetting.upsert({
      where: { key: SMTP_KEY },
      create: { key: SMTP_KEY, value },
      update: { value },
    })

    return NextResponse.json({
      message: 'SMTP settings saved.',
      config: sanitize(value, new Date()),
    })
  } catch (error) {
    console.error('Failed to save SMTP settings', error)
    return NextResponse.json({ error: 'Failed to save SMTP settings.' }, { status: 500 })
  }
}
