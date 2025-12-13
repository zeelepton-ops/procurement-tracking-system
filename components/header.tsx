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
              <img 
                src="/nbtc-logo.png" 
                alt="NBTC Logo"
                style={{ width: '45px', height: 'auto', objectFit: 'contain' }}
              />
              <span className="text-xl font-bold text-slate-900">Procurement System</span>
            </Link>
            
            {/* 50 Year Anniversary Badge */}
            <div className="hidden lg:flex items-center px-3 py-2 bg-gradient-to-r from-purple-100 to-cyan-100 rounded-full border border-purple-200">
              <img 
                src="/50-anniversary.png" 
                alt="50 Year Anniversary"
                style={{ width: '32px', height: 'auto', objectFit: 'contain' }}
              />
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
