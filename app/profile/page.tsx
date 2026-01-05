'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  qid: string | null
  joiningDate: string | null
  department: string | null
  position: string | null
  phone: string | null
  bankDetails: string | null
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bankDetails, setBankDetails] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    if (status === 'authenticated') {
      fetchUserProfile()
    }
  }, [status, router])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/users/me')
      const data = await res.json()
      setUser(data)
      setBankDetails(data.bankDetails || `DUKHAN BANK QATAR
A/C no: 10000 1771 788
IBAN no: QA25BKWA000000010001771788
DOHA BRANCH`)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      setLoading(false)
    }
  }

  const handleSaveBankDetails = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankDetails })
      })

      if (res.ok) {
        alert('Bank details updated successfully!')
        fetchUserProfile()
      } else {
        alert('Failed to update bank details')
      }
    } catch (error) {
      console.error('Failed to update bank details:', error)
      alert('Failed to update bank details')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading profile...</div>
  }

  if (!user) {
    return <div className="p-8">User not found</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>

      <div className="space-y-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={user.name} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={user.role} disabled className="capitalize" />
              </div>
              <div>
                <Label>Department</Label>
                <Input value={user.department || 'N/A'} disabled />
              </div>
              <div>
                <Label>Position</Label>
                <Input value={user.position || 'N/A'} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={user.phone || 'N/A'} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details for Invoicing</CardTitle>
            <p className="text-sm text-gray-600">
              These bank details will automatically appear on all invoices you create.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Bank Details *</Label>
              <Textarea
                rows={6}
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="Enter bank details...&#10;&#10;Example:&#10;DUKHAN BANK QATAR&#10;A/C no: 10000 1771 788&#10;IBAN no: QA25BKWA000000010001771788&#10;DOHA BRANCH"
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={handleSaveBankDetails} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Bank Details'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
