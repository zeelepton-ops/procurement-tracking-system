import nodemailer from 'nodemailer'
import Twilio from 'twilio'
import { prisma } from './prisma'
import { decryptSecret } from './crypto'

type EmailPayload = { to: string; subject: string; text?: string; html?: string; enquiryId?: string; supplierId?: string }
type SmsPayload = { to: string; body: string; enquiryId?: string; supplierId?: string }

type SmtpConfig = {
  host: string
  port: number
  user: string
  pass: string
  from: string
  secure: boolean
  source: 'db' | 'env'
}

import type { Prisma } from '@prisma/client'

type NotificationRecordInput = Prisma.NotificationCreateInput | Prisma.NotificationUncheckedCreateInput

async function createNotificationRecord(data: NotificationRecordInput) {
  return prisma.notification.create({ data: data as Prisma.NotificationCreateInput })
}

async function loadDbSmtpConfig(): Promise<SmtpConfig | null> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'smtp' } })
  const value = (setting?.value ?? {}) as any

  const host = value.host as string | undefined
  const port = value.port !== undefined ? Number(value.port) : undefined
  const user = value.user as string | undefined
  const from = (value.from as string | undefined) || user
  const secure = typeof value.secure === 'boolean' ? value.secure : port === 465
  const pass = value.passwordEncrypted ? decryptSecret(value.passwordEncrypted as string) : null

  if (!host || !port || !user || !pass) return null

  return { host, port, user, pass, from: from || user, secure, source: 'db' }
}

function loadEnvSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.EMAIL_FROM || user
  const secure = port === 465

  if (!host || !port || !user || !pass) return null

  return { host, port, user, pass, from: from || user, secure, source: 'env' }
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const dbConfig = await loadDbSmtpConfig()
  if (dbConfig) return dbConfig
  return loadEnvSmtpConfig()
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; info?: unknown; error?: string }> {
  const { to, subject, text, html, enquiryId, supplierId } = payload
  const record = await createNotificationRecord({ enquiryId: enquiryId ?? undefined, supplierId: supplierId ?? undefined, channel: 'EMAIL', to })

  const smtpConfig = await getSmtpConfig()

  if (!smtpConfig) {
    await prisma.notification.update({ where: { id: record.id }, data: { status: 'FAILED', providerResult: { error: 'SMTP not configured' } } })
    return { success: false, error: 'SMTP not configured' }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      auth: { user: smtpConfig.user, pass: smtpConfig.pass },
      secure: smtpConfig.secure,
    })

    const info = await transporter.sendMail({ from: smtpConfig.from || smtpConfig.user, to, subject, text, html })

    const serialized = JSON.parse(JSON.stringify(info))
    await prisma.notification.update({ where: { id: record.id }, data: { status: 'SENT', providerResult: serialized, sentAt: new Date() } })
    return { success: true, info }
  } catch (err: unknown) {
    await prisma.notification.update({ where: { id: record.id }, data: { status: 'FAILED', providerResult: { error: String(err) } } })
    return { success: false, error: String(err) }
  }
}

export async function sendSms(payload: SmsPayload): Promise<{ success: boolean; info?: unknown; error?: string }> {
  const { to, body, enquiryId, supplierId } = payload
  const record = await createNotificationRecord({ enquiryId: enquiryId ?? undefined, supplierId: supplierId ?? undefined, channel: 'SMS', to })

  const sid = process.env.TWILIO_SID
  const token = process.env.TWILIO_TOKEN
  const from = process.env.TWILIO_FROM

  if (!sid || !token || !from) {
    await prisma.notification.update({ where: { id: record.id }, data: { status: 'FAILED', providerResult: { error: 'Twilio not configured' } } })
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    const client = Twilio(sid, token)
    const msg = await client.messages.create({ body, from, to })
    const serialized = JSON.parse(JSON.stringify(msg))
    await prisma.notification.update({ where: { id: record.id }, data: { status: 'SENT', providerResult: serialized, sentAt: new Date() } })
    return { success: true, info: msg }
  } catch (err: unknown) {
    await prisma.notification.update({ where: { id: record.id }, data: { status: 'FAILED', providerResult: { error: String(err) } } })
    return { success: false, error: String(err) }
  }
}
