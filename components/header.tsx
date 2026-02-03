'use client'

import { useState, useRef, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, FileText, BarChart3, LogOut, Briefcase, Users, Boxes, User, ChevronDown, Settings, Building2, Receipt, ClipboardCheck, Factory } from 'lucide-react'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const initials = useMemo(() => {
    const name = session?.user?.name || session?.user?.email || 'User'
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }, [session?.user?.name, session?.user?.email])

  if (!session || pathname === '/login') {
    return null
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/job-orders', label: 'Job Orders', icon: Briefcase },
    {
      href: '/quality-management',
      label: 'Execution',
      icon: ClipboardCheck,
      children: [
        { href: '/production', label: 'Production (L3)', icon: Factory },
        { href: '/quality-inspection', label: 'Quality Inspection (L4)', icon: ClipboardCheck },
      ]
    },
    {
      href: '/procurement',
      label: 'Procurement',
      icon: Package,
      children: [
        { href: '/material-request', label: 'Material Requests', icon: FileText },
        { href: '/purchase-orders', label: 'Purchase Orders', icon: FileText },
        { href: '/suppliers', label: 'Suppliers', icon: Users },
      ]
    },
    { href: '/store', label: 'Store', icon: Boxes },
    { href: '/clients', label: 'Clients', icon: Building2 },
    { href: '/invoices', label: 'Invoicing', icon: Receipt },
  ]

  return (
    <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-50 no-print shadow-sm">
      <div className="w-full px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2">
              {/* NBTC Logo */}
              <img 
                src="https://i.ibb.co/nMjzX2GS/Logo-NBTC-Transparent.png" 
                alt="NBTC Logo"
                className="h-9 w-auto object-contain"
              />
              <div className="hidden xl:flex flex-col leading-tight">
                <span className="text-base font-bold text-slate-900 whitespace-nowrap">Project ERP System</span>
                <span className="text-xs text-slate-500 whitespace-nowrap">Operations, Procurement & Delivery</span>
              </div>
            </Link>
          </div>

          <nav className="flex gap-0.5 flex-1 justify-center items-center min-w-0">
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
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        // Allow navigation to parent page
                        setOpenIndex(null)
                      }}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap text-sm ${
                        isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      onMouseEnter={() => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current)
                          closeTimeoutRef.current = null
                        }
                        setOpenIndex(idx)
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>

                    {openIndex === idx && (
                      <div
                        className="absolute right-0 top-full mt-1 bg-white border rounded shadow-md z-50 min-w-max whitespace-nowrap"
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
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap text-sm ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="relative flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer select-none"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-medium text-slate-900">{session.user?.name || 'User'}</span>
                <span className="text-xs text-slate-500">{session.user?.email}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-slate-200 bg-white shadow-lg py-2">
                <div className="px-3 pb-2 border-b border-slate-100">
                  <div className="text-sm font-semibold text-slate-900">{session.user?.name || 'User'}</div>
                  <div className="text-xs text-slate-500 truncate">{session.user?.email}</div>
                </div>
                <Link
                  href="/profile"
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Profile Settings
                </Link>
                {session?.user?.role === 'ADMIN' && (
                  <Link
                    href="/users"
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Users className="h-4 w-4" />
                    Users
                  </Link>
                )}
                <button
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
                  onClick={() => {
                    setUserMenuOpen(false)
                    signOut({ callbackUrl: '/login' })
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
