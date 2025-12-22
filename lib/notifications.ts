import nodemailer from 'nodemailer'
import Twilio from 'twilio'
import { prisma } from './prisma'

type EmailPayload = { to: string; subject: string; text?: string; html?: string; enquiryId?: string; supplierId?: string }
type SmsPayload = { to: string; body: string; enquiryId?: string; supplierId?: string }

type NotificationRecordInput = {
  enquiryId?: string | null
  supplierId?: string | null
  channel: string
  to: string
  status?: string
  providerResult?: unknown
}

async function createNotificationRecord(data: NotificationRecordInput) {
  return prisma.notification.create({ data })
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; info?: unknown; error?: string }> {
  const { to, subject, text, html, enquiryId, supplierId } = payload
  const record = await createNotificationRecord({ enquiryId: enquiryId ?? null, supplierId: supplierId ?? null, channel: 'EMAIL', to })

  // Check SMTP config
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    await prisma.notification.update({ where: { id: record.id }, data: { status: 'FAILED', providerResult: { error: 'SMTP not configured' } } })
    return { success: false, error: 'SMTP not configured' }
  }

  try {
    const transporter = nodemailer.createTransport({ host, port, auth: { user, pass }, secure: port === 465 })
    const info = await transporter.sendMail({ from: process.env.EMAIL_FROM || user, to, subject, text, html })

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
  const record = await createNotificationRecord({ enquiryId: enquiryId ?? null, supplierId: supplierId ?? null, channel: 'SMS', to })

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
