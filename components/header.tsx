'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, FileText, BarChart3, LogOut, Briefcase } from 'lucide-react'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session || pathname === '/login') {
    return null
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/job-orders', label: 'Job Orders', icon: Briefcase },
    { href: '/material-request', label: 'Material Requests', icon: FileText },
    { href: '/procurement', label: 'Procurement', icon: Package },
  ]

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              {/* NBTC Logo */}
              <svg width="45" height="30" viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="10" width="70" height="140" rx="8" fill="#001a4d" stroke="#667085" strokeWidth="2" />
                <text x="45" y="50" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif">B</text>
                <text x="45" y="85" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif">T</text>
                <text x="45" y="120" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif">C</text>
                <text x="110" y="55" fontSize="58" fontWeight="900" fill="#dc2626" fontFamily="Arial Black, Arial, sans-serif">NBTC</text>
              </svg>
              <span className="text-xl font-bold text-slate-900">Procurement System</span>
            </Link>
            
            {/* 50 Year Anniversary Badge */}
            <div className="hidden lg:flex items-center px-3 py-2 bg-gradient-to-r from-purple-100 to-cyan-100 rounded-full border border-purple-200">
              <svg width="32" height="32" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="rainbowGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="20%" stopColor="#d946ef" />
                    <stop offset="40%" stopColor="#ec4899" />
                    <stop offset="60%" stopColor="#f97316" />
                    <stop offset="80%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <circle cx="70" cy="70" r="55" fill="white" stroke="url(#rainbowGrad2)" strokeWidth="8" />
                <circle cx="70" cy="70" r="48" fill="#f0f9ff" />
                <text x="70" y="80" fontSize="48" fontWeight="900" fill="#7c3aed" textAnchor="middle" fontFamily="Arial, sans-serif">50</text>
              </svg>
              <span className="ml-2 text-xs font-bold text-purple-700">50 YEARS</span>
            </div>

            <nav className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{session.user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
