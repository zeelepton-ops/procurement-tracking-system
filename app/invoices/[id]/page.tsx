'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Download } from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  clientReference: string | null
  subtotal: number
  taxAmount: number
  discount: number
  totalAmount: number
  bankDetails: string | null
  currency: string | null
  mainDescription: string | null
  client: {
    name: string
    address: string | null
  }
  jobOrder?: {
    jobNumber: string
    productName: string
    lpoContractNo: string | null
    lpoIssueDate: string | null
  } | null
  items: InvoiceItem[]
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

interface PrintSettings {
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  fontSize: string
  headerFontSize: string
  tableFontSize: string
  headerImage: string | null
  footerImage: string | null
  showHeaderSpace: boolean
  showFooterSpace: boolean
}

const defaultSettings: PrintSettings = {
  marginTop: '1.0',
  marginRight: '0.5',
  marginBottom: '1.5',
  marginLeft: '0.5',
  fontSize: '10',
  headerFontSize: '18',
  tableFontSize: '9',
  headerImage: null,
  footerImage: null,
  showHeaderSpace: true,
  showFooterSpace: true,
}

export default function InvoiceViewPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<PrintSettings>(defaultSettings)
  const [displayCurrency, setDisplayCurrency] = useState<'QAR' | 'USD'>('QAR')

  useEffect(() => {
    // Load print settings from localStorage
    const saved = localStorage.getItem('invoicePrintSettings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  // Set document title for print filename
  useEffect(() => {
    if (invoice) {
      document.title = `Invoice - ${invoice.invoiceNumber} - ${invoice.client.name}`
    }
  }, [invoice])

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices?id=${params.id}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setInvoice(data.find((inv: Invoice) => inv.id === params.id) || null)
      } else {
        setInvoice(data)
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
      setLoading(false)
    }
  }

  const numberToWords = (num: number): string => {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE']
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN']
    
    if (num === 0) return 'ZERO'
    
    const convertHundreds = (n: number): string => {
      if (n === 0) return ''
      if (n < 10) return ones[n]
      if (n < 20) return teens[n - 10]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
      return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '')
    }
    
    const convertThousands = (n: number): string => {
      if (n < 1000) return convertHundreds(n)
      return convertHundreds(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 !== 0 ? ' ' + convertHundreds(n % 1000) : '')
    }
    
    return convertThousands(Math.floor(num)) + ' ONLY'
  }

  const handlePrint = () => {
    // Save settings before printing
    localStorage.setItem('invoicePrintSettings', JSON.stringify(settings))
    window.print()
  }

  const updateSetting = (key: keyof PrintSettings, value: string | boolean | null) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleImageUpload = (type: 'header' | 'footer', file: File | null) => {
    if (!file) {
      updateSetting(type === 'header' ? 'headerImage' : 'footerImage', null)
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      updateSetting(type === 'header' ? 'headerImage' : 'footerImage', reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const exportToExcel = () => {
    if (!invoice) return
    
    // Create CSV content
    const csvRows = []
    csvRows.push(['INVOICE'])
    csvRows.push(['Invoice Number:', invoice.invoiceNumber])
    csvRows.push(['Date:', new Date(invoice.invoiceDate).toLocaleDateString('en-GB')])
    csvRows.push(['Client:', invoice.client.name])
    if (invoice.clientReference) csvRows.push(['Client Reference:', invoice.clientReference])
    csvRows.push([])
    csvRows.push(['Sl.No', 'DETAILS', 'UNIT', 'DELIVERY QTY', 'UNIT PRICE (QAR)', 'TOTAL PRICE (QAR)'])
    
    invoice.items.forEach((item, index) => {
      csvRows.push([
        index + 1,
        item.description.replace(/\n/g, ' '),
        item.unit,
        item.quantity,
        item.unitPrice.toFixed(2),
        item.totalPrice.toFixed(2)
      ])
    })
    
    csvRows.push([])
    csvRows.push(['', '', '', '', 'Subtotal:', invoice.subtotal.toFixed(2)])
    csvRows.push(['', '', '', '', 'Tax:', invoice.taxAmount.toFixed(2)])
    csvRows.push(['', '', '', '', 'Discount:', invoice.discount.toFixed(2)])
    csvRows.push(['', '', '', '', 'TOTAL:', invoice.totalAmount.toFixed(2)])
    
    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Invoice-${invoice.invoiceNumber}.csv`
    link.click()
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!invoice) {
    return <div className="p-8">Invoice not found</div>
  }

  return (
    <div>
      {/* Print Settings Panel */}
      <div className="no-print p-4 bg-gray-100 border-b">
        <details className="mb-4">
          <summary className="cursor-pointer font-semibold text-sm mb-2">Print Settings</summary>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block mb-1">Margin Top (in) - Header</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.marginTop}
                  onChange={(e) => updateSetting('marginTop', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Margin Right (in)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.marginRight}
                  onChange={(e) => updateSetting('marginRight', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Margin Bottom (in) - Footer</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.marginBottom}
                  onChange={(e) => updateSetting('marginBottom', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Margin Left (in)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.marginLeft}
                  onChange={(e) => updateSetting('marginLeft', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Font Size (px)</label>
                <input
                  type="number"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Header Font Size (px)</label>
                <input
                  type="number"
                  step="1"
                  value={settings.headerFontSize}
                  onChange={(e) => updateSetting('headerFontSize', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Table Font Size (px)</label>
                <input
                  type="number"
                  step="1"
                  value={settings.tableFontSize}
                  onChange={(e) => updateSetting('tableFontSize', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </div>
            </div>
            
            <div className="border-t pt-3">
              <p className="text-xs font-semibold mb-2">Header & Footer Images (Optional)</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={settings.showHeaderSpace}
                      onChange={(e) => updateSetting('showHeaderSpace', e.target.checked)}
                    />
                    Show Header Space (1 inch)
                  </label>
                  <label className="block mb-1">Upload Header Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('header', e.target.files?.[0] || null)}
                    className="w-full p-1 border rounded text-xs"
                  />
                  {settings.headerImage && (
                    <button
                      onClick={() => updateSetting('headerImage', null)}
                      className="mt-1 text-xs text-red-600 underline"
                    >
                      Remove Header Image
                    </button>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={settings.showFooterSpace}
                      onChange={(e) => updateSetting('showFooterSpace', e.target.checked)}
                    />
                    Show Footer Space (1.5 inch)
                  </label>
                  <label className="block mb-1">Upload Footer Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('footer', e.target.files?.[0] || null)}
                    className="w-full p-1 border rounded text-xs"
                  />
                  {settings.footerImage && (
                    <button
                      onClick={() => updateSetting('footerImage', null)}
                      className="mt-1 text-xs text-red-600 underline"
                    >
                      Remove Footer Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Print Button Bar */}
      <div className="no-print p-4 bg-gray-50 border-b flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Invoice Template */}
      <div className="invoice-template max-w-[210mm] mx-auto bg-white" style={{ fontSize: `${settings.fontSize}px` }}>
        {/* Header Space or Image */}
        {settings.showHeaderSpace && (
          <div className="header-space" style={{ height: '1in', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {settings.headerImage ? (
              <img src={settings.headerImage} alt="Header" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="no-print text-gray-400 text-xs border-2 border-dashed border-gray-300 w-full h-full flex items-center justify-center">
                Header Space (1 inch) - Pre-printed on paper
              </div>
            )}
          </div>
        )}

        {/* Invoice Content */}
        <div className="invoice-content px-4">
          {/* Invoice Info Box */}
          <div className="flex justify-between items-start mb-4">
            <div>
              {invoice.clientReference && (
                <p className="mb-2">
                  <strong>Your Ref no.</strong> {invoice.clientReference}
                  {invoice.jobOrder?.lpoIssueDate && (
                    <> Dated {new Date(invoice.jobOrder.lpoIssueDate).toLocaleDateString('en-GB')}</>
                  )}
                </p>
              )}
              <p>
                <strong>Due From M/s :</strong> <span className="font-bold">{invoice.client.name}</span>
              </p>
              {invoice.client.address && (
                <p>{invoice.client.address}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-4 mb-3">
                <h1 className="font-bold" style={{ fontSize: `${parseInt(settings.fontSize) + 12}px` }}>INVOICE</h1>
                <div className="no-print flex items-center gap-2" style={{ fontSize: `${settings.fontSize}px` }}>
                  <label className="font-semibold">Currency:</label>
                  <select
                    value={displayCurrency}
                    onChange={(e) => setDisplayCurrency(e.target.value as 'QAR' | 'USD')}
                    className="border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="QAR">QAR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <table className="border border-black" style={{ fontSize: `${settings.tableFontSize}px` }}>
                <tbody>
                  <tr>
                    <td className="border border-black px-3 py-1 font-semibold whitespace-nowrap">Invoice No :</td>
                    <td className="border border-black px-3 py-1 whitespace-nowrap">{invoice.invoiceNumber}</td>
                    <td className="border border-black px-3 py-1 font-semibold whitespace-nowrap">Date :</td>
                    <td className="border border-black px-3 py-1 whitespace-nowrap">
                      {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}
                    </td>
                    {invoice.jobOrder && (
                      <>
                        <td className="border border-black px-3 py-1 font-semibold whitespace-nowrap">Job :</td>
                        <td className="border border-black px-3 py-1 whitespace-nowrap">{invoice.jobOrder.jobNumber}</td>
                      </>
                    )}
                  </tr>
                  {invoice.jobOrder?.lpoIssueDate && (
                    <tr>
                      <td className="border border-black px-3 py-1 font-semibold whitespace-nowrap">PO Date :</td>
                      <td colSpan={5} className="border border-black px-3 py-1 whitespace-nowrap">
                        {new Date(invoice.jobOrder.lpoIssueDate).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Items Table */}
          {invoice.jobOrder?.productName && (
            <div className="mb-2 font-semibold" style={{ fontSize: `${settings.fontSize}px` }}>
              Main Description: {invoice.jobOrder.productName}
            </div>
          )}
          <table className="w-full border border-black mb-4" style={{ fontSize: `${settings.tableFontSize}px` }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-2">Sl.No</th>
                <th className="border border-black px-2 py-2">DETAILS</th>
                <th className="border border-black px-2 py-2">UNIT</th>
                <th className="border border-black px-2 py-2">QTY</th>
                <th className="border border-black px-2 py-2">UNIT PRICE<br/>{displayCurrency}</th>
                <th className="border border-black px-2 py-2">TOTAL PRICE<br/>{displayCurrency}</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(invoice.items) && invoice.items.map((item, index) => (
                <tr key={item.id} className="page-break-inside-avoid">
                  <td className="border-l border-r border-black px-2 py-2 text-center align-top">{index + 1}</td>
                  <td className="border-r border-black px-2 py-2">
                    <div className="whitespace-pre-line">{item.description}</div>
                  </td>
                  <td className="border-r border-black px-2 py-2 text-center align-top">{item.unit}</td>
                  <td className="border-r border-black px-2 py-2 text-center align-top">{item.quantity}</td>
                  <td className="border-r border-black px-2 py-2 text-right align-top">{displayCurrency === 'USD' ? (item.unitPrice / 3.64).toFixed(2) : item.unitPrice.toFixed(2)}</td>
                  <td className="border-r border-black px-2 py-2 text-right align-top">{displayCurrency === 'USD' ? (item.totalPrice / 3.64).toFixed(2) : item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="page-break-inside-avoid border-t border-black">
                <td colSpan={5} className="border-l border-r border-black px-2 py-2 text-center font-bold">
                  TOTAL {displayCurrency} : {numberToWords(displayCurrency === 'USD' ? invoice.totalAmount / 3.64 : invoice.totalAmount)}
                </td>
                <td className="border-r border-black px-2 py-2 text-right font-bold">
                  {displayCurrency === 'USD' ? (invoice.totalAmount / 3.64).toFixed(2) : invoice.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Bank Details */}
          {invoice.bankDetails && (
            <div className="border border-black p-3 mb-4 page-break-inside-avoid">
              <div className="whitespace-pre-line">{invoice.bankDetails}</div>
            </div>
          )}

          {/* Signature Section */}
          <table className="w-full border border-black mb-4 page-break-inside-avoid">
            <tbody>
              <tr>
                <td className="border border-black px-4 py-12 w-1/2 align-top text-left">
                  Receiver Name & Signature
                </td>
                <td className="border border-black px-4 py-12 w-1/2 align-top text-right">
                  For National Builtech Trad & Cont Co.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Space or Image */}
        {settings.showFooterSpace && (
          <div className="footer-space" style={{ height: '1.5in', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {settings.footerImage ? (
              <img src={settings.footerImage} alt="Footer" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="no-print text-gray-400 text-xs border-2 border-dashed border-gray-300 w-full h-full flex items-center justify-center">
                Footer Space (1.5 inch) - Pre-printed on paper
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @page {
          size: A4;
          margin: ${settings.marginTop}in ${settings.marginRight}in ${settings.marginBottom}in ${settings.marginLeft}in;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
          
          .invoice-template {
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          
          .header-space,
          .footer-space {
            page-break-inside: avoid;
          }
          
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  )
}
