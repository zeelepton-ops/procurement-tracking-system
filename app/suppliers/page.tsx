'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, MapPin, Phone, Mail, Award, Plus, Search, Filter, FileText, Trash2, Edit } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  tradingName?: string
  category?: string
  businessType?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  rating?: number
  status: string
  isActive: boolean
  crNumber?: string
  createdAt: string
}

interface Draft {
  formData: any
  uploads: any
  step: number
  savedAt: string
}

const SUPPLIER_CATEGORIES = [
  'Steel Structures',
  'Equipment & Machinery',
  'Raw Materials',
  'Consumables',
  'Services',
  'Construction Materials',
  'Electronics',
  'Hardware',
  'Other'
]

export default function SuppliersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'>('APPROVED')
  const [drafts, setDrafts] = useState<Draft[]>([])

  useEffect(() => {
    fetchSuppliers()
    loadDrafts()
  }, [searchQuery, categoryFilter, statusFilter])

  function loadDrafts() {
    try {
      const savedDraft = localStorage.getItem('supplierRegistrationDraft')
      if (savedDraft) {
        const draft = JSON.parse(savedDraft) as Draft
        setDrafts([draft])
      } else {
        setDrafts([])
      }
    } catch (error) {
      console.error('Failed to load drafts:', error)
      setDrafts([])
    }
  }

  async function fetchSuppliers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/suppliers?${params.toString()}`)
      const data = await res.json()
      setSuppliers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const deleteDraft = (index: number) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      localStorage.removeItem('supplierRegistrationDraft')
      setDrafts(drafts.filter((_, i) => i !== index))
    }
  }

  const continueDraft = (index: number) => {
    router.push('/suppliers/register')
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
            <p className="text-slate-600 mt-1">Manage and review all registered suppliers</p>
          </div>
          <Button
            onClick={() => router.push('/suppliers/register?new=true')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" /> Register New Supplier
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="ALL">All Categories</option>
                  {SUPPLIER_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="SUSPENDED">Suspended</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">&nbsp;</label>
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setCategoryFilter('ALL')
                    setStatusFilter('APPROVED')
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" /> Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drafts Section */}
        {drafts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-orange-500" /> Your Draft Applications ({drafts.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map((draft, idx) => (
                <Card key={idx} className="border-orange-300 border-2 bg-orange-50 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-orange-900">
                          {draft.formData.companyName || 'Untitled Draft'}
                        </CardTitle>
                        <p className="text-sm text-orange-700 mt-1">
                          Step {draft.step + 1} of 5 - {['Company Info', 'Documents', 'Contact', 'Banking', 'Review'][draft.step]}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-orange-800">
                        <span>📅 Saved: {new Date(draft.savedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${((draft.step + 1) / 5) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-orange-700">
                        Progress: {Math.round(((draft.step + 1) / 5) * 100)}% complete
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => continueDraft(idx)}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-2" /> Continue
                      </Button>
                      <Button
                        onClick={() => deleteDraft(idx)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Suppliers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-6 bg-slate-200 rounded mb-4" />
                  <div className="h-4 bg-slate-200 rounded mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg">No suppliers found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or register a new supplier</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(supplier => (
              <Card
                key={supplier.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/suppliers/${supplier.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      {supplier.tradingName && (
                        <p className="text-sm text-slate-600 mt-1">{supplier.tradingName}</p>
                      )}
                    </div>
                    {supplier.rating && supplier.rating > 0 && (
                      <div className="flex items-center gap-1 ml-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{supplier.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Category & Status */}
                    <div className="flex items-center justify-between">
                      {supplier.category && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          {supplier.category}
                        </span>
                      )}
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        supplier.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        supplier.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        supplier.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {supplier.status}
                      </span>
                    </div>

                    {/* Business Type */}
                    {supplier.businessType && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Type:</span> {supplier.businessType}
                      </p>
                    )}

                    {/* Location */}
                    {(supplier.city || supplier.country) && (
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{[supplier.city, supplier.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 truncate">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* CR Number */}
                    {supplier.crNumber && (
                      <p className="text-xs text-slate-500 border-t pt-3">
                        <span className="font-medium">CR:</span> {supplier.crNumber}
                      </p>
                    )}
                  </div>
                </CardContent>
                <div className="px-6 pb-4">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/suppliers/${supplier.id}`)
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && suppliers.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-slate-900">{suppliers.length}</p>
                <p className="text-sm text-slate-600">Total Suppliers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-green-600">
                  {suppliers.filter(s => s.status === 'APPROVED').length}
                </p>
                <p className="text-sm text-slate-600">Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-yellow-600">
                  {suppliers.filter(s => s.status === 'PENDING').length}
                </p>
                <p className="text-sm text-slate-600">Pending Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(suppliers.map(s => s.category)).size}
                </p>
                <p className="text-sm text-slate-600">Categories</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}