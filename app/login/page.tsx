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
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 overflow-hidden relative">
      {/* Abstract animated background shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-32 right-0 w-96 h-96 bg-purple-400 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2s" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-400 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4s" />
      
      {/* Content Container */}
      <div className="w-full max-w-2xl mx-4 relative z-10">
        {/* Elegant Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20 max-h-[90vh] overflow-y-auto">
          {/* Logo and Title Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <img 
              src="https://i.ibb.co/nMjzX2GS/Logo-NBTC-Transparent.png" 
              alt="NBTC Logo"
              style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '16px' }}
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Welcome Back</h1>
            <p className="text-slate-600 font-medium">NBTC Procurement & Delivery Management</p>
          </div>

        {/* Form */}
        <div className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
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
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex justify-end text-sm">
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <LogIn className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          {/* Register Link */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mt-8 pt-6 border-t border-slate-200">
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
