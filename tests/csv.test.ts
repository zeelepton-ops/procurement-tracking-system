import { describe, it, expect } from 'vitest'
import { jobOrdersToCSV } from '@/lib/csv'

describe('CSV util', () => {
  it('generates CSV for job orders', () => {
    const jobs = [
      { jobNumber: '001', productName: 'Widget', clientName: 'ACME', foreman: 'Guna', priority: 'HIGH', createdAt: new Date('2025-01-01T00:00:00Z'), items: [{ workDescription: 'Make', quantity: 2, unit: 'PCS' }] }
    ]
    const csv = jobOrdersToCSV(jobs)
    expect(csv).toContain('Job Number,Product Name,Client,Foreman,Priority,Created At,Items')
    expect(csv).toContain('001')
    expect(csv).toContain('Widget')
    expect(csv).toContain('Make (2 PCS)')
  })
})