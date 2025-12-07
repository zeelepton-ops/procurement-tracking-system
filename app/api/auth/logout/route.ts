import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'use NextAuth signOut on client' })
}
