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
  client: {
    name: string
    address: string | null
  }
  jobOrder?: {
    jobNumber: string
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

export default function InvoiceViewPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

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
    window.print()
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!invoice) {
    return <div className="p-8">Invoice not found</div>
  }

  return (
    <div>
      {/* Print Button Bar */}
      <div className="no-print p-4 bg-gray-50 border-b flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Invoice Template */}
      <div className="invoice-template p-8 max-w-[210mm] mx-auto bg-white">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-blue-900 font-bold text-4xl">NBTC</div>
              <div>
                <div className="text-sm" style={{ direction: 'rtl', unicodeBidi: 'bidi-override' }}>
                  الشونل بيلتك تريديينج اند كونتر اكتينج ش . م . ح
                </div>
                <div className="font-bold text-blue-900">National Builtech Trading & Contracting Co. W.L.L</div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-12 h-12 border rounded flex items-center justify-center text-xs">
                LOGO
              </div>
              <div className="w-12 h-12 border rounded flex items-center justify-center text-xs">
                CERT
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Info Box */}
        <div className="flex justify-between items-start mb-6">
          <div>
            {invoice.clientReference && (
              <p className="text-sm mb-2">
                <strong>Your Ref no.</strong> {invoice.clientReference}
              </p>
            )}
            <p className="text-sm">
              <strong>Due From M/s :</strong> <span className="font-bold">{invoice.client.name}</span>
            </p>
            {invoice.client.address && (
              <p className="text-sm">{invoice.client.address}</p>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold mb-4">INVOICE</h1>
            <table className="border border-black">
              <tbody>
                <tr>
                  <td className="border border-black px-4 py-2 font-semibold">Invoice No :</td>
                  <td className="border border-black px-4 py-2">{invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td className="border border-black px-4 py-2 font-semibold">Date :</td>
                  <td className="border border-black px-4 py-2">
                    {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border border-black mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-2 text-sm">Sl.No</th>
              <th className="border border-black px-2 py-2 text-sm">DETAILS</th>
              <th className="border border-black px-2 py-2 text-sm">UNIT</th>
              <th className="border border-black px-2 py-2 text-sm">QTY</th>
              <th className="border border-black px-2 py-2 text-sm">UNIT PRICE<br/>QAR</th>
              <th className="border border-black px-2 py-2 text-sm">TOTAL PRICE<br/>QAR</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(invoice.items) && invoice.items.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-black px-2 py-2 text-center align-top">{index + 1}</td>
                <td className="border border-black px-2 py-2">
                  <div className="whitespace-pre-line text-sm">{item.description}</div>
                </td>
                <td className="border border-black px-2 py-2 text-center align-top">{item.unit}</td>
                <td className="border border-black px-2 py-2 text-center align-top">{item.quantity}</td>
                <td className="border border-black px-2 py-2 text-right align-top">{item.unitPrice.toFixed(2)}</td>
                <td className="border border-black px-2 py-2 text-right align-top">{item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={5} className="border border-black px-2 py-2 text-center font-bold">
                TOTAL QAR : {numberToWords(invoice.totalAmount)}
              </td>
              <td className="border border-black px-2 py-2 text-right font-bold">
                {invoice.totalAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bank Details */}
        {invoice.bankDetails && (
          <div className="border border-black p-3 mb-6 text-sm">
            <div className="whitespace-pre-line">{invoice.bankDetails}</div>
          </div>
        )}

        {/* Signature Section */}
        <table className="w-full border border-black">
          <tbody>
            <tr>
              <td className="border border-black px-4 py-12 w-1/2 text-center">
                Receiver Name & Signature
              </td>
              <td className="border border-black px-4 py-12 w-1/2 text-center">
                For National Builtech Trad & Cont Co.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-600 border-t pt-4">
          <div className="flex justify-between">
            <div>
              <p><strong>C.R. 22469</strong></p>
              <p>P.O Box : 23599</p>
              <p>New Industrial Area, Doha, State of Qatar</p>
              <p>Tel: +974 44110779 · +974 44110778</p>
              <p>Fax: +974 44110449</p>
              <p>Email: info@nbtcqatar.com</p>
              <p>Web: www.nbtcqatar.com</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .invoice-template {
            max-width: 100%;
            margin: 0;
            padding: 20mm;
          }
          
          @page {
            size: A4;
            margin: 10mm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
