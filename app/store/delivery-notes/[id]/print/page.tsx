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

export default function DeliveryNotePrintPage() {
  const params = useParams()
  const id = params.id as string
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeliveryNote()
  }, [id])

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
          margin: 1.5in 0.5in 1.5in 0.5in;
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
            position: fixed;
            bottom: 1.5in;
            left: 0.5in;
            right: 0.5in;
            width: calc(100% - 1in);
          }
        }
      `}</style>
      
      <div className="bg-white" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', maxWidth: '100%' }}>
        {/* Control Number - Top Right */}
        <div style={{ textAlign: 'right', marginBottom: '5px' }}>
          <span style={{ fontSize: '8px', color: '#666' }}>Control No. NBTC-FO/SP 04 Rev.0</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '12px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '30%' }}></div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>DELIVERY NOTE</h2>
            <div style={{ fontSize: '11px', textAlign: 'right', width: '30%' }}>
              <div><strong>DN No:</strong> {dn.deliveryNoteNumber}</div>
              <div><strong>Date:</strong> {new Date(dn.date).toLocaleDateString('en-GB')}</div>
            </div>
          </div>
        </div>

        {/* Client Information Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '10px', fontSize: '10px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '15%', backgroundColor: '#f5f5f5' }}>Client</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '18%' }}>{dn.client || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '15%', backgroundColor: '#f5f5f5' }}>Ref/PO No.</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '18%' }}>{dn.refPoNumber || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '15%', backgroundColor: '#f5f5f5' }}>Job Order</td>
              <td style={{ border: '1px solid #000', padding: '4px' }}>{dn.jobOrder?.jobNumber || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Department</td>
              <td style={{ border: '1px solid #000', padding: '4px' }}>{dn.department || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Country</td>
              <td style={{ border: '1px solid #000', padding: '4px' }}>{dn.country || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Division</td>
              <td style={{ border: '1px solid #000', padding: '4px' }}>{dn.division || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0' }}>
              <th style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '40px', fontSize: '10px' }}>No.</th>
              <th style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', fontSize: '10px' }}>Item Description</th>
              <th style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '60px', fontSize: '10px' }}>Unit</th>
              <th style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '60px', fontSize: '10px' }}>Quantity</th>
              <th style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '70px', fontSize: '10px' }}>Weight(KG)</th>
              <th style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '120px', fontSize: '10px' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {dn.items && dn.items.length > 0 ? (
              dn.items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '10px', height: '50px' }}>{idx + 1}</td>
                  <td style={{ borderRight: '1px solid #000', padding: '8px', fontSize: '10px', height: '50px' }}>{item.itemDescription}</td>
                  <td style={{ borderRight: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '10px', height: '50px' }}>{item.unit}</td>
                  <td style={{ borderRight: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '10px', height: '50px' }}>{item.quantity}</td>
                  <td style={{ borderRight: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '10px', height: '50px' }}>{item.weight || ''}</td>
                  <td style={{ borderRight: '1px solid #000', padding: '8px', fontSize: '10px', height: '50px' }}>{item.remarks || ''}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ border: '1px solid #000', padding: '30px', textAlign: 'center', fontSize: '10px', height: '50px' }}>
                  No items
                </td>
              </tr>
            )}
            {/* Add 3-5 empty rows max for template */}
            {(!dn.items || dn.items.length < 5) &&
              Array.from({ length: Math.min(5, Math.max(0, 5 - (dn.items?.length || 0))) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '30px 4px', height: '50px' }}></td>
                  <td style={{ borderRight: '1px solid #000', padding: '30px 4px', height: '50px' }}></td>
                  <td style={{ borderRight: '1px solid #000', padding: '30px 4px', height: '50px' }}></td>
                  <td style={{ borderRight: '1px solid #000', padding: '30px 4px', height: '50px' }}></td>
                  <td style={{ borderRight: '1px solid #000', padding: '30px 4px', height: '50px' }}></td>
                  <td style={{ borderRight: '1px solid #000', padding: '30px 4px', height: '50px' }}></td>
                </tr>
              ))}
            {/* Total Row */}
            <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontSize: '10px' }}>TOTAL</td>
              <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', fontSize: '10px' }}>{dn.totalQuantity}</td>
              <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', fontSize: '10px' }}>{dn.totalWeight.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '5px', fontSize: '10px' }}></td>
            </tr>
          </tbody>
        </table>

        {/* Shipment Details */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '10px', fontSize: '10px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '20%', backgroundColor: '#f5f5f5' }}>Shipment To</td>
              <td style={{ border: '1px solid #000', padding: '4px' }} colSpan={3}>{dn.shipmentTo || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Shipment Type</td>
              <td style={{ border: '1px solid #000', padding: '4px' }}>{dn.shipmentType || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '20%', backgroundColor: '#f5f5f5' }}>Representative</td>
              <td style={{ border: '1px solid #000', padding: '4px' }}>{dn.representativeName || ''} {dn.representativeNo ? `/ ${dn.representativeNo}` : ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Vehicle Type</td>
              <td style={{ border: '1px solid #000', padding: '4px' }}>
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
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Vehicle No.</td>
              <td style={{ border: '1px solid #000', padding: '4px' }}>{dn.vehicleNumber || ''}</td>
            </tr>
            {dn.comments && (
              <tr>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Comments</td>
                <td colSpan={3} style={{ border: '1px solid #000', padding: '4px' }}>{dn.comments}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Signature Grid - Fixed at bottom */}
        <div className="signature-section">
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '25%' }}>Prepared By</th>
                <th style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '25%' }}>Checked By</th>
                <th style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '25%' }}>Approved By</th>
                <th style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '25%' }}>Received By</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '40px 5px', verticalAlign: 'bottom' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '3px', marginTop: '35px' }}>
                    <div>Signature: ______________</div>
                    <div style={{ marginTop: '3px' }}>Date: ______________</div>
                  </div>
                </td>
                <td style={{ border: '1px solid #000', padding: '40px 5px', verticalAlign: 'bottom' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '3px', marginTop: '35px' }}>
                    <div>Signature: ______________</div>
                    <div style={{ marginTop: '3px' }}>Date: ______________</div>
                  </div>
                </td>
                <td style={{ border: '1px solid #000', padding: '40px 5px', verticalAlign: 'bottom' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '3px', marginTop: '35px' }}>
                    <div>Signature: ______________</div>
                    <div style={{ marginTop: '3px' }}>Date: ______________</div>
                  </div>
                </td>
                <td style={{ border: '1px solid #000', padding: '40px 5px', verticalAlign: 'bottom' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '3px', marginTop: '35px' }}>
                    <div>Signature: ______________</div>
                    <div style={{ marginTop: '3px' }}>Date: ______________</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          {/* Footer - Will appear in the 1.5 inch bottom margin */}
          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '9px', fontStyle: 'italic' }}>
            <p style={{ margin: '3px 0' }}>"Received the above goods in order"</p>
          </div>
        </div>
      </div>
    </>
  )
}
