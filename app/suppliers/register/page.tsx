'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

interface SupplierForm {
  // Company Details
  name: string
  tradingName: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  website: string
  
  // Business Information
  category: string
  businessType: string
  yearEstablished: string
  
  // Registration Details
  crNumber: string
  taxId: string
  
  // Contact Person
  contactName: string
  contactRole: string
  contactEmail: string
  contactPhone: string
  
  // Additional
  paymentTerms: string
  leadTimeDays: string
  notes: string
}

interface DocumentFile {
  type: 'CR' | 'TAX_CARD' | 'ICV'
  file: File | null
  url?: string
  uploaded: boolean
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

const BUSINESS_TYPES = [
  'Manufacturer',
  'Distributor',
  'Wholesaler',
  'Retailer',
  'Service Provider',
  'Trading Company'
]

export default function RegisterSupplierPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const [form, setForm] = useState<SupplierForm>({
    name: '',
    tradingName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    website: '',
    category: '',
    businessType: '',
    yearEstablished: new Date().getFullYear().toString(),
    crNumber: '',
    taxId: '',
    contactName: '',
    contactRole: '',
    contactEmail: '',
    contactPhone: '',
    paymentTerms: 'Net 30',
    leadTimeDays: '14',
    notes: ''
  })

  const [documents, setDocuments] = useState<DocumentFile[]>([
    { type: 'CR', file: null, uploaded: false },
    { type: 'TAX_CARD', file: null, uploaded: false },
    { type: 'ICV', file: null, uploaded: false }
  ])

  const updateForm = (field: keyof SupplierForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (type: 'CR' | 'TAX_CARD' | 'ICV', file: File | null) => {
    setDocuments(prev => prev.map(d => 
      d.type === type ? { ...d, file } : d
    ))
  }

  const uploadDocument = async (type: 'CR' | 'TAX_CARD' | 'ICV') => {
    const doc = documents.find(d => d.type === type)
    if (!doc?.file) {
      setMessage('Please select a file to upload')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', doc.file)
      formData.append('type', type)
      
      // For now, simulate upload - you would send to actual API
      const url = `document-${type}-${Date.now()}.pdf`
      
      setDocuments(prev => prev.map(d => 
        d.type === type ? { ...d, url, uploaded: true } : d
      ))
      setMessage(`${type} uploaded successfully`)
    } catch (error) {
      console.error('Upload failed:', error)
      setMessage('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    setLoading(true)
    try {
      const payload = {
        ...form,
        yearEstablished: parseInt(form.yearEstablished),
        leadTimeDays: parseInt(form.leadTimeDays),
        crDocumentUrl: documents.find(d => d.type === 'CR')?.url || null,
        taxCardUrl: documents.find(d => d.type === 'TAX_CARD')?.url || null,
        icvUrl: documents.find(d => d.type === 'ICV')?.url || null,
        contact: {
          name: form.contactName,
          role: form.contactRole,
          email: form.contactEmail,
          phone: form.contactPhone,
          isPrimary: true
        }
      }

      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Registration failed')
      }

      const created = await res.json()
      setMessage('Supplier registered successfully!')
      setTimeout(() => router.push(`/suppliers/${created.id}`), 1500)
    } catch (error) {
      console.error('Registration failed:', error)
      setMessage(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch(step) {
      case 0: return form.name && form.email && form.phone && form.category && form.businessType
      case 1: return form.crNumber && form.taxId
      case 2: return form.contactName && form.contactEmail
      case 3: return true
      default: return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Register as Supplier</h1>
          <p className="text-slate-600 mt-2">Complete all steps to register your company</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {['Company Info', 'Documents', 'Contact', 'Review'].map((label, i) => (
              <div key={i} className="flex-1">
                <div className={`h-2 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-slate-300'}`} />
                <p className="text-xs font-medium text-slate-600 mt-1 text-center">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {message.includes('success') ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-sm">{message}</span>
          </div>
        )}

        {/* Step 0: Company Information */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Tell us about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Company Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="Full company name"
                  />
                </div>
                <div>
                  <Label className="font-medium">Trading Name</Label>
                  <Input
                    value={form.tradingName}
                    onChange={(e) => updateForm('tradingName', e.target.value)}
                    placeholder="Trading/Brand name (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="company@example.com"
                  />
                </div>
                <div>
                  <Label className="font-medium">Phone *</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="+974 4433 1234"
                  />
                </div>
              </div>

              <div>
                <Label className="font-medium">Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => updateForm('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label className="font-medium">Address *</Label>
                <Input
                  value={form.address}
                  onChange={(e) => updateForm('address', e.target.value)}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">City *</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                    placeholder="Doha"
                  />
                </div>
                <div>
                  <Label className="font-medium">Country *</Label>
                  <Input
                    value={form.country}
                    onChange={(e) => updateForm('country', e.target.value)}
                    placeholder="Qatar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Category *</Label>
                  <Select value={form.category} onChange={(e) => updateForm('category', e.target.value)}>
                    <option value="">-- Select Category --</option>
                    {SUPPLIER_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label className="font-medium">Business Type *</Label>
                  <Select value={form.businessType} onChange={(e) => updateForm('businessType', e.target.value)}>
                    <option value="">-- Select Type --</option>
                    {BUSINESS_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <Label className="font-medium">Year Established</Label>
                <Input
                  type="number"
                  value={form.yearEstablished}
                  onChange={(e) => updateForm('yearEstablished', e.target.value)}
                  placeholder="2020"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Registration Documents */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Registration & Documents</CardTitle>
              <CardDescription>Upload your business documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">CR Number *</Label>
                  <Input
                    value={form.crNumber}
                    onChange={(e) => updateForm('crNumber', e.target.value)}
                    placeholder="Commercial Registration Number"
                  />
                </div>
                <div>
                  <Label className="font-medium">Tax ID / TRN *</Label>
                  <Input
                    value={form.taxId}
                    onChange={(e) => updateForm('taxId', e.target.value)}
                    placeholder="Tax Registration Number"
                  />
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold">Document Uploads</h3>

                {/* CR Document */}
                <div className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Commercial Registration (CR)</p>
                      <p className="text-sm text-slate-600">PDF, JPG, PNG (Max 5MB)</p>
                    </div>
                    {documents.find(d => d.type === 'CR')?.uploaded && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={(e) => handleFileSelect('CR', e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={loading}
                    />
                    <Button
                      onClick={() => uploadDocument('CR')}
                      disabled={!documents.find(d => d.type === 'CR')?.file || loading}
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                  </div>
                </div>

                {/* Tax Card */}
                <div className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Tax Card / Tax ID Document</p>
                      <p className="text-sm text-slate-600">PDF, JPG, PNG (Max 5MB)</p>
                    </div>
                    {documents.find(d => d.type === 'TAX_CARD')?.uploaded && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={(e) => handleFileSelect('TAX_CARD', e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={loading}
                    />
                    <Button
                      onClick={() => uploadDocument('TAX_CARD')}
                      disabled={!documents.find(d => d.type === 'TAX_CARD')?.file || loading}
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                  </div>
                </div>

                {/* ICV Certificate */}
                <div className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">ICV Certificate (Optional)</p>
                      <p className="text-sm text-slate-600">PDF, JPG, PNG (Max 5MB)</p>
                    </div>
                    {documents.find(d => d.type === 'ICV')?.uploaded && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={(e) => handleFileSelect('ICV', e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={loading}
                    />
                    <Button
                      onClick={() => uploadDocument('ICV')}
                      disabled={!documents.find(d => d.type === 'ICV')?.file || loading}
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contact Person */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Primary Contact Person</CardTitle>
              <CardDescription>Who should we contact for inquiries?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Full Name *</Label>
                  <Input
                    value={form.contactName}
                    onChange={(e) => updateForm('contactName', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label className="font-medium">Role/Position *</Label>
                  <Input
                    value={form.contactRole}
                    onChange={(e) => updateForm('contactRole', e.target.value)}
                    placeholder="Sales Manager"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Email *</Label>
                  <Input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => updateForm('contactEmail', e.target.value)}
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <Label className="font-medium">Phone *</Label>
                  <Input
                    value={form.contactPhone}
                    onChange={(e) => updateForm('contactPhone', e.target.value)}
                    placeholder="+974 5555 1234"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Business Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Payment Terms</Label>
                    <Input
                      value={form.paymentTerms}
                      onChange={(e) => updateForm('paymentTerms', e.target.value)}
                      placeholder="e.g., Net 30, Cash on Delivery"
                    />
                  </div>
                  <div>
                    <Label className="font-medium">Lead Time (Days)</Label>
                    <Input
                      type="number"
                      value={form.leadTimeDays}
                      onChange={(e) => updateForm('leadTimeDays', e.target.value)}
                      placeholder="14"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="font-medium">Additional Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  placeholder="Any additional information about your company..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Information</CardTitle>
              <CardDescription>Please verify all details before submitting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm text-slate-600 mb-3">Company Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Company:</span> {form.name}</p>
                    <p><span className="font-medium">Trading:</span> {form.tradingName || '-'}</p>
                    <p><span className="font-medium">Email:</span> {form.email}</p>
                    <p><span className="font-medium">Phone:</span> {form.phone}</p>
                    <p><span className="font-medium">Category:</span> {form.category}</p>
                    <p><span className="font-medium">Type:</span> {form.businessType}</p>
                    <p><span className="font-medium">CR Number:</span> {form.crNumber}</p>
                    <p><span className="font-medium">Tax ID:</span> {form.taxId}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-slate-600 mb-3">Contact & Terms</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Contact:</span> {form.contactName}</p>
                    <p><span className="font-medium">Role:</span> {form.contactRole}</p>
                    <p><span className="font-medium">Email:</span> {form.contactEmail}</p>
                    <p><span className="font-medium">Phone:</span> {form.contactPhone}</p>
                    <p><span className="font-medium">Payment:</span> {form.paymentTerms}</p>
                    <p><span className="font-medium">Lead Time:</span> {form.leadTimeDays} days</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-sm text-slate-600 mb-3">Documents Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Commercial Registration (CR)</span>
                    <span className={documents.find(d => d.type === 'CR')?.uploaded ? 'text-green-600 font-medium' : 'text-amber-600'}>
                      {documents.find(d => d.type === 'CR')?.uploaded ? '✓ Uploaded' : '⚠ Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tax Card / Tax ID</span>
                    <span className={documents.find(d => d.type === 'TAX_CARD')?.uploaded ? 'text-green-600 font-medium' : 'text-amber-600'}>
                      {documents.find(d => d.type === 'TAX_CARD')?.uploaded ? '✓ Uploaded' : '⚠ Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ICV Certificate</span>
                    <span className={documents.find(d => d.type === 'ICV')?.uploaded ? 'text-green-600 font-medium' : 'text-slate-500'}>
                      {documents.find(d => d.type === 'ICV')?.uploaded ? '✓ Uploaded' : '○ Optional'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  By submitting this form, you confirm that all information is accurate and complete. Your supplier profile will be reviewed within 2-3 business days.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              disabled={loading}
            >
              Previous
            </Button>
          )}
          
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed() || loading}
              className="ml-auto"
            >
              Next
            </Button>
          ) : (
            <>
              <Button
                onClick={submit}
                disabled={loading}
                className="ml-auto bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </Button>
              <Button
                onClick={() => router.back()}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}