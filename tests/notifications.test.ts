import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as notifications from '@/lib/notifications'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      create: vi.fn().mockResolvedValue({ id: 'mock-id' }),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}))

describe('notifications', () => {
  beforeEach(() => {
    // clear env
    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    delete process.env.TWILIO_SID
    delete process.env.TWILIO_TOKEN
    delete process.env.TWILIO_FROM
  })

  it('should return error when SMTP not configured', async () => {
    const res = await notifications.sendEmail({ to: 'a@b.com', subject: 'x' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/SMTP not configured/)
  })

  it('should return error when Twilio not configured', async () => {
    const res = await notifications.sendSms({ to: '+123', body: 'hi' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Twilio not configured/)
  })
})