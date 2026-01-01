'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  const [showAttendanceForm, setShowAttendanceForm] = useState(false)
  const [showSalaryForm, setShowSalaryForm] = useState(false)

  const [attendanceSettings, setAttendanceSettings] = useState({
    basicHours: 8,
    workdays: 'Mon-Fri',
    weekends: 'Sat-Sun',
    shift1Start: '08:00',
    shift1End: '17:00',
    shift2Start: '20:00',
    shift2End: '05:00',
    shift1NextDay: false,
    shift2NextDay: true,
    lunch1Hours: 1,
    lunch2Hours: 1,
    workdaySelection: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    weekendSelection: ['Sat', 'Sun']
  })

  const [salarySettings, setSalarySettings] = useState({
    basicHours: 8,
    monthsPerYear: 12,
    weekdayFactor: 1,
    weekendFactor: 1.5,
    holidayFactor: 2
  })

  const [attendanceForm, setAttendanceForm] = useState({
    workerId: '',
    date: '',
    shift: 'shift1',
    status: 'PRESENT',
    checkIn: '',
    checkOut: '',
    workHours: '',
    overtimeHours: '',
    notes: ''
  })

  const [attendanceScope, setAttendanceScope] = useState<'single' | 'filtered' | 'multi'>('single')
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([])

  const [salaryForm, setSalaryForm] = useState({
    workerId: '',
    month: '',
    basicSalary: '',
    overtimeHours: '',
    overtimeRate: '',
    allowances: '',
    deductions: '',
    paymentStatus: 'weekday',
    paymentMethod: '',
    paidDate: '',
    notes: ''
  })

  useEffect(() => {
    fetchWorkers()
  }, [])

  useEffect(() => {
    filterWorkers()
  }, [workers, searchTerm, statusFilter])

  useEffect(() => {
    if (activeTab === 'attendance' && attendances.length === 0) {
      fetchAttendances()
    }
    if (activeTab === 'salary' && salaries.length === 0) {
      fetchSalaries()
    }
  }, [activeTab])

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

  const fetchAttendances = async () => {
    try {
      const res = await fetch('/api/workers/attendance')
      const data = await res.json()
      setAttendances(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    }
  }

  const fetchSalaries = async () => {
    try {
      const res = await fetch('/api/workers/salary')
      const data = await res.json()
      setSalaries(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch salaries:', error)
    }
  }

  const submitAttendance = async () => {
    if (!attendanceForm.date) {
      alert('Date is required')
      return
    }

    try {
      // Auto-calc work hours from check-in/out
      let calculatedHours: number | null = null
      if (attendanceForm.checkIn && attendanceForm.checkOut) {
        const start = new Date(attendanceForm.checkIn)
        const end = new Date(attendanceForm.checkOut)
        let diffMs = end.getTime() - start.getTime()
        if (diffMs < 0) {
          // Crosses midnight
          diffMs = diffMs + 24 * 60 * 60 * 1000
        }
        calculatedHours = diffMs > 0 ? Number((diffMs / (1000 * 60 * 60)).toFixed(2)) : 0
      }

      // Deduct lunch hours based on selected shift
      const lunchHours = attendanceForm.shift === 'shift2' ? attendanceSettings.lunch2Hours : attendanceSettings.lunch1Hours
      if (calculatedHours !== null && lunchHours) {
        calculatedHours = Math.max(0, Number((calculatedHours - lunchHours).toFixed(2)))
      }

      const workHours = calculatedHours !== null ? calculatedHours : (attendanceForm.workHours ? Number(attendanceForm.workHours) : null)
      const overtimeHours = workHours !== null && workHours > attendanceSettings.basicHours
        ? Number((workHours - attendanceSettings.basicHours).toFixed(2))
        : (attendanceForm.overtimeHours ? Number(attendanceForm.overtimeHours) : 0)

      const targets: string[] =
        attendanceScope === 'single'
          ? (attendanceForm.workerId ? [attendanceForm.workerId] : [])
          : attendanceScope === 'filtered'
            ? filteredWorkers.map(w => w.id)
            : selectedWorkerIds

      if (targets.length === 0) {
        alert('Select at least one worker')
        return
      }

      const payloadBase = {
        ...attendanceForm,
        workHours,
        overtimeHours
      }

      await Promise.all(
        targets.map((id) =>
          fetch('/api/workers/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payloadBase, workerId: id })
          })
        )
      )

      setAttendanceForm({
        workerId: '',
        date: '',
        shift: 'shift1',
        status: 'PRESENT',
        checkIn: '',
        checkOut: '',
        workHours: '',
        overtimeHours: '',
        notes: ''
      })
      setSelectedWorkerIds([])
      setShowAttendanceForm(false)
      await fetchAttendances()
    } catch (error) {
      console.error('Failed to save attendance:', error)
      alert('Failed to save attendance')
    }
  }

  const submitSalary = async () => {
    if (!salaryForm.workerId || !salaryForm.month || !salaryForm.basicSalary) {
      alert('Worker, month, and basic salary are required')
      return
    }

    try {
      const basicHours = salarySettings.basicHours || 8
      const monthsPerYear = salarySettings.monthsPerYear || 12
      const weekdayFactor = salarySettings.weekdayFactor || 1
      const weekendFactor = salarySettings.weekendFactor || 1.5
      const holidayFactor = salarySettings.holidayFactor || 2

      const basicSalaryNum = Number(salaryForm.basicSalary)
      const overtimeHoursNum = salaryForm.overtimeHours ? Number(salaryForm.overtimeHours) : 0
      const allowancesNum = salaryForm.allowances ? Number(salaryForm.allowances) : 0
      const deductionsNum = salaryForm.deductions ? Number(salaryForm.deductions) : 0

      const hourlyRate = ((basicSalaryNum || 0) * monthsPerYear) / 365 / basicHours
      const dayType = salaryForm.paymentStatus || 'weekday'
      let factor = weekdayFactor
      if (dayType === 'weekend') factor = weekendFactor
      if (dayType === 'holiday') factor = holidayFactor

      const baseDaySalary = basicHours * hourlyRate
      const overtimePay = overtimeHoursNum * hourlyRate * factor
      const totalSalary = baseDaySalary + overtimePay + allowancesNum - deductionsNum

      const res = await fetch('/api/workers/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...salaryForm,
          dayType,
          basicSalary: basicSalaryNum,
          overtimeHours: overtimeHoursNum,
          overtimeRate: hourlyRate,
          allowances: allowancesNum,
          deductions: deductionsNum,
          hourlyRate,
          overtimePay,
          totalSalary,
          basicHours,
          monthsPerYear,
          weekdayFactor,
          weekendFactor,
          holidayFactor
        })
      })

      if (!res.ok) throw new Error('Failed to save salary')

      setSalaryForm({
        workerId: '',
        month: '',
        basicSalary: '',
        overtimeHours: '',
        overtimeRate: '',
        allowances: '',
        deductions: '',
        paymentStatus: 'weekday',
        paymentMethod: '',
        paidDate: '',
        notes: ''
      })
      setShowSalaryForm(false)
      await fetchSalaries()
    } catch (error) {
      console.error('Failed to save salary:', error)
      alert('Failed to save salary')
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

        {activeTab === 'attendance' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  Attendance Records
                </CardTitle>
                <Button variant="outline" onClick={() => setShowAttendanceForm((s) => !s)}>
                  {showAttendanceForm ? 'Close Form' : 'Add Attendance'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 p-3 border rounded-lg bg-slate-50">
                <div>
                  <Label>Basic Hours</Label>
                  <Input
                    type="number"
                    value={attendanceSettings.basicHours}
                    onChange={(e) => setAttendanceSettings({ ...attendanceSettings, basicHours: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Workdays</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
                      <label key={d} className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={attendanceSettings.workdaySelection.includes(d)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...attendanceSettings.workdaySelection, d]
                              : attendanceSettings.workdaySelection.filter(x => x !== d)
                            setAttendanceSettings({ ...attendanceSettings, workdaySelection: next })
                          }}
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Weekends</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
                      <label key={d} className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={attendanceSettings.weekendSelection.includes(d)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...attendanceSettings.weekendSelection, d]
                              : attendanceSettings.weekendSelection.filter(x => x !== d)
                            setAttendanceSettings({ ...attendanceSettings, weekendSelection: next })
                          }}
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Shift 1 Start</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.shift1Start}
                    onChange={(e) => setAttendanceSettings({ ...attendanceSettings, shift1Start: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Shift 1 End</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.shift1End}
                    onChange={(e) => setAttendanceSettings({ ...attendanceSettings, shift1End: e.target.value })}
                  />
                  <label className="flex items-center gap-2 text-sm mt-1">
                    <input
                      type="checkbox"
                      checked={attendanceSettings.shift1NextDay}
                      onChange={(e) => setAttendanceSettings({ ...attendanceSettings, shift1NextDay: e.target.checked })}
                    />
                    Ends next day
                  </label>
                </div>
                <div>
                  <Label>Shift 2 Start</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.shift2Start}
                    onChange={(e) => setAttendanceSettings({ ...attendanceSettings, shift2Start: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Shift 2 End</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.shift2End}
                    onChange={(e) => setAttendanceSettings({ ...attendanceSettings, shift2End: e.target.value })}
                  />
                  <label className="flex items-center gap-2 text-sm mt-1">
                    <input
                      type="checkbox"
                      checked={attendanceSettings.shift2NextDay}
                      onChange={(e) => setAttendanceSettings({ ...attendanceSettings, shift2NextDay: e.target.checked })}
                    />
                    Ends next day
                  </label>
                </div>
                <div>
                  <Label>Shift 1 Lunch Hours</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={attendanceSettings.lunch1Hours}
                    onChange={(e) => setAttendanceSettings({ ...attendanceSettings, lunch1Hours: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Shift 2 Lunch Hours</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={attendanceSettings.lunch2Hours}
                    onChange={(e) => setAttendanceSettings({ ...attendanceSettings, lunch2Hours: Number(e.target.value) })}
                  />
                </div>
              </div>
              {showAttendanceForm && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Scope</Label>
                    <select
                      value={attendanceScope}
                      onChange={(e) => setAttendanceScope(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="single">Single worker</option>
                      <option value="filtered">All filtered workers ({filteredWorkers.length})</option>
                      <option value="multi">Choose workers</option>
                    </select>
                  </div>
                  <div>
                    <Label>Shift</Label>
                    <select
                      value={attendanceForm.shift}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, shift: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="shift1">Shift 1</option>
                      <option value="shift2">Shift 2</option>
                    </select>
                  </div>
                  <div>
                    <Label>Worker</Label>
                    {attendanceScope === 'single' && (
                      <select
                        value={attendanceForm.workerId}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, workerId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      >
                        <option value="">Select worker...</option>
                        {workers.map((w) => (
                          <option key={w.id} value={w.id}>{w.name} - {w.qid}</option>
                        ))}
                      </select>
                    )}
                    {attendanceScope === 'multi' && (
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                        {filteredWorkers.map((w) => (
                          <label key={w.id} className="flex items-center gap-2 text-sm py-1">
                            <input
                              type="checkbox"
                              checked={selectedWorkerIds.includes(w.id)}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...selectedWorkerIds, w.id]
                                  : selectedWorkerIds.filter(id => id !== w.id)
                                setSelectedWorkerIds(next)
                              }}
                            />
                            <span>{w.name} ({w.qid})</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {attendanceScope === 'filtered' && (
                      <div className="text-sm text-slate-600 mt-2">Will apply to {filteredWorkers.length} filtered workers</div>
                    )}
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select
                      value={attendanceForm.status}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="HALF_DAY">Half Day</option>
                      <option value="LEAVE">Leave</option>
                      <option value="HOLIDAY">Holiday</option>
                    </select>
                  </div>
                  <div>
                    <Label>Check In</Label>
                    <Input type="datetime-local" value={attendanceForm.checkIn} onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })} />
                  </div>
                  <div>
                    <Label>Check Out</Label>
                    <Input type="datetime-local" value={attendanceForm.checkOut} onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })} />
                  </div>
                  <div>
                    <Label>Work Hours</Label>
                    <Input type="number" step="0.1" value={attendanceForm.workHours} onChange={(e) => setAttendanceForm({ ...attendanceForm, workHours: e.target.value })} />
                  </div>
                  <div>
                    <Label>Overtime Hours</Label>
                    <Input type="number" step="0.1" value={attendanceForm.overtimeHours} onChange={(e) => setAttendanceForm({ ...attendanceForm, overtimeHours: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea rows={2} value={attendanceForm.notes} onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={submitAttendance}>Save Attendance</Button>
                    <Button variant="outline" onClick={() => setShowAttendanceForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Worker</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Check In</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Check Out</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Overtime</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {attendances.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-slate-500">No attendance records yet.</td>
                      </tr>
                    )}
                    {attendances.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-slate-900">{att.worker?.name || 'Unknown'}</div>
                          <div className="text-xs text-slate-500">{att.worker?.qid}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{new Date(att.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">{att.status}</td>
                        <td className="px-4 py-3 text-sm">{att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '-'}</td>
                        <td className="px-4 py-3 text-sm">{att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : '-'}</td>
                        <td className="px-4 py-3 text-sm">{att.workHours ?? '-'}</td>
                        <td className="px-4 py-3 text-sm">{att.overtimeHours ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{att.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'salary' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Salary Records
                </CardTitle>
                <Button variant="outline" onClick={() => setShowSalaryForm((s) => !s)}>
                  {showSalaryForm ? 'Close Form' : 'Add Salary'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 p-3 border rounded-lg bg-slate-50">
                <div>
                  <Label>Basic Hours</Label>
                  <Input
                    type="number"
                    value={salarySettings.basicHours}
                    onChange={(e) => setSalarySettings({ ...salarySettings, basicHours: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Months / Year</Label>
                  <Input
                    type="number"
                    value={salarySettings.monthsPerYear}
                    onChange={(e) => setSalarySettings({ ...salarySettings, monthsPerYear: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Weekday OT Factor</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={salarySettings.weekdayFactor}
                    onChange={(e) => setSalarySettings({ ...salarySettings, weekdayFactor: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Weekend OT Factor</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={salarySettings.weekendFactor}
                    onChange={(e) => setSalarySettings({ ...salarySettings, weekendFactor: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Holiday OT Factor</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={salarySettings.holidayFactor}
                    onChange={(e) => setSalarySettings({ ...salarySettings, holidayFactor: Number(e.target.value) })}
                  />
                </div>
              </div>
              {showSalaryForm && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Worker</Label>
                    <select
                      value={salaryForm.workerId}
                      onChange={(e) => setSalaryForm({ ...salaryForm, workerId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">Select worker...</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>{w.name} - {w.qid}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Month</Label>
                    <Input type="month" value={salaryForm.month} onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })} />
                  </div>
                  <div>
                    <Label>Basic Salary</Label>
                    <Input type="number" value={salaryForm.basicSalary} onChange={(e) => setSalaryForm({ ...salaryForm, basicSalary: e.target.value })} />
                  </div>
                  <div>
                    <Label>Overtime Hours</Label>
                    <Input type="number" step="0.1" value={salaryForm.overtimeHours} onChange={(e) => setSalaryForm({ ...salaryForm, overtimeHours: e.target.value })} />
                  </div>
                  <div>
                    <Label>Allowances</Label>
                    <Input type="number" step="0.01" value={salaryForm.allowances} onChange={(e) => setSalaryForm({ ...salaryForm, allowances: e.target.value })} />
                  </div>
                  <div>
                    <Label>Deductions</Label>
                    <Input type="number" step="0.01" value={salaryForm.deductions} onChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.target.value })} />
                  </div>
                  <div>
                    <Label>Day Type</Label>
                    <select
                      value={salaryForm.paymentStatus}
                      onChange={(e) => setSalaryForm({ ...salaryForm, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="weekday">Weekday</option>
                      <option value="weekend">Weekend</option>
                      <option value="holiday">Holiday</option>
                    </select>
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Input value={salaryForm.paymentMethod} onChange={(e) => setSalaryForm({ ...salaryForm, paymentMethod: e.target.value })} />
                  </div>
                  <div>
                    <Label>Paid Date</Label>
                    <Input type="date" value={salaryForm.paidDate} onChange={(e) => setSalaryForm({ ...salaryForm, paidDate: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea rows={2} value={salaryForm.notes} onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })} />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={submitSalary}>Save Salary</Button>
                    <Button variant="outline" onClick={() => setShowSalaryForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Worker</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Month</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Basic</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Overtime</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Allowances</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Deductions</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {salaries.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-slate-500">No salary records yet.</td>
                      </tr>
                    )}
                    {salaries.map((sal) => (
                      <tr key={sal.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-slate-900">{sal.worker?.name || 'Unknown'}</div>
                          <div className="text-xs text-slate-500">{sal.worker?.profession}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{sal.month}</td>
                        <td className="px-4 py-3 text-sm">{sal.basicSalary}</td>
                        <td className="px-4 py-3 text-sm">{sal.overtimePay} ({sal.overtimeHours}h @ {sal.overtimeRate})</td>
                        <td className="px-4 py-3 text-sm">{sal.allowances}</td>
                        <td className="px-4 py-3 text-sm">{sal.deductions}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{sal.totalSalary}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            sal.paymentStatus === 'holiday' ? 'bg-purple-100 text-purple-700' :
                            sal.paymentStatus === 'weekend' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {sal.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
