'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface DeliveryNote {
  id: string
  deliveryNoteNumber: string
  date: string
  jobOrderId: string | null
  jobOrder: {
    jobNumber: string
    productName: string
  } | null
  client: string | null
  country: string | null
  division: string | null
  department: string | null
  fabrication: string | null
  refPoNumber: string | null
  shipmentTo: string | null
  totalQuantity: number
  totalWeight: number
  comments: string | null
  shipmentType: string | null
  representativeName: string | null
  representativeNo: string | null
  qidNumber: string | null
  vehicleNumber: string | null
  vehicleType: string
  items: {
    id: string
    itemDescription: string
    unit: string
    quantity: number
    weight: number | null
    remarks: string | null
  }[]
}

interface PrintSettings {
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  fontSize: string
  headerFontSize: string
  tableFontSize: string
  rowHeight: string
}

const defaultSettings: PrintSettings = {
  marginTop: '1.0',
  marginRight: '0.5',
  marginBottom: '1.5',
  marginLeft: '0.25',
  fontSize: '12',
  headerFontSize: '22',
  tableFontSize: '12',
  rowHeight: '40',
}

export default function DeliveryNotePrintPage() {
  const params = useParams()
  const id = params.id as string
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<PrintSettings>(defaultSettings)

  useEffect(() => {
    // Load print settings from localStorage
    const saved = localStorage.getItem('deliveryNotePrintSettings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    fetchDeliveryNote()
  }, [id])

  // Set document title for print filename
  useEffect(() => {
    if (deliveryNote) {
      document.title = `DN - ${deliveryNote.deliveryNoteNumber} - ${deliveryNote.client || 'N/A'} - ${deliveryNote.department || 'N/A'}`
    }
  }, [deliveryNote])

  const fetchDeliveryNote = async () => {
    try {
      const res = await fetch(`/api/delivery-notes/${id}`)
      const data = await res.json()
      setDeliveryNote(data)
      setLoading(false)
      setTimeout(() => window.print(), 500)
    } catch (error) {
      console.error('Failed to fetch delivery note:', error)
      setLoading(false)
    }
  }

  if (loading || !deliveryNote) {
    return <div className="p-8">Loading delivery note...</div>
  }

  const dn = deliveryNote

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: ${settings.marginTop}in ${settings.marginRight}in ${settings.marginBottom}in ${settings.marginLeft}in;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
          .signature-section {
            page-break-inside: avoid;
            margin-top: 20px;
          }
        }
      `}</style>
      
      <div className="bg-white" style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: `${settings.fontSize}px`, maxWidth: '100%' }}>
          {/* Control Number - Top Right */}
          <div style={{ textAlign: 'right', marginBottom: '3px' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>Control No. NBTC-FO/SP 04 Rev.0</span>
          </div>

        {/* Header */}
        <div style={{ marginBottom: '8px', borderBottom: '2px solid #000', paddingBottom: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '30%' }}></div>
            <h2 style={{ fontSize: `${settings.headerFontSize}px`, fontWeight: 'bold', margin: 0 }}>DELIVERY NOTE</h2>
            <div style={{ fontSize: '14px', textAlign: 'right', width: '30%' }}>
              <div><strong>DN No:</strong> {dn.deliveryNoteNumber}</div>
              <div><strong>Date:</strong> {new Date(dn.date).toLocaleDateString('en-GB')}</div>
            </div>
          </div>
        </div>

        {/* Client Information Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px', fontSize: `${settings.tableFontSize}px` }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', width: '11%', backgroundColor: '#f5f5f5' }}>Client</td>
              <td style={{ border: '1px solid #000', padding: '2px', width: '36%' }}>{dn.client || ''}</td>
              <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', width: 'auto', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap' }}>Ref/PO No.</td>
              <td style={{ border: '1px solid #000', padding: '2px' }}>{dn.refPoNumber || ''}</td>
              <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', width: 'auto', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap' }}>Job Order</td>
              <td style={{ border: '1px solid #000', padding: '2px' }}>{dn.jobOrder?.jobNumber || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Department</td>
              <td style={{ border: '1px solid #000', padding: '2px' }}>{dn.department || ''}</td>
              <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', width: 'auto', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap' }}>Country</td>
              <td style={{ border: '1px solid #000', padding: '2px' }}>{dn.country || ''}</td>
              <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', width: 'auto', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap' }}>Division</td>
              <td style={{ border: '1px solid #000', padding: '2px' }}>{dn.division || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0' }}>
              <th style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', width: '40px', fontSize: `${settings.tableFontSize}px` }}>No.</th>
              <th style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', fontSize: `${settings.tableFontSize}px` }}>Item Description</th>
              <th style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', width: '60px', fontSize: `${settings.tableFontSize}px` }}>Unit</th>
              <th style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', width: '60px', fontSize: `${settings.tableFontSize}px` }}>Quantity</th>
              <th style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', width: '70px', fontSize: `${settings.tableFontSize}px` }}>Weight(KG)</th>
              <th style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', width: '100px', fontSize: `${settings.tableFontSize}px` }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {dn.items && dn.items.length > 0 ? (
              dn.items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: `${settings.tableFontSize}px`, height: `${settings.rowHeight}px` }}>{idx + 1}</td>
                  <td style={{ borderRight: '1px solid #000', padding: '2px', fontSize: `${settings.tableFontSize}px`, height: `${settings.rowHeight}px` }}>{item.itemDescription}</td>
                  <td style={{ borderRight: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: `${settings.tableFontSize}px`, height: `${settings.rowHeight}px` }}>{item.unit}</td>
                  <td style={{ borderRight: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: `${settings.tableFontSize}px`, height: `${settings.rowHeight}px` }}>{item.quantity}</td>
                  <td style={{ borderRight: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: `${settings.tableFontSize}px`, height: `${settings.rowHeight}px` }}>{item.weight || ''}</td>
                  <td style={{ borderRight: '1px solid #000', padding: '2px', fontSize: `${settings.tableFontSize}px`, height: `${settings.rowHeight}px` }}>{item.remarks || ''}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ border: '1px solid #000', padding: '20px', textAlign: 'center', fontSize: `${settings.tableFontSize}px`, height: `${settings.rowHeight}px` }}>
                  No items
                </td>
              </tr>
            )}
            {/* Add empty rows to fill template, max 8 total rows */}
            {(!dn.items || dn.items.length < 8) &&
              Array.from({ length: Math.max(0, 8 - (dn.items?.length || 0)) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '15px 4px', height: `${settings.rowHeight}px` }}></td>
                  <td style={{ borderRight: '1px solid #000', padding: '15px 4px', height: `${settings.rowHeight}px` }}></td>
                  <td style={{ borderRight: '1px solid #000', padding: '15px 4px', height: `${settings.rowHeight}px` }}></td>
                  <td style={{ borderRight: '1px solid #000', padding: '15px 4px', height: `${settings.rowHeight}px` }}></td>
                  <td style={{ borderRight: '1px solid #000', padding: '15px 4px', height: `${settings.rowHeight}px` }}></td>
                  <td style={{ borderRight: '1px solid #000', padding: '15px 4px', height: `${settings.rowHeight}px` }}></td>
                </tr>
              ))}
            {/* Total Row */}
            <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '3px', textAlign: 'right', fontSize: `${settings.tableFontSize}px` }}>TOTAL</td>
              <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: `${settings.tableFontSize}px` }}>{dn.totalQuantity}</td>
              <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: `${settings.tableFontSize}px` }}>{dn.totalWeight.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '3px', fontSize: `${settings.tableFontSize}px` }}></td>
            </tr>
          </tbody>
        </table>

        {/* Shipment Details */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', width: 'auto', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap' }}>Shipment To</td>
              <td style={{ border: '1px solid #000', padding: '2px' }} colSpan={3}>{dn.shipmentTo || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', width: 'auto', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap' }}>Shipment Type</td>
              <td style={{ border: '1px solid #000', padding: '2px' }}>{dn.shipmentType || ''}</td>
              <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', width: 'auto', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap' }}>Representative</td>
              <td style={{ border: '1px solid #000', padding: '2px' }}>
                <div>{dn.representativeName || ''}</div>
                {dn.representativeNo && <div style={{ fontSize: '11px', marginTop: '1px' }}>Contact: {dn.representativeNo}</div>}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', width: 'auto', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap' }}>Vehicle Type</td>
              <td style={{ border: '1px solid #000', padding: '2px' }}>
                <span style={{ marginRight: '15px' }}>
                  <input type="checkbox" checked={dn.vehicleType === 'NBTC'} disabled style={{ marginRight: '3px' }} />
                  NBTC
                </span>
                <span style={{ marginRight: '15px' }}>
                  <input type="checkbox" checked={dn.vehicleType === 'CLIENT'} disabled style={{ marginRight: '3px' }} />
                  Client
                </span>
                <span>
                  <input type="checkbox" checked={dn.vehicleType === 'THIRD_PARTY'} disabled style={{ marginRight: '3px' }} />
                  Third Party
                </span>
              </td>
              <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', width: 'auto', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap' }}>Vehicle No.</td>
              <td style={{ border: '1px solid #000', padding: '2px' }}>{dn.vehicleNumber || ''}</td>
            </tr>
            {dn.comments && (
              <tr>
                <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Comments</td>
                <td colSpan={3} style={{ border: '1px solid #000', padding: '2px' }}>{dn.comments}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Signature Grid - Fixed at bottom */}
        <div className="signature-section">
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', width: '23%', fontSize: '12px' }}>Prepared By</th>
                <th style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', width: '23%', fontSize: '12px' }}>Checked By</th>
                <th style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', width: '23%', fontSize: '12px' }}>Approved By</th>
                <th style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', width: '31%', fontSize: '12px' }}>Received By</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'top', fontSize: '12px' }}>
                  <div style={{ marginTop: '40px' }}>
                    <div>Signature: ______________</div>
                    <div style={{ marginTop: '2px', marginBottom: 0 }}>Date: ______________</div>
                  </div>
                </td>
                <td style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'top', fontSize: '12px' }}>
                  <div style={{ marginTop: '40px' }}>
                    <div>Signature: ______________</div>
                    <div style={{ marginTop: '2px', marginBottom: 0 }}>Date: ______________</div>
                  </div>
                </td>
                <td style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'top', fontSize: '12px' }}>
                  <div style={{ marginTop: '40px' }}>
                    <div>Signature: ______________</div>
                    <div style={{ marginTop: '2px', marginBottom: 0 }}>Date: ______________</div>
                  </div>
                </td>
                <td style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'top', fontSize: '12px' }}>
                  <div style={{ marginTop: '40px' }}>
                    <div>Signature: ______________</div>
                    <div style={{ marginTop: '2px', marginBottom: 0 }}>Date: ______________</div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '11px', fontStyle: 'italic' }}>
                    <p style={{ margin: 0 }}>"Received the above goods in order"</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
