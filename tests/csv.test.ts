import { describe, it, expect } from 'vitest'
import { jobOrdersToCSV } from '@/lib/csv'

describe('CSV util', () => {
  it('generates CSV for job orders with totals', () => {
    const jobs = [
      { jobNumber: '001', productName: 'Widget', clientName: 'ACME', foreman: 'Guna', priority: 'HIGH', createdAt: new Date('2025-01-01T00:00:00Z'), items: [{ workDescription: 'Make', quantity: 2, unit: 'Nos', totalPrice: 123.45 }], discount: 10, roundOff: 0.55 }
    ]
    const csv = jobOrdersToCSV(jobs)
    expect(csv).toContain('Job Number,Product Name,Client,Foreman,Priority,Created At,Subtotal,Discount,Round Off,Final Total,Items')
    expect(csv).toContain('001')
    expect(csv).toContain('Widget')
    expect(csv).toContain('Make (2 Nos)')
    // Subtotal 123.45, discount 10, roundOff 0.55 => final 114.00
    expect(csv).toContain('123.45')
    expect(csv).toContain('10.00')
    expect(csv).toContain('0.55')
    expect(csv).toContain('114.00')
  })
})