'use client'

import { Suspense, useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, LogIn } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(searchParams.get('callbackUrl') || '/')
    }
  }, [status, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password')
      return
    }

    router.replace(searchParams.get('callbackUrl') || '/')
  }

  return (
    <div className="w-full max-w-4xl shadow-xl rounded-lg overflow-hidden bg-white md:flex">
      {/* Logo Section - Left */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-8 md:p-12">
        <div style={{ textAlign: 'center' }}>
          <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABEwAAAEeCAYAAACQf4DhAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAF+mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTEwLTE1VDE3OjMwOjIzKzAzOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNS0wMi0yNFQxMzo0MzowOCswMzowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNS0wMi0yNFQxMzo0MzowOCswMzowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxNmNkNzMyMC1hMDgyLTczNGEtYjQyZC1kZjQyOGMyZTNkYmMiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpkM2ZlZTRiYy1mZGZiLWI2NDYtOTMxOS05Yzg4ZjczN2JmNTYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDplNGQzOTQ2Yy0yMmY0LWU5NGItODJhNC04ZTk0ZjJmY2YwODEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmU0ZDM5NDZjLTIyZjQtZTk0Yi04MmE0LThlOTRmMmZjZjA4MSIgc3RFdnQ6d2hlbj0iMjAyNC0xMC0xNVQxNzozMDoyMyswMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDoxNmNkNzMyMC1hMDgyLTczNGEtYjQyZC1kZjQyOGMyZTNkYmMiIHN0RXZ0OndoZW49IjIwMjUtMDItMjRUMTM6NDM6MDgrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz41w4w8AABdR0lEQVR42u3dB1xV9f/H8XPZ+wqCG0ScqZh7IAqurMxKsxzlKFtajv7pL8mVaGFpw1FWaqWWIytLw4YLENwbVw64XBRE5mWve+//HsAcOVj3cu89r+fjcTwXvNzxuYcz3nyHTKvVCgAAALjJghIAAAAAAADcjsAEAAAAAADgDgQmAAAAAAAAdyAwAQAAAAAAuAOBCQAAAAAAwB0ITAAAAAAAAO5gZYgnWbMxera4jrui8oiLV3mLtxVKVQvKj3vx9pJfaOwpV4i3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"
            alt="NBTC Logo"
            width="280"
            height="180"
            style={{ objectFit: 'contain', display: 'block', margin: '0 auto', maxWidth: '100%' }}
          />
        </div>
      </div>

      {/* Sign In Form - Right */}
      <Card className="w-full md:w-1/2 shadow-none border-0">
        <CardHeader className="text-center space-y-4">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">Sign In</CardTitle>
            <p className="text-sm text-slate-600 mt-1">Procurement System</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>
          <p className="text-xs text-slate-500 text-center">Contact your administrator for login credentials</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
