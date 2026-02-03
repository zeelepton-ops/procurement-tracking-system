'use client'

import { Suspense, useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
    <div className="h-screen w-screen flex items-center justify-center bg-white overflow-hidden relative border-4 border-blue-900">
      {/* Dark border strip effect */}
      <div className="absolute inset-0 border-4 border-blue-900 pointer-events-none" />
      
      {/* Subtle background gradient behind card only */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100" />
      
      {/* Content Container */}
      <div className="w-full max-w-lg mx-4 relative z-10 flex items-center justify-center">
        {/* Elegant Card */}
        <div className="bg-white rounded-xl shadow-xl p-6 border border-slate-200 w-full">
          {/* Logo and Title Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <img 
              src="https://i.ibb.co/nMjzX2GS/Logo-NBTC-Transparent.png" 
              alt="NBTC Logo"
              style={{ width: '90px', height: '90px', objectFit: 'contain', marginBottom: '12px' }}
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">Welcome Back</h1>
            <p className="text-slate-600 text-sm font-medium">NBTC Operations & Management</p>
          </div>

        {/* Form */}
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Email or Username</label>
              <Input
                type="text"
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex justify-end text-sm pt-1">
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <LogIn className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          {/* Register Link */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mt-5 pt-4 border-t border-slate-200">
            <span>Don't have an account?</span>
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Register here
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
