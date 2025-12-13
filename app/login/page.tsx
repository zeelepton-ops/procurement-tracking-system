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
      if (result.error.includes('pending approval')) {
        setError('Your account is pending admin approval. Please wait for approval.')
      } else if (result.error.includes('rejected')) {
        setError('Your registration was rejected. Please contact admin.')
      } else if (result.error.includes('inactive')) {
        setError('Your account has been deactivated. Please contact admin.')
      } else {
        setError('Invalid email or password')
      }
      return
    }

    router.replace(searchParams.get('callbackUrl') || '/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8">
        {/* Logo and Title Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <img 
            src="https://i.ibb.co/nMjzX2GS/Logo-NBTC-Transparent.png" 
            alt="NBTC Logo"
            style={{ width: '105px', height: '105px', objectFit: 'contain', flexShrink: 0 }}
          />
          <div className="flex-1"></div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
            <p className="text-sm text-slate-600">Procurement System</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Email or Username</label>
              <Input
                type="text"
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <LogIn className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          {/* Register Link */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mt-6 pt-6 border-t border-slate-200">
            <span>Don't have an account?</span>
            <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Register here
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
