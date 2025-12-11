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
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3">
              {/* NBTC Logo */}
              <svg width="40" height="50" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="8" width="80" height="105" rx="6" ry="6" fill="#001a66" stroke="#6b7280" strokeWidth="2" />
                <text x="48" y="50" fontSize="28" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif">B</text>
                <text x="48" y="78" fontSize="28" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif">T</text>
                <text x="48" y="106" fontSize="28" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif">C</text>
                <text x="62" y="60" fontSize="22" fontWeight="bold" fill="#dc2626" fontFamily="Arial, sans-serif">NBTC</text>
              </svg>
              <span className="text-xl font-bold text-slate-900">Procurement System</span>
            </Link>
            
            {/* 50 Year Anniversary Badge */}
            <div className="hidden lg:flex items-center px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
              <svg width="30" height="30" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="anniversary" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="25%" stopColor="#ec4899" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="75%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="45" r="35" fill="none" stroke="url(#anniversary)" strokeWidth="3" />
                <text x="50" y="58" fontSize="32" fontWeight="bold" textAnchor="middle" fill="url(#anniversary)" fontFamily="Arial, sans-serif">50</text>
              </svg>
              <span className="ml-2 text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">50 YEARS</span>
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
