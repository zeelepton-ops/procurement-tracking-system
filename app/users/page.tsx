'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Users, UserCheck, UserX, Shield, Eye, Clock } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  status: string
  qid: string | null
  joiningDate: string | null
  department: string | null
  position: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
  approvedBy: string | null
  approvedAt: string | null
}

export default function UsersManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<any | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchUsers()
    }
  }, [status, session, router])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: string, value?: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, action, ...value })
      })

      if (res.ok) {
        await fetchUsers()
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('Failed to update user')
    }
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'PENDING') return user.status === 'PENDING'
    if (filter === 'APPROVED') return user.status === 'APPROVED'
    if (filter === 'REJECTED') return user.status === 'REJECTED'
    if (filter === 'INACTIVE') return !user.isActive
    return true
  })

  const getStatusColor = (status: string) => {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700'
    if (status === 'REJECTED') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  const getRoleColor = (role: string) => {
    if (role === 'ADMIN') return 'bg-purple-100 text-purple-700'
    if (role === 'MANAGER') return 'bg-blue-100 text-blue-700'
    if (role === 'VIEWER') return 'bg-slate-100 text-slate-700'
    return 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const pendingCount = users.filter(u => u.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-0.5">User Management</h1>
            <p className="text-slate-600 text-sm">Manage user accounts and permissions</p>
          </div>
          {pendingCount > 0 && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-700" />
              <span className="text-sm font-semibold text-yellow-700">{pendingCount} Pending Approvals</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Total Users</p>
                  <p className="text-xl font-bold text-slate-900">{users.length}</p>
                </div>
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Pending</p>
                  <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Approved</p>
                  <p className="text-xl font-bold text-green-600">
                    {users.filter(u => u.status === 'APPROVED').length}
                  </p>
                </div>
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Admins</p>
                  <p className="text-xl font-bold text-purple-600">
                    {users.filter(u => u.role === 'ADMIN').length}
                  </p>
                </div>
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-3 flex gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'INACTIVE'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="text-xs"
            >
              {f}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Users List */}
          <div className="lg:col-span-2">
            <Card className="border border-slate-200">
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Users ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`grid grid-cols-12 items-center gap-2 px-3 py-2 text-[12px] cursor-pointer hover:bg-blue-50 ${
                        selectedUser?.id === user.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="col-span-4">
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-500">{user.email}</div>
                      </div>
                      <div className="col-span-3 truncate">
                        <div className="text-slate-700">{user.department || '—'}</div>
                        <div className="text-[11px] text-slate-500">{user.position || '—'}</div>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Eye className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Details Panel */}
          <div className="lg:col-span-1">
            {selectedUser ? (
              <Card className="border-blue-100">
                <CardHeader className="py-3 bg-blue-50">
                  <CardTitle className="text-lg text-blue-900">User Details</CardTitle>
                  <CardDescription className="text-sm">{selectedUser.email}</CardDescription>
                </CardHeader>
                <CardContent className="p-3 space-y-3 text-sm">
                  <div>
                    <Label className="text-xs text-slate-600">Name</Label>
                    <div className="flex gap-2 items-center">
                      <p className="font-medium">{selectedUser.name}</p>
                      <Button size="sm" variant="outline" className="text-xs py-1" onClick={() => setEditingUser(selectedUser)}>Edit</Button>
                    </div>
                  </div>

                  {selectedUser.qid && (!editingUser || editingUser.id !== selectedUser.id) && (
                    <div>
                      <Label className="text-xs text-slate-600">QID</Label>
                      <p>{selectedUser.qid}</p>
                    </div>
                  )}

                  {editingUser && editingUser.id === selectedUser.id && (
                    <div>
                      <Label className="text-xs text-slate-600">QID</Label>
                      <input value={(editingUser as any).qid || ''} onChange={(e) => setEditingUser({ ...editingUser, qid: e.target.value })} className="mt-1 h-9 w-full rounded-md border px-2" />
                    </div>
                  )}

                  {selectedUser.department && (!editingUser || editingUser.id !== selectedUser.id) && (
                    <div>
                      <Label className="text-xs text-slate-600">Department</Label>
                      <p>{selectedUser.department}</p>
                    </div>
                  )}

                  {editingUser && editingUser.id === selectedUser.id && (
                    <div>
                      <Label className="text-xs text-slate-600">Department</Label>
                      <input value={(editingUser as any).department || ''} onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })} className="mt-1 h-9 w-full rounded-md border px-2" />
                    </div>
                  )}

                  {selectedUser.position && (!editingUser || editingUser.id !== selectedUser.id) && (
                    <div>
                      <Label className="text-xs text-slate-600">Position</Label>
                      <p>{selectedUser.position}</p>
                    </div>
                  )}

                  {editingUser && editingUser.id === selectedUser.id && (
                    <div>
                      <Label className="text-xs text-slate-600">Position</Label>
                      <input value={(editingUser as any).position || ''} onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })} className="mt-1 h-9 w-full rounded-md border px-2" />
                    </div>
                  )}

                  {selectedUser.phone && (!editingUser || editingUser.id !== selectedUser.id) && (
                    <div>
                      <Label className="text-xs text-slate-600">Phone</Label>
                      <p>{selectedUser.phone}</p>
                    </div>
                  )}

                  {editingUser && editingUser.id === selectedUser.id && (
                    <div>
                      <Label className="text-xs text-slate-600">Phone</Label>
                      <input value={(editingUser as any).phone || ''} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} className="mt-1 h-9 w-full rounded-md border px-2" />
                    </div>
                  )}

                  {selectedUser.joiningDate && (!editingUser || editingUser.id !== selectedUser.id) && (
                    <div>
                      <Label className="text-xs text-slate-600">Joining Date</Label>
                      <p>{new Date(selectedUser.joiningDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  {editingUser && editingUser.id === selectedUser.id && (
                    <div>
                      <Label className="text-xs text-slate-600">Joining Date</Label>
                      <input type="date" value={(editingUser as any).joiningDate ? new Date((editingUser as any).joiningDate).toISOString().slice(0,10) : ''} onChange={(e) => setEditingUser({ ...editingUser, joiningDate: e.target.value })} className="mt-1 h-9 w-full rounded-md border px-2" />
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-slate-600">Registered</Label>
                    <p className="text-xs">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>

                  {editingUser && editingUser.id === selectedUser.id && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-8" onClick={async () => {
                        // Save changes
                        const data = (editingUser as any)
                        await handleUserAction(selectedUser.id, 'update', {
                          name: data.name,
                          qid: data.qid,
                          joiningDate: data.joiningDate,
                          department: data.department,
                          position: data.position,
                          phone: data.phone
                        })
                        // Refresh list and selected user
                        await fetchUsers()
                        const usersData = await (await fetch('/api/users')).json()
                        const updated = usersData.find((u:any) => u.id === selectedUser.id)
                        setSelectedUser(updated)
                        setEditingUser(null)
                      }}>Save</Button>

                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => {
                        // Cancel edit
                        setEditingUser(null)
                        fetchUsers()
                      }}>Cancel</Button>
                    </div>
                  )}

                  <hr />

                  {/* Actions */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Actions</Label>

                    {selectedUser.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                          onClick={() => handleUserAction(selectedUser.id, 'approve')}
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 text-xs h-8"
                          onClick={() => handleUserAction(selectedUser.id, 'reject')}
                        >
                          <UserX className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {selectedUser.status === 'APPROVED' && selectedUser.email !== 'info@nbtcqatar.com' && (
                      <>
                        <div>
                          <Label className="text-xs text-slate-600 mb-1 block">Change Role</Label>
                          <select
                            className="w-full h-8 px-2 rounded-md border border-slate-300 text-xs"
                            value={selectedUser.role}
                            onChange={(e) => handleUserAction(selectedUser.id, 'update', { role: e.target.value })}
                          >
                            <option value="USER">User</option>
                            <option value="MANAGER">Manager</option>
                            <option value="VIEWER">Viewer</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-8"
                          onClick={() => handleUserAction(selectedUser.id, 'update', { isActive: !selectedUser.isActive })}
                        >
                          {selectedUser.isActive ? 'Deactivate Account' : 'Activate Account'}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-64 flex items-center justify-center">
                <CardContent>
                  <p className="text-slate-500 text-center text-sm">
                    Select a user to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
