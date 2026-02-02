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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filter, setFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [resetPasswordModal, setResetPasswordModal] = useState<{ userId: string; newPassword: string; confirmPassword: string; loading: boolean; error: string; message: string } | null>(null)
  const [emailSettings, setEmailSettings] = useState({
    host: '',
    port: '',
    user: '',
    from: '',
    secure: true,
    password: '',
    hasPassword: false,
    source: 'env',
    updatedBy: '' as string | null,
    updatedAt: '' as string | null,
  })
  const [emailSettingsLoading, setEmailSettingsLoading] = useState(false)
  const [emailSettingsSaving, setEmailSettingsSaving] = useState(false)
  const [emailSettingsError, setEmailSettingsError] = useState('')
  const [emailSettingsMessage, setEmailSettingsMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchUsers()
      loadEmailSettings()
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

  const loadEmailSettings = async () => {
    setEmailSettingsLoading(true)
    setEmailSettingsError('')
    try {
      const res = await fetch('/api/admin/email-settings')
      const data = await res.json()

      if (!res.ok) {
        setEmailSettingsError(data.error || 'Failed to load SMTP settings')
        return
      }

      const cfg = data.config || data.envDefaults || {}
      setEmailSettings((prev) => ({
        ...prev,
        host: cfg.host || '',
        port: cfg.port ? String(cfg.port) : '',
        user: cfg.user || '',
        from: cfg.from || '',
        secure: typeof cfg.secure === 'boolean' ? cfg.secure : true,
        password: '',
        hasPassword: Boolean(cfg.hasPassword),
        source: data.source || 'env',
        updatedBy: cfg.updatedBy || null,
        updatedAt: cfg.updatedAt || null,
      }))
    } catch (error) {
      console.error('Failed to load SMTP settings:', error)
      setEmailSettingsError('Failed to load SMTP settings')
    } finally {
      setEmailSettingsLoading(false)
    }
  }

  const handleSaveEmailSettings = async (event: React.FormEvent) => {
    event.preventDefault()
    setEmailSettingsError('')
    setEmailSettingsMessage('')
    setEmailSettingsSaving(true)

    try {
      const payload: any = {
        host: emailSettings.host || null,
        port: emailSettings.port ? Number(emailSettings.port) : null,
        user: emailSettings.user || null,
        from: emailSettings.from || emailSettings.user || null,
        secure: emailSettings.secure,
      }

      if (emailSettings.password) {
        payload.password = emailSettings.password
      }

      const res = await fetch('/api/admin/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setEmailSettingsError(data.error || 'Failed to save SMTP settings')
        return
      }

      setEmailSettingsMessage(data.message || 'SMTP settings saved')
      setEmailSettings((prev) => ({ ...prev, password: '' }))
      await loadEmailSettings()
    } catch (error) {
      console.error('Failed to save SMTP settings:', error)
      setEmailSettingsError('Failed to save SMTP settings')
    } finally {
      setEmailSettingsSaving(false)
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
        setResetPasswordModal(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update user')
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

        {/* SMTP Settings */}
        <Card className="mb-3 border-blue-100">
          <CardHeader className="py-3 bg-blue-50">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              SMTP Email Configuration (Admin Only)
            </CardTitle>
            <CardDescription className="text-xs">
              Configure email settings for password resets and notifications. Database settings override environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {emailSettingsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <form onSubmit={handleSaveEmailSettings} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">SMTP Host</Label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com"
                      value={emailSettings.host}
                      onChange={(e) => setEmailSettings({ ...emailSettings, host: e.target.value })}
                      className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">SMTP Port</Label>
                    <input
                      type="number"
                      placeholder="465 or 587"
                      value={emailSettings.port}
                      onChange={(e) => setEmailSettings({ ...emailSettings, port: e.target.value })}
                      className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">SMTP User (Email)</Label>
                    <input
                      type="email"
                      placeholder="info@nbtcqatar.com"
                      value={emailSettings.user}
                      onChange={(e) => setEmailSettings({ ...emailSettings, user: e.target.value })}
                      className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">From Email</Label>
                    <input
                      type="email"
                      placeholder="info@nbtcqatar.com"
                      value={emailSettings.from}
                      onChange={(e) => setEmailSettings({ ...emailSettings, from: e.target.value })}
                      className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Defaults to SMTP User if empty</p>
                  </div>
                  <div>
                    <Label className="text-xs">SMTP Password (App Password)</Label>
                    <input
                      type="password"
                      placeholder={emailSettings.hasPassword ? '••••••••' : 'Enter new password'}
                      value={emailSettings.password}
                      onChange={(e) => setEmailSettings({ ...emailSettings, password: e.target.value })}
                      className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      {emailSettings.hasPassword ? 'Leave blank to keep current password' : 'Use Google App Password for Workspace'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Security</Label>
                    <select
                      value={emailSettings.secure ? 'ssl' : 'tls'}
                      onChange={(e) => setEmailSettings({ ...emailSettings, secure: e.target.value === 'ssl' })}
                      className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="ssl">SSL (port 465)</option>
                      <option value="tls">STARTTLS (port 587)</option>
                    </select>
                  </div>
                </div>

                {emailSettingsError && (
                  <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    <span>{emailSettingsError}</span>
                  </div>
                )}

                {emailSettingsMessage && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                    <span>{emailSettingsMessage}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-600">
                    {emailSettings.source === 'db' ? (
                      <span className="text-green-600 font-semibold">✓ Using database settings</span>
                    ) : (
                      <span className="text-yellow-600">Using environment variables</span>
                    )}
                    {emailSettings.updatedBy && (
                      <span className="ml-2">
                        • Updated by {emailSettings.updatedBy}
                        {emailSettings.updatedAt && ` on ${new Date(emailSettings.updatedAt).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={emailSettingsSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                  >
                    {emailSettingsSaving ? 'Saving...' : 'Save SMTP Settings'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

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

                        <Button
                          size="sm"
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs h-8"
                          onClick={() => setResetPasswordModal({ userId: selectedUser.id, newPassword: '', confirmPassword: '', loading: false, error: '', message: '' })}
                        >
                          Reset User Password
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

        {/* Reset Password Modal */}
        {resetPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-lg">Reset User Password</CardTitle>
                <CardDescription>Set a new password for {selectedUser?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {resetPasswordModal.error && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                    {resetPasswordModal.error}
                  </div>
                )}
                {resetPasswordModal.message && (
                  <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                    {resetPasswordModal.message}
                  </div>
                )}
                <div>
                  <Label className="text-xs">New Password (minimum 8 characters)</Label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={resetPasswordModal.newPassword}
                    onChange={(e) => setResetPasswordModal({ ...resetPasswordModal, newPassword: e.target.value })}
                    disabled={resetPasswordModal.loading}
                    className="mt-1 w-full h-9 px-3 rounded-md border text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Confirm Password</Label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={resetPasswordModal.confirmPassword}
                    onChange={(e) => setResetPasswordModal({ ...resetPasswordModal, confirmPassword: e.target.value })}
                    disabled={resetPasswordModal.loading}
                    className="mt-1 w-full h-9 px-3 rounded-md border text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                    disabled={resetPasswordModal.loading || !resetPasswordModal.newPassword || !resetPasswordModal.confirmPassword}
                    onClick={async () => {
                      if (resetPasswordModal.newPassword !== resetPasswordModal.confirmPassword) {
                        setResetPasswordModal({ ...resetPasswordModal, error: 'Passwords do not match' })
                        return
                      }
                      if (resetPasswordModal.newPassword.length < 8) {
                        setResetPasswordModal({ ...resetPasswordModal, error: 'Password must be at least 8 characters' })
                        return
                      }
                      setResetPasswordModal({ ...resetPasswordModal, loading: true, error: '' })
                      try {
                        const res = await fetch('/api/users', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: resetPasswordModal.userId,
                            action: 'resetPassword',
                            newPassword: resetPasswordModal.newPassword
                          })
                        })
                        if (res.ok) {
                          setResetPasswordModal({ ...resetPasswordModal, loading: false, message: 'Password reset successfully', newPassword: '', confirmPassword: '' })
                          setTimeout(() => {
                            setResetPasswordModal(null)
                            fetchUsers()
                          }, 1500)
                        } else {
                          const data = await res.json()
                          setResetPasswordModal({ ...resetPasswordModal, loading: false, error: data.error || 'Failed to reset password' })
                        }
                      } catch (error) {
                        setResetPasswordModal({ ...resetPasswordModal, loading: false, error: 'Failed to reset password' })
                      }
                    }}
                  >
                    {resetPasswordModal.loading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={() => setResetPasswordModal(null)}
                    disabled={resetPasswordModal.loading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
