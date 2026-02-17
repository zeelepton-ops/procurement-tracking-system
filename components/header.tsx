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
    {
      href: '/job-orders',
      label: 'Job Orders',
      icon: Briefcase,
      children: [
        { href: '/job-orders?division=all', label: 'All Job Orders', icon: Briefcase },
        { href: '/job-orders?division=workshop', label: 'Workshop - Fabrication', icon: Briefcase },
        { href: '/job-orders?division=manufacturing', label: 'Manufacturing - Pipe Mill', icon: Factory },
      ]
    },
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
    {
      href: '/store',
      label: 'Store',
      icon: Boxes,
      children: [
        { href: '/store/delivery-notes', label: 'Delivery Notes', icon: FileText },
        { href: '/store/inventory', label: 'Inventory', icon: Boxes },
        { href: '/store/assets', label: 'Assets', icon: Package },
        { href: '/store/workers', label: 'Worker Management', icon: Users },
        { href: '/store/manufacturing-inventory', label: 'Manufacturing Inventory', icon: Factory },
      ]
    },
    { href: '/clients', label: 'Clients', icon: Building2 },
    { href: '/invoices', label: 'Invoicing', icon: Receipt },
  ]

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print shadow-md">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src="https://i.ibb.co/nMjzX2GS/Logo-NBTC-Transparent.png" 
                alt="NBTC Logo"
                className="h-10 w-auto object-contain"
              />
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-base font-bold text-slate-900">ERP System</span>
                <span className="text-xs text-slate-500">Manufacturing & Procurement</span>
              </div>
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="flex gap-1 flex-1 justify-center items-center min-w-0">
            {navItems.map((item, idx) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.children && item.children.some((c: any) => pathname === c.href.split('?')[0]))

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
                      onClick={(e) => {
                        setOpenIndex(null)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-150 whitespace-nowrap text-sm font-medium ${
                        isActive 
                          ? 'bg-primary-50 text-primary-700 shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      onMouseEnter={() => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current)
                          closeTimeoutRef.current = null
                        }
                        setOpenIndex(idx)
                      }}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.label}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${openIndex === idx ? 'rotate-180' : ''}`} />
                    </button>

                    {openIndex === idx && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-max whitespace-nowrap py-1"
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
                            <Link key={child.href} href={child.href} className={`block px-4 py-2.5 text-sm transition-colors ${pathname === child.href.split('?')[0] ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-150 whitespace-nowrap text-sm font-medium ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="relative flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer select-none transition-colors"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-900">{session.user?.name || 'User'}</span>
                <span className="text-xs text-slate-500 truncate">{session.user?.email}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </div>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-3 w-56 rounded-lg border border-slate-200 bg-white shadow-xl py-1">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-sm font-semibold text-slate-900">{session.user?.name || 'User'}</div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">{session.user?.email}</div>
                </div>
                <Link
                  href="/profile"
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile Settings
                </Link>
                {session?.user?.role === 'ADMIN' && (
                  <Link
                    href="/users"
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2 transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Users className="h-4 w-4" />
                    Manage Users
                  </Link>
                )}
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 border-t border-slate-100 mt-1 pt-2 transition-colors"
                  onClick={() => {
                    setUserMenuOpen(false)
                    signOut({ callbackUrl: '/login' })
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
