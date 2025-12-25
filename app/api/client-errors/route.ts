import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Minimal validation
    const payload = {
      message: body.message || 'unknown',
      stack: body.stack || null,
      componentStack: body.componentStack || null,
      url: body.url || null,
      userAgent: body.userAgent || null,
      timestamp: body.timestamp || new Date().toISOString()
    }

    // Log server-side for now (searchable in Vercel logs). Do not store PII.
    console.error('[client-error]', JSON.stringify(payload))

    // Optionally: integrate Sentry or other provider here in future

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('Failed to accept client telemetry:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
