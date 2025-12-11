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
      <div className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-8 md:p-12 gap-6">
        {/* NBTC Logo */}
        <svg width="120" height="140" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
          {/* Main blue rectangle */}
          <rect x="8" y="8" width="80" height="105" rx="6" ry="6" fill="#001a66" stroke="#6b7280" strokeWidth="2" />
          
          {/* White letters BTC */}
          <text x="48" y="50" fontSize="28" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif">B</text>
          <text x="48" y="78" fontSize="28" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif">T</text>
          <text x="48" y="106" fontSize="28" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif">C</text>
          
          {/* Red NBTC text */}
          <text x="62" y="60" fontSize="22" fontWeight="bold" fill="#dc2626" fontFamily="Arial, sans-serif">NBTC</text>
        </svg>
        
        {/* 50 Year Anniversary Logo */}
        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="anniversary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="25%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>
          
          {/* Circle background */}
          <circle cx="50" cy="45" r="35" fill="none" stroke="url(#anniversary)" strokeWidth="3" />
          
          {/* 50 text */}
          <text x="50" y="58" fontSize="32" fontWeight="bold" textAnchor="middle" fill="url(#anniversary)" fontFamily="Arial, sans-serif">50</text>
          
          {/* YEAR ANNIVERSARY text */}
          <text x="50" y="78" fontSize="7" fontWeight="600" textAnchor="middle" fill="#0891b2" fontFamily="Arial, sans-serif">YEAR ANNIVERSARY</text>
        </svg>
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
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <LogIn className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
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
