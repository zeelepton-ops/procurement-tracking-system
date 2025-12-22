'use client'

import { useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, FileText, BarChart3, LogOut, Briefcase, Users, Boxes } from 'lucide-react'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)

  if (!session || pathname === '/login') {
    return null
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/job-orders', label: 'Job Orders', icon: Briefcase },
    {
      href: '/procurement',
      label: 'Procurement',
      icon: Package,
      children: [
        { href: '/material-request', label: 'Material Requests', icon: FileText },
        { href: '/purchase-orders/prepare', label: 'Purchase Orders', icon: FileText },
        { href: '/suppliers', label: 'Suppliers', icon: Users },
      ]
    },
    { href: '/store', label: 'Store', icon: Boxes },
  ]

  // Add Users link for admin only
  if (session?.user?.role === 'ADMIN') {
    navItems.push({ href: '/users', label: 'Users', icon: Users })
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 -ml-2">
              {/* NBTC Logo */}
              <img 
                src="https://i.ibb.co/nMjzX2GS/Logo-NBTC-Transparent.png" 
                alt="NBTC Logo"
                style={{ width: '70px', height: 'auto', objectFit: 'contain' }}
              />
              <span className="text-lg font-bold text-slate-900 whitespace-nowrap">Procurement System</span>
            </Link>

            <nav className="flex gap-1 ml-4">
              {navItems.map((item, idx) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.children && item.children.some((c: any) => pathname === c.href))

                if (item.children) {
                  return (
                    <div
                      key={item.href}
                      className="relative"
                      onMouseEnter={() => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current)
                          closeTimeoutRef.current = null
                        }
                        setOpenIndex(idx)
                      }}
                      onMouseLeave={() => {
                        closeTimeoutRef.current = window.setTimeout(() => setOpenIndex(null), 150)
                      }}
                    >
                      <button
                        onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                        aria-expanded={openIndex === idx}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                          isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </button>

                      {openIndex === idx && (
                        <div
                          className="absolute right-0 top-full mt-1 bg-white border rounded shadow-md z-50 min-w-[200px]"
                          onMouseEnter={() => {
                            if (closeTimeoutRef.current) {
                              clearTimeout(closeTimeoutRef.current)
                              closeTimeoutRef.current = null
                            }
                          }}
                          onMouseLeave={() => {
                            closeTimeoutRef.current = window.setTimeout(() => setOpenIndex(null), 150)
                          }}
                        >
                          {item.children.map((child: any) => {
                            const ChildIcon = child.icon
                            return (
                              <Link key={child.href} href={child.href} className={`block px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 ${pathname === child.href ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}>
                                <div className="flex items-center gap-2">
                                  {ChildIcon ? <ChildIcon className="h-4 w-4" /> : null}
                                  <span>{child.label}</span>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden md:block">{session.user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="h-8 px-3"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
