'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Upload, CheckCircle, AlertCircle, Building2, Save, Trash2 } from 'lucide-react'

const SUPPLIER_CATEGORIES = [
  'Steel & Metal Structures',
  'Equipment & Machinery',
  'Raw Materials',
  'Consumables & Supplies',
  'Construction Materials',
  'Electronics & Components',
  'Hardware & Fasteners',
  'Lubricants & Chemicals',
  'Services & Contracting',
  'Other'
]

const BUSINESS_TYPES = [
  'Manufacturer',
  'Distributor',
  'Wholesaler',
  'Importer',
  'Contractor',
  'Service Provider'
]

export default function SupplierRegistrationPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [hasDraft, setHasDraft] = useState(false)

  const [formData, setFormData] = useState({
    companyName: '',
    tradingName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Qatar',
    website: '',
    category: '',
    businessType: '',
    yearEstablished: new Date().getFullYear().toString(),
    numberOfEmployees: '',
    crNumber: '',
    crExpiry: '',
    taxIdNumber: '',
    taxIdExpiry: '',
    contactName: '',
    contactTitle: '',
    contactEmail: '',
    contactPhone: '',
    contactMobile: '',
    paymentTerms: 'Net 30',
    leadTimeDays: '14',
    minimumOrderValue: '',
    currency: 'QAR',
    bankName: '',
    accountHolder: '',
    iban: '',
    businessDescription: ''
  })

  const [documents, setDocuments] = useState({
    cr: null as File | null,
    taxCard: null as File | null,
    icv: null as File | null,
    bankDocument: null as File | null
  })

  const [uploads, setUploads] = useState({
    cr: false,
    taxCard: false,
    icv: false,
    bankDocument: false
  })

  // Load draft from localStorage on mount
  useEffect(() => {
    // Check if this is a new registration (not continuing draft)
    const isNewRegistration = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('new') === 'true'
    
    if (!isNewRegistration) {
      const savedDraft = localStorage.getItem('supplierRegistrationDraft')
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          setFormData(draft.formData)
          setUploads(draft.uploads)
          setStep(draft.step)
          setHasDraft(true)
        } catch (error) {
          console.error('Failed to load draft:', error)
        }
      }
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const handleFileSelect = (docType: keyof typeof documents, file: File | null) => {
    setDocuments(prev => ({ ...prev, [docType]: file }))
  }

  const uploadFile = async (docType: keyof typeof documents, label: string) => {
    const file = documents[docType]
    if (!file) {
      setMessage({ type: 'error', text: `Please select a file for ${label}` })
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setUploads(prev => ({ ...prev, [docType]: true }))
      setMessage({ type: 'success', text: `${label} uploaded successfully` })
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to upload ${label}` })
    } finally {
      setLoading(false)
    }
  }

  const validateStep = (stepNum: number): boolean => {
    const errors: Record<string, string> = {}

    switch (stepNum) {
      case 0:
        if (!formData.companyName) errors.companyName = 'Company name is required'
        if (!formData.email) errors.email = 'Email is required'
        if (!formData.phone) errors.phone = 'Phone number is required'
        if (!formData.address) errors.address = 'Street address is required'
        if (!formData.city) errors.city = 'City is required'
        if (!formData.category) errors.category = 'Category is required'
        if (!formData.businessType) errors.businessType = 'Business type is required'
        break
      case 1:
        // Documents are now optional
        break
      case 2:
        if (!formData.contactName) errors.contactName = 'Contact name is required'
        if (!formData.contactEmail) errors.contactEmail = 'Contact email is required'
        if (!formData.contactPhone) errors.contactPhone = 'Contact phone is required'
        break
      case 3:
        // Banking information is now optional
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateAllSteps = (): Record<string, { field: string; step: number; error: string }> => {
    const allErrors: Record<string, { field: string; step: number; error: string }> = {}

    // Step 0 - Company Information (Required)
    if (!formData.companyName) allErrors.companyName = { field: 'Company Name', step: 0, error: 'Company name is required' }
    if (!formData.email) allErrors.email = { field: 'Email Address', step: 0, error: 'Email is required' }
    if (!formData.phone) allErrors.phone = { field: 'Phone Number', step: 0, error: 'Phone number is required' }
    if (!formData.address) allErrors.address = { field: 'Street Address', step: 0, error: 'Street address is required' }
    if (!formData.city) allErrors.city = { field: 'City', step: 0, error: 'City is required' }
    if (!formData.category) allErrors.category = { field: 'Category', step: 0, error: 'Category is required' }
    if (!formData.businessType) allErrors.businessType = { field: 'Business Type', step: 0, error: 'Business type is required' }

    // Step 1 - Documents (Optional)

    // Step 2 - Contact Information (Required)
    if (!formData.contactName) allErrors.contactName = { field: 'Contact Name', step: 2, error: 'Contact name is required' }
    if (!formData.contactEmail) allErrors.contactEmail = { field: 'Contact Email', step: 2, error: 'Contact email is required' }
    if (!formData.contactPhone) allErrors.contactPhone = { field: 'Contact Phone', step: 2, error: 'Contact phone is required' }

    // Step 3 - Banking Information (Optional)

    return allErrors
  }

  const saveDraft = () => {
    const draft = {
      formData,
      uploads,
      step,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem('supplierRegistrationDraft', JSON.stringify(draft))
    setMessage({ 
      type: 'success', 
      text: 'Application saved as draft. You can continue later!' 
    })
  }

  const deleteDraft = () => {
    if (confirm('Are you sure you want to delete the saved draft?')) {
      localStorage.removeItem('supplierRegistrationDraft')
      setHasDraft(false)
      setMessage({ 
        type: 'success', 
        text: 'Draft deleted' 
      })
    }
  }

  const canProceedStep = (): boolean => {
    return validateStep(step)
  }

  const submitRegistration = async () => {
    // Clear any stale validation errors
    setValidationErrors({})
    
    // Validate ALL steps before submission
    const allErrors = validateAllSteps()
    if (Object.keys(allErrors).length > 0) {
      // Show detailed error message with missing fields
      const missingFields = Object.entries(allErrors)
        .map(([, info]) => info.field)
        .join(', ')
      setMessage({ 
        type: 'error', 
        text: `Missing required fields: ${missingFields}` 
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        yearEstablished: parseInt(formData.yearEstablished),
        leadTimeDays: parseInt(formData.leadTimeDays),
        numberOfEmployees: formData.numberOfEmployees ? parseInt(formData.numberOfEmployees) : null,
        documents: {
          crUrl: uploads.cr ? 'cr-document-url' : null,
          taxCardUrl: uploads.taxCard ? 'tax-card-url' : null,
          icvUrl: uploads.icv ? 'icv-url' : null,
          bankDocumentUrl: uploads.bankDocument ? 'bank-doc-url' : null
        },
        contact: {
          name: formData.contactName,
          title: formData.contactTitle,
          email: formData.contactEmail,
          phone: formData.contactPhone,
          mobile: formData.contactMobile,
          isPrimary: true
        },
        bankDetails: {
          bankName: formData.bankName,
          accountHolder: formData.accountHolder,
          iban: formData.iban
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

      // Clear draft on successful submission
      localStorage.removeItem('supplierRegistrationDraft')
      setHasDraft(false)

      setMessage({ 
        type: 'success', 
        text: 'Registration submitted successfully! Your application will be reviewed within 2-3 business days.' 
      })

      setTimeout(() => {
        router.push('/suppliers')
      }, 2000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Registration failed. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const getErrorMessage = (field: string) => {
    return validationErrors[field]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Supplier Registration</h1>
          <p className="text-lg text-slate-600">Register your company to supply materials and services</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {['Company Info', 'Documents', 'Contact', 'Banking', 'Review'].map((label, idx) => (
              <div key={idx} className="flex-1 px-1">
                <div className={`h-3 rounded-full transition-all ${idx <= step ? 'bg-blue-600' : 'bg-slate-300'}`} />
                <p className="text-xs font-semibold text-slate-600 mt-2 text-center">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <span className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {message.text}
            </span>
          </div>
        )}

        {/* Validation Errors Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border-2 border-red-400">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-2">❌ Please fill the following required fields:</h3>
                <ul className="space-y-1">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field} className="text-red-800 text-sm font-semibold flex items-center gap-2">
                      <span className="text-red-600">▸</span> {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Draft Indicator */}
        {hasDraft && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
            <p className="text-sm text-blue-900"><span className="font-semibold">✓ Draft Saved</span> Your application is saved as a draft</p>
            <Button
              onClick={deleteDraft}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete Draft
            </Button>
          </div>
        )}

        {/* Step 0: Company Information */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Company Information</CardTitle>
              <CardDescription>Provide basic information about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${getErrorMessage('companyName') ? 'bg-red-100 border border-red-500' : ''}`}>
                  <Label className={`font-semibold ${getErrorMessage('companyName') ? 'text-red-700' : ''}`}>
                    Company Name * {getErrorMessage('companyName') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('companyName')})</span>}
                  </Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Official company name"
                    className={`mt-2 ${getErrorMessage('companyName') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                  />
                </div>
                <div>
                  <Label className="font-semibold">Trading Name</Label>
                  <Input
                    value={formData.tradingName}
                    onChange={(e) => handleInputChange('tradingName', e.target.value)}
                    placeholder="Brand or trading name (optional)"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg ${getErrorMessage('email') ? 'bg-red-100 border border-red-500' : ''}`}>
                  <Label className={`font-semibold ${getErrorMessage('email') ? 'text-red-700' : ''}`}>
                    Email Address * {getErrorMessage('email') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('email')})</span>}
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="company@example.com"
                    className={`mt-2 ${getErrorMessage('email') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                  />
                </div>
                <div className={`p-3 rounded-lg ${getErrorMessage('phone') ? 'bg-red-100 border border-red-500' : ''}`}>
                  <Label className={`font-semibold ${getErrorMessage('phone') ? 'text-red-700' : ''}`}>
                    Phone Number * {getErrorMessage('phone') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('phone')})</span>}
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+974 4433 1234"
                    className={`mt-2 ${getErrorMessage('phone') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                  />
                </div>
              </div>

              <div className={`p-3 rounded-lg ${getErrorMessage('address') ? 'bg-red-100 border border-red-500' : ''}`}>
                <Label className={`font-semibold ${getErrorMessage('address') ? 'text-red-700' : ''}`}>
                  Street Address * {getErrorMessage('address') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('address')})</span>}
                </Label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Street address"
                  className={`mt-2 ${getErrorMessage('address') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-3 rounded-lg ${getErrorMessage('city') ? 'bg-red-100 border border-red-500' : ''}`}>
                  <Label className={`font-semibold ${getErrorMessage('city') ? 'text-red-700' : ''}`}>
                    City * {getErrorMessage('city') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('city')})</span>}
                  </Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Doha"
                    className={`mt-2 ${getErrorMessage('city') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                  />
                </div>
                <div>
                  <Label className="font-semibold">State/Region</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="State (optional)"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Postal Code</Label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="12345"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="font-semibold">Country *</Label>
                  <Select value={formData.country} onChange={(e) => handleInputChange('country', e.target.value)}>
                    <option value="Qatar">Qatar</option>
                    <option value="UAE">UAE</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>
                <div>
                  <Label className="font-semibold">Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg ${getErrorMessage('category') ? 'bg-red-100 border border-red-500' : ''}`}>
                  <Label className={`font-semibold ${getErrorMessage('category') ? 'text-red-700' : ''}`}>
                    Product/Service Category * {getErrorMessage('category') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('category')})</span>}
                  </Label>
                  <Select value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} className={getErrorMessage('category') ? 'border-red-600 border-2' : ''}>
                    <option value="">-- Select Category --</option>
                    {SUPPLIER_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </div>
                <div className={`p-3 rounded-lg ${getErrorMessage('businessType') ? 'bg-red-100 border border-red-500' : ''}`}>
                  <Label className={`font-semibold ${getErrorMessage('businessType') ? 'text-red-700' : ''}`}>
                    Business Type * {getErrorMessage('businessType') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('businessType')})</span>}
                  </Label>
                  <Select value={formData.businessType} onChange={(e) => handleInputChange('businessType', e.target.value)} className={getErrorMessage('businessType') ? 'border-red-600 border-2' : ''}>
                    <option value="">-- Select Type --</option>
                    {BUSINESS_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="font-semibold">Year Established</Label>
                  <Input
                    type="number"
                    value={formData.yearEstablished}
                    onChange={(e) => handleInputChange('yearEstablished', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Number of Employees</Label>
                  <Input
                    type="number"
                    value={formData.numberOfEmployees}
                    onChange={(e) => handleInputChange('numberOfEmployees', e.target.value)}
                    placeholder="50"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="font-semibold">Business Description</Label>
                <Textarea
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  placeholder="Brief description of your business, products, and services..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Documents */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Business Documents</CardTitle>
              <CardDescription>Upload your company registration and tax documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`rounded-lg p-4 ${getErrorMessage('crDoc') || getErrorMessage('crNumber') ? 'bg-red-100 border-2 border-red-500' : 'bg-blue-50 border border-blue-200'}`}>
                <h3 className={`font-semibold mb-3 ${getErrorMessage('crDoc') || getErrorMessage('crNumber') ? 'text-red-900' : 'text-blue-900'}`}>
                  Commercial Registration (CR)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <Label className={`font-semibold ${getErrorMessage('crNumber') ? 'text-red-700' : ''}`}>
                      CR Number {getErrorMessage('crNumber') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('crNumber')})</span>}
                    </Label>
                    <Input
                      value={formData.crNumber}
                      onChange={(e) => handleInputChange('crNumber', e.target.value)}
                      placeholder="CR-1234567"
                      className={`mt-2 ${getErrorMessage('crNumber') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">CR Expiry Date</Label>
                    <Input
                      type="date"
                      value={formData.crExpiry}
                      onChange={(e) => handleInputChange('crExpiry', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label className={`font-semibold block mb-2 ${getErrorMessage('crDoc') ? 'text-red-700' : ''}`}>
                    Upload CR Document (PDF/Image) {getErrorMessage('crDoc') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('crDoc')})</span>}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={(e) => handleFileSelect('cr', e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => uploadFile('cr', 'CR Document')}
                      disabled={!documents.cr || loading}
                      variant={uploads.cr ? 'outline' : 'default'}
                      size="sm"
                    >
                      {uploads.cr ? <CheckCircle className="h-4 w-4" /> : <Upload className="h-4 w-4 mr-2" />}
                      {uploads.cr ? 'Done' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className={`rounded-lg p-4 ${getErrorMessage('taxDoc') || getErrorMessage('taxIdNumber') ? 'bg-red-100 border-2 border-red-500' : 'bg-amber-50 border border-amber-200'}`}>
                <h3 className={`font-semibold mb-3 ${getErrorMessage('taxDoc') || getErrorMessage('taxIdNumber') ? 'text-red-900' : 'text-amber-900'}`}>
                  Tax Registration (Tax Card/TRN)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <Label className={`font-semibold ${getErrorMessage('taxIdNumber') ? 'text-red-700' : ''}`}>
                      Tax ID Number {getErrorMessage('taxIdNumber') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('taxIdNumber')})</span>}
                    </Label>
                    <Input
                      value={formData.taxIdNumber}
                      onChange={(e) => handleInputChange('taxIdNumber', e.target.value)}
                      placeholder="TRN-1234567"
                      className={`mt-2 ${getErrorMessage('taxIdNumber') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">Tax Card Expiry Date (Optional)</Label>
                    <Input
                      type="date"
                      value={formData.taxIdExpiry}
                      onChange={(e) => handleInputChange('taxIdExpiry', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label className={`font-semibold block mb-2 ${getErrorMessage('taxDoc') ? 'text-red-700' : ''}`}>
                    Upload Tax Card/Certificate (PDF/Image) {getErrorMessage('taxDoc') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('taxDoc')})</span>}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={(e) => handleFileSelect('taxCard', e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => uploadFile('taxCard', 'Tax Card')}
                      disabled={!documents.taxCard || loading}
                      variant={uploads.taxCard ? 'outline' : 'default'}
                      size="sm"
                    >
                      {uploads.taxCard ? <CheckCircle className="h-4 w-4" /> : <Upload className="h-4 w-4 mr-2" />}
                      {uploads.taxCard ? 'Done' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3">ICV Certificate (Optional)</h3>
                <p className="text-sm text-green-700 mb-3">If applicable, upload your In-Country Value certification</p>
                <div>
                  <Label className="font-semibold block mb-2">Upload ICV Certificate</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={(e) => handleFileSelect('icv', e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => uploadFile('icv', 'ICV Certificate')}
                      disabled={!documents.icv || loading}
                      variant={uploads.icv ? 'outline' : 'default'}
                      size="sm"
                    >
                      {uploads.icv ? <CheckCircle className="h-4 w-4" /> : <Upload className="h-4 w-4 mr-2" />}
                      {uploads.icv ? 'Done' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contact Information */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Primary Contact Person</CardTitle>
              <CardDescription>Information for our communication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg ${getErrorMessage('contactName') ? 'bg-red-100 border border-red-500' : ''}`}>
                  <Label className={`font-semibold ${getErrorMessage('contactName') ? 'text-red-700' : ''}`}>
                    Full Name * {getErrorMessage('contactName') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('contactName')})</span>}
                  </Label>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    placeholder="John Doe"
                    className={`mt-2 ${getErrorMessage('contactName') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                  />
                </div>
                <div>
                  <Label className="font-semibold">Job Title/Position</Label>
                  <Input
                    value={formData.contactTitle}
                    onChange={(e) => handleInputChange('contactTitle', e.target.value)}
                    placeholder="Sales Manager"
                    className="mt-2"
                  />
                </div>
                <div className={`p-3 rounded-lg ${getErrorMessage('contactEmail') ? 'bg-red-100 border border-red-500' : ''}`}>
                  <Label className={`font-semibold ${getErrorMessage('contactEmail') ? 'text-red-700' : ''}`}>
                    Email Address * {getErrorMessage('contactEmail') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('contactEmail')})</span>}
                  </Label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="john@company.com"
                    className={`mt-2 ${getErrorMessage('contactEmail') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                  />
                </div>
                <div className={`p-3 rounded-lg ${getErrorMessage('contactPhone') ? 'bg-red-100 border border-red-500' : ''}`}>
                  <Label className={`font-semibold ${getErrorMessage('contactPhone') ? 'text-red-700' : ''}`}>
                    Office Phone * {getErrorMessage('contactPhone') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('contactPhone')})</span>}
                  </Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+974 4433 1234"
                    className={`mt-2 ${getErrorMessage('contactPhone') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                  />
                </div>
              </div>

              <div>
                <Label className="font-semibold">Mobile Number</Label>
                <Input
                  value={formData.contactMobile}
                  onChange={(e) => handleInputChange('contactMobile', e.target.value)}
                  placeholder="+974 5555 1234"
                  className="mt-2"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4">Business Terms & Conditions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="font-semibold">Payment Terms</Label>
                    <Select value={formData.paymentTerms} onChange={(e) => handleInputChange('paymentTerms', e.target.value)}>
                      <option value="Cash on Delivery">Cash on Delivery</option>
                      <option value="Net 7">Net 7 Days</option>
                      <option value="Net 14">Net 14 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-semibold">Lead Time (Days)</Label>
                    <Input
                      type="number"
                      value={formData.leadTimeDays}
                      onChange={(e) => handleInputChange('leadTimeDays', e.target.value)}
                      placeholder="14"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="font-semibold">Minimum Order Value</Label>
                    <Input
                      type="number"
                      value={formData.minimumOrderValue}
                      onChange={(e) => handleInputChange('minimumOrderValue', e.target.value)}
                      placeholder="1000"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">Currency</Label>
                    <Select value={formData.currency} onChange={(e) => handleInputChange('currency', e.target.value)}>
                      <option value="QAR">QAR (Qatari Riyal)</option>
                      <option value="AED">AED (Emirates Dirham)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Banking Information */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Banking & Payment Information</CardTitle>
              <CardDescription>Your bank details for payments and transfers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`bg-purple-50 border-2 rounded-lg p-3 ${getErrorMessage('bankName') ? 'bg-red-100 border-red-500' : 'border-purple-200'}`}>
                <div>
                  <Label className={`font-semibold ${getErrorMessage('bankName') ? 'text-red-700' : ''}`}>
                    Bank Name {getErrorMessage('bankName') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('bankName')})</span>}
                  </Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="Commercial Bank of Qatar"
                    className={`mt-2 ${getErrorMessage('bankName') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg ${getErrorMessage('accountHolder') ? 'bg-red-100 border border-red-500' : ''}`}>
                  <Label className={`font-semibold ${getErrorMessage('accountHolder') ? 'text-red-700' : ''}`}>
                    Account Holder Name {getErrorMessage('accountHolder') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('accountHolder')})</span>}
                  </Label>
                  <Input
                    value={formData.accountHolder}
                    onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                    placeholder="Company Legal Name"
                    className={`mt-2 ${getErrorMessage('accountHolder') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                  />
                </div>
                <div className={`p-3 rounded-lg ${getErrorMessage('iban') ? 'bg-red-100 border border-red-500' : ''}`}>
                  <Label className={`font-semibold ${getErrorMessage('iban') ? 'text-red-700' : ''}`}>
                    Account Number / IBAN {getErrorMessage('iban') && <span className="text-red-600 text-xs ml-1">({getErrorMessage('iban')})</span>}
                  </Label>
                  <Input
                    value={formData.iban}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    placeholder="Account/IBAN number"
                    className={`mt-2 ${getErrorMessage('iban') ? 'border-red-600 border-2 bg-red-50' : ''}`}
                  />
                </div>
              </div>

              <div>
                <Label className="font-semibold block mb-2">Bank Certificate/Proof (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    onChange={(e) => handleFileSelect('bankDocument', e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => uploadFile('bankDocument', 'Bank Document')}
                    disabled={!documents.bankDocument || loading}
                    variant={uploads.bankDocument ? 'outline' : 'default'}
                    size="sm"
                  >
                    {uploads.bankDocument ? <CheckCircle className="h-4 w-4" /> : <Upload className="h-4 w-4 mr-2" />}
                    {uploads.bankDocument ? 'Done' : 'Upload'}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Note:</span> Your banking information will be kept confidential and used only for payment processing and verification purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Missing Fields */}
            <div>
              <Card className={Object.keys(validateAllSteps()).length > 0 ? 'border-red-400 border-2 bg-red-50' : 'border-green-400 border-2 bg-green-50'}>
                <CardHeader>
                  <CardTitle className={`text-lg ${Object.keys(validateAllSteps()).length > 0 ? 'text-red-900' : 'text-green-900'}`}>
                    {Object.keys(validateAllSteps()).length > 0 ? '❌ Complete These Fields' : '✅ All Fields Complete'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(validateAllSteps()).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(validateAllSteps()).map(([key, info]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setValidationErrors({})
                            setMessage({ type: 'success', text: '' })
                            setStep(info.step)
                          }}
                          className="w-full text-left p-3 rounded-lg bg-white border-2 border-red-300 hover:bg-red-100 transition-colors"
                        >
                          <p className="font-semibold text-red-900 text-sm">{info.field}</p>
                          <p className="text-xs text-red-700 mt-1">Step {info.step + 1}</p>
                          <p className="text-xs text-red-600 mt-1">← Click to edit</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 text-green-800">
                      <p className="text-sm font-semibold">All required fields are filled!</p>
                      <p className="text-xs">You can now submit your application.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Content - Review Summary */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Review Your Application</CardTitle>
                  <CardDescription>Please verify all information before submitting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={`border rounded-lg p-4 ${formData.companyName && formData.email && formData.phone && formData.address && formData.category && formData.businessType ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                      <h4 className="font-semibold text-slate-900 mb-3">Company Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium text-slate-700">Company:</span> <span className={!formData.companyName ? 'text-red-600 font-bold' : ''}>{formData.companyName || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">Category:</span> <span className={!formData.category ? 'text-red-600 font-bold' : ''}>{formData.category || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">Type:</span> <span className={!formData.businessType ? 'text-red-600 font-bold' : ''}>{formData.businessType || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">Email:</span> <span className={!formData.email ? 'text-red-600 font-bold' : ''}>{formData.email || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">Phone:</span> <span className={!formData.phone ? 'text-red-600 font-bold' : ''}>{formData.phone || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">Address:</span> <span className={!formData.address ? 'text-red-600 font-bold' : ''}>{formData.address || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">City:</span> <span className={!formData.city ? 'text-red-600 font-bold' : ''}>{formData.city || '❌ Missing'}</span></p>
                      </div>
                    </div>

                    <div className={`border rounded-lg p-4 ${formData.contactName && formData.contactEmail && formData.contactPhone ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                      <h4 className="font-semibold text-slate-900 mb-3">Contact Person</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium text-slate-700">Name:</span> <span className={!formData.contactName ? 'text-red-600 font-bold' : ''}>{formData.contactName || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">Title:</span> {formData.contactTitle}</p>
                        <p><span className="font-medium text-slate-700">Email:</span> <span className={!formData.contactEmail ? 'text-red-600 font-bold' : ''}>{formData.contactEmail || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">Phone:</span> <span className={!formData.contactPhone ? 'text-red-600 font-bold' : ''}>{formData.contactPhone || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">Mobile:</span> {formData.contactMobile}</p>
                      </div>
                    </div>

                    <div className={`border rounded-lg p-4 ${formData.crNumber && formData.taxIdNumber && uploads.cr && uploads.taxCard ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                      <h4 className="font-semibold text-slate-900 mb-3">Registration Documents</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium text-slate-700">CR Number:</span> <span className={!formData.crNumber ? 'text-red-600 font-bold' : ''}>{formData.crNumber || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">CR Document:</span> <span className={uploads.cr ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{uploads.cr ? '✓ Uploaded' : '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">Tax ID:</span> <span className={!formData.taxIdNumber ? 'text-red-600 font-bold' : ''}>{formData.taxIdNumber || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">Tax Document:</span> <span className={uploads.taxCard ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{uploads.taxCard ? '✓ Uploaded' : '❌ Missing'}</span></p>
                      </div>
                    </div>

                    <div className={`border rounded-lg p-4 ${formData.bankName && formData.accountHolder && formData.iban ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                      <h4 className="font-semibold text-slate-900 mb-3">Banking Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium text-slate-700">Bank:</span> <span className={!formData.bankName ? 'text-red-600 font-bold' : ''}>{formData.bankName || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">Account Holder:</span> <span className={!formData.accountHolder ? 'text-red-600 font-bold' : ''}>{formData.accountHolder || '❌ Missing'}</span></p>
                        <p><span className="font-medium text-slate-700">IBAN:</span> <span className={!formData.iban ? 'text-red-600 font-bold' : ''}>{formData.iban || '❌ Missing'}</span></p>
                      </div>
                    </div>
                  </div>

                  {Object.keys(validateAllSteps()).length === 0 && (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <p className="text-sm text-green-900">
                        <span className="font-semibold">✅ Complete!</span> All required information has been filled. Your application is ready to submit.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between mt-8">
          <div className="flex gap-3">
            {step > 0 && (
              <Button
                onClick={() => {
                  setValidationErrors({})
                  setMessage({ type: 'success', text: '' })
                  setStep(step - 1)
                }}
                variant="outline"
                disabled={loading}
              >
                ← Previous
              </Button>
            )}
            <Button
              onClick={saveDraft}
              disabled={loading}
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Save className="h-4 w-4 mr-2" /> Save as Draft
            </Button>
          </div>

          <div className="flex gap-3">
            {step < 4 ? (
              <Button
                onClick={() => {
                  if (canProceedStep()) {
                    setValidationErrors({})
                    setMessage({ type: 'success', text: '' })
                    setStep(step + 1)
                  }
                }}
                disabled={loading || Object.keys(validationErrors).length > 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next →
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => submitRegistration()}
                  disabled={loading || Object.keys(validateAllSteps()).length > 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={Object.keys(validateAllSteps()).length > 0 ? 'Please fill all required fields' : 'Submit your application'}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
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
    </div>
  )
}
