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
      <div className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-8 md:p-12 gap-8">
        {/* NBTC Logo */}
        <svg width="200" height="120" viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
          {/* Navy blue box for BTC */}
          <rect x="10" y="10" width="70" height="140" rx="8" fill="#001a4d" stroke="#667085" strokeWidth="2" />
          <text x="45" y="50" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif">B</text>
          <text x="45" y="85" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif">T</text>
          <text x="45" y="120" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif">C</text>
          
          {/* Red NBTC text */}
          <text x="110" y="55" fontSize="58" fontWeight="900" fill="#dc2626" fontFamily="Arial Black, Arial, sans-serif">NBTC</text>
        </svg>
        
        {/* 50 Year Anniversary Logo */}
        <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="20%" stopColor="#d946ef" />
              <stop offset="40%" stopColor="#ec4899" />
              <stop offset="60%" stopColor="#f97316" />
              <stop offset="80%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          
          {/* Circle with rainbow gradient */}
          <circle cx="70" cy="70" r="55" fill="white" stroke="url(#rainbowGrad)" strokeWidth="8" />
          
          {/* Blue background circle */}
          <circle cx="70" cy="70" r="48" fill="#f0f9ff" />
          
          {/* Purple 50 */}
          <text x="70" y="80" fontSize="48" fontWeight="900" fill="#7c3aed" textAnchor="middle" fontFamily="Arial, sans-serif">50</text>
          
          {/* Year Anniversary text */}
          <text x="70" y="108" fontSize="10" fontWeight="700" fill="#059669" textAnchor="middle" letterSpacing="2" fontFamily="Arial, sans-serif">YEAR</text>
          <text x="70" y="122" fontSize="10" fontWeight="700" fill="#059669" textAnchor="middle" letterSpacing="2" fontFamily="Arial, sans-serif">ANNIVERSARY</text>
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
