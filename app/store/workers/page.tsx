'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { 
  Users, Plus, Search, FileDown, Upload, Calendar, DollarSign, 
  ClipboardList, History, Edit, Trash2, X, AlertCircle 
} from 'lucide-react'

interface Worker {
  id: string
  name: string
  qid: string
  qidExpiryDate: string | null
  passportNo: string
  passportExpiryDate: string | null
  profession: string
  visaCategory: string
  accommodationAddress: string | null
  permanentAddress: string | null
  phone: string | null
  email: string | null
  joiningDate: string
  exitDate: string | null
  status: string
  allottedShift: string | null
  internalCompanyShift: string | null
  createdAt: string
  _count?: {
    attendances: number
    salaries: number
  }
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'attendance' | 'salary' | 'audit'>('add')
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'attendance' | 'salary'>('list')

  const [workerForm, setWorkerForm] = useState({
    name: '',
    qid: '',
    qidExpiryDate: '',
    passportNo: '',
    passportExpiryDate: '',
    profession: '',
    visaCategory: '',
    accommodationAddress: '',
    permanentAddress: '',
    phone: '',
    email: '',
    joiningDate: '',
    exitDate: '',
    status: 'ACTIVE',
    allottedShift: '',
    internalCompanyShift: ''
  })

  const [attendances, setAttendances] = useState<any[]>([])
  const [salaries, setSalaries] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [showInitButton, setShowInitButton] = useState(false)

  useEffect(() => {
    fetchWorkers()
  }, [])

  useEffect(() => {
    filterWorkers()
  }, [workers, searchTerm, statusFilter])

  const fetchWorkers = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (searchTerm) params.set('search', searchTerm)

      const res = await fetch(`/api/workers?${params.toString()}`)
      const data = await res.json()
      
      // If empty array and no workers, might need initialization
      if (data.length === 0 && workers.length === 0) {
        setShowInitButton(true)
      }
      
      setWorkers(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch workers:', error)
      setShowInitButton(true)
      setLoading(false)
    }
  }

  const initializeTables = async () => {
    if (!confirm('Initialize Worker Management tables? This only needs to be done once.')) return
    
    try {
      const res = await fetch('/api/workers/init', { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        alert(data.message || 'Tables initialized successfully! You can now add workers.')
        setShowInitButton(false)
        await fetchWorkers()
      } else {
        alert('Error: ' + (data.error || 'Unknown error') + '\n\n' + (data.hint || 'Please try again'))
        // If tables already exist, hide the button and try to fetch workers
        if (data.error?.includes('already exist')) {
          setShowInitButton(false)
          await fetchWorkers()
        }
      }
    } catch (error) {
      console.error('Failed to initialize:', error)
      alert('Failed to initialize tables. Please check your connection and try again.')
    }
  }

  const filterWorkers = () => {
    let filtered = [...workers]
    
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(w => w.status === statusFilter)
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(w =>
        w.name.toLowerCase().includes(term) ||
        w.qid.toLowerCase().includes(term) ||
        w.passportNo.toLowerCase().includes(term) ||
        w.profession.toLowerCase().includes(term)
      )
    }
    
    setFilteredWorkers(filtered)
  }

  const openAddModal = () => {
    setModalMode('add')
    setSelectedWorker(null)
    setWorkerForm({
      name: '',
      qid: '',
      qidExpiryDate: '',
      passportNo: '',
      passportExpiryDate: '',
      profession: '',
      visaCategory: '',
      accommodationAddress: '',
      permanentAddress: '',
      phone: '',
      email: '',
      joiningDate: '',
      exitDate: '',
      status: 'ACTIVE',
      allottedShift: '',
      internalCompanyShift: ''
    })
    setShowModal(true)
  }

  const openEditModal = (worker: Worker) => {
    setModalMode('edit')
    setSelectedWorker(worker)
    setWorkerForm({
      name: worker.name,
      qid: worker.qid,
      qidExpiryDate: worker.qidExpiryDate ? worker.qidExpiryDate.split('T')[0] : '',
      passportNo: worker.passportNo,
      passportExpiryDate: worker.passportExpiryDate ? worker.passportExpiryDate.split('T')[0] : '',
      profession: worker.profession,
      visaCategory: worker.visaCategory,
      accommodationAddress: worker.accommodationAddress || '',
      permanentAddress: worker.permanentAddress || '',
      phone: worker.phone || '',
      email: worker.email || '',
      joiningDate: worker.joiningDate.split('T')[0],
      exitDate: worker.exitDate ? worker.exitDate.split('T')[0] : '',
      status: worker.status,
      allottedShift: worker.allottedShift || '',
      internalCompanyShift: worker.internalCompanyShift || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = modalMode === 'add' ? '/api/workers' : '/api/workers'
      const method = modalMode === 'add' ? 'POST' : 'PUT'
      
      const payload = modalMode === 'edit' 
        ? { id: selectedWorker?.id, ...workerForm }
        : workerForm

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to save worker')
        return
      }

      await fetchWorkers()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save worker:', error)
      alert('Failed to save worker')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this worker?')) return
    
    try {
      const res = await fetch(`/api/workers?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchWorkers()
    } catch (error) {
      console.error('Failed to delete worker:', error)
      alert('Failed to delete worker')
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/workers/import', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Failed to import')
      
      alert('Import successful!')
      await fetchWorkers()
    } catch (error) {
      console.error('Failed to import:', error)
      alert('Failed to import workers from Excel')
    }
  }

  const exportToExcel = async () => {
    try {
      const res = await fetch('/api/workers?export=true')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `workers-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } catch (error) {
      console.error('Failed to export:', error)
    }
  }

  const viewAuditLogs = async (worker: Worker) => {
    setSelectedWorker(worker)
    setModalMode('audit')
    try {
      const res = await fetch(`/api/workers/audit?workerId=${worker.id}`)
      const data = await res.json()
      setAuditLogs(data)
      setShowModal(true)
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    }
  }

  const isExpiringSoon = (dateStr: string | null) => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    const today = new Date()
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    return date < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading workers...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Worker Management</h1>
                <p className="text-sm text-slate-600">Manage workers, attendance, and salary</p>
              </div>
            </div>
            <div className="flex gap-2">
              {showInitButton && (
                <Button onClick={initializeTables} className="bg-orange-600 hover:bg-orange-700">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Initialize Tables
                </Button>
              )}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportExcel}
                className="hidden"
                id="import-excel"
              />
              <Button onClick={() => document.getElementById('import-excel')?.click()} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
              <Button onClick={exportToExcel} variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="mr-2 h-4 w-4" />
                Add Worker
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'list'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Worker List
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'attendance'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'salary'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Salary
            </button>
          </div>
        </div>

        {activeTab === 'list' && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by name, QID, passport..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="TERMINATED">Terminated</option>
                    <option value="RESIGNED">Resigned</option>
                  </select>
                  <div className="text-sm text-slate-600">
                    Showing {filteredWorkers.length} of {workers.length} workers
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workers Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">QID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Passport</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Profession</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Visa</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Shift</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredWorkers.map((worker) => (
                        <tr key={worker.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-slate-900">{worker.name}</div>
                              <div className="text-xs text-slate-500">{worker.phone}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm">{worker.qid}</div>
                              {worker.qidExpiryDate && (
                                <div className={`text-xs flex items-center gap-1 ${
                                  isExpired(worker.qidExpiryDate) ? 'text-red-600' :
                                  isExpiringSoon(worker.qidExpiryDate) ? 'text-orange-600' :
                                  'text-slate-500'
                                }`}>
                                  {isExpired(worker.qidExpiryDate) && <AlertCircle className="h-3 w-3" />}
                                  Exp: {new Date(worker.qidExpiryDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm">{worker.passportNo}</div>
                              {worker.passportExpiryDate && (
                                <div className={`text-xs flex items-center gap-1 ${
                                  isExpired(worker.passportExpiryDate) ? 'text-red-600' :
                                  isExpiringSoon(worker.passportExpiryDate) ? 'text-orange-600' :
                                  'text-slate-500'
                                }`}>
                                  {isExpired(worker.passportExpiryDate) && <AlertCircle className="h-3 w-3" />}
                                  Exp: {new Date(worker.passportExpiryDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{worker.profession}</td>
                          <td className="px-4 py-3 text-sm">{worker.visaCategory}</td>
                          <td className="px-4 py-3 text-sm">{worker.allottedShift || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              worker.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                              worker.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {worker.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button onClick={() => openEditModal(worker)} size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button onClick={() => viewAuditLogs(worker)} size="sm" variant="outline">
                                <History className="h-3 w-3" />
                              </Button>
                              <Button onClick={() => handleDelete(worker.id)} size="sm" variant="outline">
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {modalMode === 'add' ? 'Add New Worker' : 
                   modalMode === 'edit' ? 'Edit Worker' : 
                   'Audit Logs'}
                </h2>
                <Button onClick={() => setShowModal(false)} variant="outline" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {modalMode === 'audit' ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{log.action}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {log.description && (
                          <div className="text-sm text-slate-600">{log.description}</div>
                        )}
                        {log.field && (
                          <div className="text-xs text-slate-500 mt-1">
                            {log.field}: {log.oldValue} → {log.newValue}
                          </div>
                        )}
                        <div className="text-xs text-slate-500">By: {log.createdBy}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={workerForm.name}
                        onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>QID *</Label>
                      <Input
                        value={workerForm.qid}
                        onChange={(e) => setWorkerForm({ ...workerForm, qid: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>QID Expiry Date</Label>
                      <Input
                        type="date"
                        value={workerForm.qidExpiryDate}
                        onChange={(e) => setWorkerForm({ ...workerForm, qidExpiryDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Passport No. *</Label>
                      <Input
                        value={workerForm.passportNo}
                        onChange={(e) => setWorkerForm({ ...workerForm, passportNo: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Passport Expiry Date</Label>
                      <Input
                        type="date"
                        value={workerForm.passportExpiryDate}
                        onChange={(e) => setWorkerForm({ ...workerForm, passportExpiryDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Profession *</Label>
                      <Input
                        value={workerForm.profession}
                        onChange={(e) => setWorkerForm({ ...workerForm, profession: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Visa Category *</Label>
                      <select
                        value={workerForm.visaCategory}
                        onChange={(e) => setWorkerForm({ ...workerForm, visaCategory: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        required
                      >
                        <option value="">Select...</option>
                        <option value="Work Visa">Work Visa</option>
                        <option value="Visit Visa">Visit Visa</option>
                        <option value="Business Visa">Business Visa</option>
                        <option value="Family Visa">Family Visa</option>
                      </select>
                    </div>
                    <div>
                      <Label>Allotted Shift</Label>
                      <select
                        value={workerForm.allottedShift}
                        onChange={(e) => setWorkerForm({ ...workerForm, allottedShift: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      >
                        <option value="">Select...</option>
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                        <option value="Rotating">Rotating</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <Label>Internal Company Shift</Label>
                      <Input
                        value={workerForm.internalCompanyShift}
                        onChange={(e) => setWorkerForm({ ...workerForm, internalCompanyShift: e.target.value })}
                        placeholder="Department/Location"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={workerForm.phone}
                        onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={workerForm.email}
                        onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Joining Date *</Label>
                      <Input
                        type="date"
                        value={workerForm.joiningDate}
                        onChange={(e) => setWorkerForm({ ...workerForm, joiningDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Exit Date</Label>
                      <Input
                        type="date"
                        value={workerForm.exitDate}
                        onChange={(e) => setWorkerForm({ ...workerForm, exitDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Status *</Label>
                      <select
                        value={workerForm.status}
                        onChange={(e) => setWorkerForm({ ...workerForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        required
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="ON_LEAVE">On Leave</option>
                        <option value="TERMINATED">Terminated</option>
                        <option value="RESIGNED">Resigned</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Accommodation Address</Label>
                      <Input
                        value={workerForm.accommodationAddress}
                        onChange={(e) => setWorkerForm({ ...workerForm, accommodationAddress: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Permanent Address</Label>
                      <Input
                        value={workerForm.permanentAddress}
                        onChange={(e) => setWorkerForm({ ...workerForm, permanentAddress: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button type="submit">
                      {modalMode === 'add' ? 'Add Worker' : 'Update Worker'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
