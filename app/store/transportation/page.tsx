'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bus, Users, Calendar, Plus, Edit, Trash2, Play } from 'lucide-react'

type Worker = {
  id: string
  name: string
  qid?: string
  phone?: string
  shift: string
  priority: number
  department?: string
  position?: string
  isActive: boolean
}

type Vehicle = {
  id: string
  vehicleNumber: string
  vehicleName?: string
  seats: number
  vehicleType?: string
  isAvailable: boolean
  driver?: string
  driverPhone?: string
}

type Schedule = {
  id: string
  date: string
  shift: string
  worker: Worker
  vehicle: Vehicle
  pickupTime?: string
  dropTime?: string
  route?: string
  status: string
}

export default function TransportationPage() {
  const [activeTab, setActiveTab] = useState<'workers' | 'vehicles' | 'schedules'>('schedules')
  const [workers, setWorkers] = useState<Worker[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)

  // Worker form state
  const [workerForm, setWorkerForm] = useState({
    name: '',
    qid: '',
    phone: '',
    shift: 'DAY',
    priority: 0,
    department: '',
    position: ''
  })
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null)
  const [showWorkerForm, setShowWorkerForm] = useState(false)

  // Vehicle form state
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleName: '',
    seats: 0,
    vehicleType: 'BUS',
    driver: '',
    driverPhone: ''
  })
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [showVehicleForm, setShowVehicleForm] = useState(false)

  // Schedule filters
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduleShift, setScheduleShift] = useState('DAY')

  useEffect(() => {
    fetchWorkers()
    fetchVehicles()
    fetchSchedules()
  }, [])

  useEffect(() => {
    fetchSchedules()
  }, [scheduleDate, scheduleShift])

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/transportation/workers')
      const data = await res.json()
      setWorkers(data)
    } catch (error) {
      console.error('Failed to fetch workers:', error)
    }
  }

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/transportation/vehicles')
      const data = await res.json()
      setVehicles(data)
    } catch (error) {
      console.error('Failed to fetch vehicles:', error)
    }
  }

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`/api/transportation/schedules?date=${scheduleDate}&shift=${scheduleShift}`)
      const data = await res.json()
      setSchedules(data)
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    }
  }

  const handleWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingWorkerId ? `/api/transportation/workers/${editingWorkerId}` : '/api/transportation/workers'
      const method = editingWorkerId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerForm)
      })

      if (res.ok) {
        await fetchWorkers()
        setWorkerForm({ name: '', qid: '', phone: '', shift: 'DAY', priority: 0, department: '', position: '' })
        setEditingWorkerId(null)
        setShowWorkerForm(false)
      }
    } catch (error) {
      console.error('Failed to save worker:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingVehicleId ? `/api/transportation/vehicles/${editingVehicleId}` : '/api/transportation/vehicles'
      const method = editingVehicleId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleForm)
      })

      if (res.ok) {
        await fetchVehicles()
        setVehicleForm({ vehicleNumber: '', vehicleName: '', seats: 0, vehicleType: 'BUS', driver: '', driverPhone: '' })
        setEditingVehicleId(null)
        setShowVehicleForm(false)
      }
    } catch (error) {
      console.error('Failed to save vehicle:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoGenerate = async () => {
    if (!confirm('This will generate a new schedule for the selected date and shift. Continue?')) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/transportation/schedules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: scheduleDate, shift: scheduleShift })
      })

      if (res.ok) {
        await fetchSchedules()
        alert('Schedule generated successfully!')
      } else {
        const error = await res.json()
        alert(`Failed to generate schedule: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to generate schedule:', error)
      alert('Failed to generate schedule')
    } finally {
      setLoading(false)
    }
  }

  const deleteWorker = async (id: string) => {
    if (!confirm('Are you sure you want to delete this worker?')) return
    try {
      await fetch(`/api/transportation/workers/${id}`, { method: 'DELETE' })
      await fetchWorkers()
    } catch (error) {
      console.error('Failed to delete worker:', error)
    }
  }

  const deleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return
    try {
      await fetch(`/api/transportation/vehicles/${id}`, { method: 'DELETE' })
      await fetchVehicles()
    } catch (error) {
      console.error('Failed to delete vehicle:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workers Transportation</h1>
          <p className="text-slate-600 text-sm">Schedule and manage transportation for day and night shifts</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'schedules' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedules
            </div>
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'workers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Workers
            </div>
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'vehicles' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Vehicles
            </div>
          </button>
        </div>

        {/* Schedules Tab */}
        {activeTab === 'schedules' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Shift</label>
                    <select
                      value={scheduleShift}
                      onChange={(e) => setScheduleShift(e.target.value)}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="DAY">Day Shift</option>
                      <option value="NIGHT">Night Shift</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAutoGenerate} disabled={loading} className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Auto Generate Schedule
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vehicle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Driver</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Workers</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pickup Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {schedules.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                            No schedules found. Click "Auto Generate Schedule" to create one.
                          </td>
                        </tr>
                      ) : (
                        // Group by vehicle
                        Object.entries(
                          schedules.reduce((acc, schedule) => {
                            const key = schedule.vehicle.id
                            if (!acc[key]) {
                              acc[key] = { vehicle: schedule.vehicle, workers: [], pickupTime: schedule.pickupTime }
                            }
                            acc[key].workers.push(schedule.worker)
                            return acc
                          }, {} as Record<string, { vehicle: Vehicle; workers: Worker[]; pickupTime?: string }>)
                        ).map(([key, { vehicle, workers, pickupTime }]) => (
                          <tr key={key}>
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium">{vehicle.vehicleNumber}</div>
                                <div className="text-sm text-slate-500">{vehicle.vehicleName} ({vehicle.seats} seats)</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{vehicle.driver || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm">
                                {workers.map(w => w.name).join(', ')}
                                <div className="text-slate-500 mt-1">
                                  {workers.length} / {vehicle.seats} workers
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{pickupTime || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                Scheduled
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Workers Tab */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowWorkerForm(!showWorkerForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Worker
              </Button>
            </div>

            {showWorkerForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingWorkerId ? 'Edit Worker' : 'Add New Worker'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleWorkerSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <Input
                          value={workerForm.name}
                          onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">QID</label>
                        <Input
                          value={workerForm.qid}
                          onChange={(e) => setWorkerForm({ ...workerForm, qid: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <Input
                          value={workerForm.phone}
                          onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Shift *</label>
                        <select
                          value={workerForm.shift}
                          onChange={(e) => setWorkerForm({ ...workerForm, shift: e.target.value })}
                          className="w-full border rounded-md px-3 py-2"
                          required
                        >
                          <option value="DAY">Day Shift</option>
                          <option value="NIGHT">Night Shift</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Priority (0-10)</label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={workerForm.priority}
                          onChange={(e) => setWorkerForm({ ...workerForm, priority: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Department</label>
                        <Input
                          value={workerForm.department}
                          onChange={(e) => setWorkerForm({ ...workerForm, department: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Position</label>
                        <Input
                          value={workerForm.position}
                          onChange={(e) => setWorkerForm({ ...workerForm, position: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        {editingWorkerId ? 'Update' : 'Add'} Worker
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowWorkerForm(false)
                          setEditingWorkerId(null)
                          setWorkerForm({ name: '', qid: '', phone: '', shift: 'DAY', priority: 0, department: '', position: '' })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">QID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Shift</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Priority</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {workers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                            No workers added yet
                          </td>
                        </tr>
                      ) : (
                        workers.map((worker) => (
                          <tr key={worker.id}>
                            <td className="px-4 py-3">
                              <div className="font-medium">{worker.name}</div>
                              {worker.phone && <div className="text-sm text-slate-500">{worker.phone}</div>}
                            </td>
                            <td className="px-4 py-3 text-sm">{worker.qid || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                worker.shift === 'DAY' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {worker.shift}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{worker.priority}</td>
                            <td className="px-4 py-3 text-sm">{worker.department || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setWorkerForm({
                                      name: worker.name,
                                      qid: worker.qid || '',
                                      phone: worker.phone || '',
                                      shift: worker.shift,
                                      priority: worker.priority,
                                      department: worker.department || '',
                                      position: worker.position || ''
                                    })
                                    setEditingWorkerId(worker.id)
                                    setShowWorkerForm(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteWorker(worker.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowVehicleForm(!showVehicleForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>

            {showVehicleForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingVehicleId ? 'Edit Vehicle' : 'Add New Vehicle'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVehicleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Vehicle Number *</label>
                        <Input
                          value={vehicleForm.vehicleNumber}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Vehicle Name</label>
                        <Input
                          value={vehicleForm.vehicleName}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Seats *</label>
                        <Input
                          type="number"
                          min="1"
                          value={vehicleForm.seats}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, seats: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Vehicle Type</label>
                        <select
                          value={vehicleForm.vehicleType}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                          className="w-full border rounded-md px-3 py-2"
                        >
                          <option value="BUS">Bus</option>
                          <option value="VAN">Van</option>
                          <option value="CAR">Car</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Driver Name</label>
                        <Input
                          value={vehicleForm.driver}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, driver: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Driver Phone</label>
                        <Input
                          value={vehicleForm.driverPhone}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        {editingVehicleId ? 'Update' : 'Add'} Vehicle
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowVehicleForm(false)
                          setEditingVehicleId(null)
                          setVehicleForm({ vehicleNumber: '', vehicleName: '', seats: 0, vehicleType: 'BUS', driver: '', driverPhone: '' })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vehicle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Seats</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Driver</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {vehicles.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                            No vehicles added yet
                          </td>
                        </tr>
                      ) : (
                        vehicles.map((vehicle) => (
                          <tr key={vehicle.id}>
                            <td className="px-4 py-3">
                              <div className="font-medium">{vehicle.vehicleNumber}</div>
                              {vehicle.vehicleName && <div className="text-sm text-slate-500">{vehicle.vehicleName}</div>}
                            </td>
                            <td className="px-4 py-3 text-sm">{vehicle.vehicleType}</td>
                            <td className="px-4 py-3 text-sm">{vehicle.seats}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm">{vehicle.driver || 'N/A'}</div>
                              {vehicle.driverPhone && <div className="text-xs text-slate-500">{vehicle.driverPhone}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                vehicle.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {vehicle.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setVehicleForm({
                                      vehicleNumber: vehicle.vehicleNumber,
                                      vehicleName: vehicle.vehicleName || '',
                                      seats: vehicle.seats,
                                      vehicleType: vehicle.vehicleType || 'BUS',
                                      driver: vehicle.driver || '',
                                      driverPhone: vehicle.driverPhone || ''
                                    })
                                    setEditingVehicleId(vehicle.id)
                                    setShowVehicleForm(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteVehicle(vehicle.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
