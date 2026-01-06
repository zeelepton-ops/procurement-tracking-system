'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Users, Plus, Search, Edit, Trash2, X, Building2, Mail, Phone, FileText } from 'lucide-react'

interface Client {
  id: string
  name: string
  crNo: string | null
  crExpiryDate: string | null
  email: string | null
  phone: string | null
  contactPerson: string | null
  contactPhone: string | null
  address: string | null
  taxId: string | null
  taxIdExpiryDate: string | null
  establishmentCardNo: string | null
  establishmentCardExpiryDate: string | null
  paymentTerms: string | null
  creditLimit: number | null
  status: string
  createdAt: string
  _count?: {
    jobOrders: number
    invoices: number
  }
}

export default function ClientsPage() {
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [clientForm, setClientForm] = useState({
    name: '',
    crNo: '',
    crExpiryDate: '',
    email: '',
    phone: '',
    contactPerson: '',
    contactPhone: '',
    address: '',
    taxId: '',
    taxIdExpiryDate: '',
    establishmentCardNo: '',
    establishmentCardExpiryDate: '',
    paymentTerms: 'Net 30',
    creditLimit: '',
    status: 'ACTIVE'
  })

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm, statusFilter])

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (searchTerm) params.set('search', searchTerm)

      const res = await fetch(`/api/clients?${params.toString()}`)
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      setClients([])
      setLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = clients

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.contactPerson?.toLowerCase().includes(term)
      )
    }

    setFilteredClients(filtered)
  }

  const resetForm = () => {
    setClientForm({
      name: '',
      crNo: '',
      crExpiryDate: '',
      email: '',
      phone: '',
      contactPerson: '',
      contactPhone: '',
      address: '',
      taxId: '',
      taxIdExpiryDate: '',
      establishmentCardNo: '',
      establishmentCardExpiryDate: '',
      paymentTerms: 'Net 30',
      creditLimit: '',
      status: 'ACTIVE'
    })
  }

  const handleAdd = () => {
    resetForm()
    setModalMode('add')
    setShowModal(true)
  }

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setClientForm({
      name: client.name,
      crNo: client.crNo || '',
      crExpiryDate: (client as any).crExpiryDate ? new Date((client as any).crExpiryDate).toISOString().split('T')[0] : '',
      email: client.email || '',
      phone: client.phone || '',
      contactPerson: client.contactPerson || '',
      contactPhone: client.contactPhone || '',
      address: client.address || '',
      taxId: client.taxId || '',
      taxIdExpiryDate: (client as any).taxIdExpiryDate ? new Date((client as any).taxIdExpiryDate).toISOString().split('T')[0] : '',
      establishmentCardNo: (client as any).establishmentCardNo || '',
      establishmentCardExpiryDate: (client as any).establishmentCardExpiryDate ? new Date((client as any).establishmentCardExpiryDate).toISOString().split('T')[0] : '',
      paymentTerms: client.paymentTerms || 'Net 30',
      creditLimit: client.creditLimit?.toString() || '',
      status: client.status
    })
    setModalMode('edit')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = modalMode === 'add' ? '/api/clients' : '/api/clients'
    const method = modalMode === 'add' ? 'POST' : 'PUT'
    const body = modalMode === 'edit' ? { id: selectedClient?.id, ...clientForm } : clientForm

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to save client')
        return
      }

      alert(`Client ${modalMode === 'add' ? 'created' : 'updated'} successfully!`)
      setShowModal(false)
      fetchClients()
    } catch (error) {
      console.error('Failed to save client:', error)
      alert('Failed to save client')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to delete client')
        return
      }

      alert('Client deleted successfully!')
      fetchClients()
    } catch (error) {
      console.error('Failed to delete client:', error)
      alert('Failed to delete client')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Client Management</h1>
        </div>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{client.name}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded ${
                    client.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </button>
                  {session?.user?.role === 'ADMIN' && (
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {client.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.contactPerson && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{client.contactPerson}</span>
                </div>
              )}
              {client.taxId && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>Tax ID: {client.taxId}</span>
                </div>
              )}
              <div className="pt-2 border-t flex justify-between text-xs text-gray-500">
                <span>{client._count?.jobOrders || 0} Jobs</span>
                <span>{client._count?.invoices || 0} Invoices</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No clients found. Click "Add Client" to create one.
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{modalMode === 'add' ? 'Add Client' : 'Edit Client'}</CardTitle>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Client Name *</Label>
                    <Input
                      required
                      value={clientForm.name}
                      onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>CR No. (Commercial Registration Number)</Label>
                    <Input
                      placeholder="Unique registration number"
                      value={clientForm.crNo}
                      onChange={(e) => setClientForm({...clientForm, crNo: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>CR Expiry Date</Label>
                    <Input
                      type="date"
                      value={clientForm.crExpiryDate}
                      onChange={(e) => setClientForm({...clientForm, crExpiryDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Establishment Card No.</Label>
                    <Input
                      placeholder="Establishment card number"
                      value={clientForm.establishmentCardNo}
                      onChange={(e) => setClientForm({...clientForm, establishmentCardNo: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Establishment Card Expiry Date</Label>
                    <Input
                      type="date"
                      value={clientForm.establishmentCardExpiryDate}
                      onChange={(e) => setClientForm({...clientForm, establishmentCardExpiryDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={clientForm.phone}
                      onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Contact Person</Label>
                    <Input
                      value={clientForm.contactPerson}
                      onChange={(e) => setClientForm({...clientForm, contactPerson: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      value={clientForm.contactPhone}
                      onChange={(e) => setClientForm({...clientForm, contactPhone: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Textarea
                      value={clientForm.address}
                      onChange={(e) => setClientForm({...clientForm, address: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Tax ID</Label>
                    <Input
                      value={clientForm.taxId}
                      onChange={(e) => setClientForm({...clientForm, taxId: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Tax ID Expiry Date</Label>
                    <Input
                      type="date"
                      value={clientForm.taxIdExpiryDate}
                      onChange={(e) => setClientForm({...clientForm, taxIdExpiryDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Payment Terms</Label>
                    <select
                      value={clientForm.paymentTerms}
                      onChange={(e) => setClientForm({...clientForm, paymentTerms: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Due on Receipt">Due on Receipt</option>
                    </select>
                  </div>
                  <div>
                    <Label>Credit Limit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={clientForm.creditLimit}
                      onChange={(e) => setClientForm({...clientForm, creditLimit: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select
                      value={clientForm.status}
                      onChange={(e) => setClientForm({...clientForm, status: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {modalMode === 'add' ? 'Add Client' : 'Update Client'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
