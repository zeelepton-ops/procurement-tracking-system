export function jobOrdersToCSV(jobs: any[]) {
  const csvHeaders = ['Job Number','Product Name','Client','Foreman','Priority','Created At','Subtotal','Discount','Round Off','Final Total','Items']
  const csvLines = [csvHeaders.join(',')]
  jobs.forEach((j) => {
    const items = j.items?.map((it: any) => `${it.workDescription} (${it.quantity} ${it.unit})`).join(' | ') || ''
    const subtotal = (j.items || []).reduce((s: number, it: any) => s + (Number(it.totalPrice) || 0), 0)
    const discount = Number(j.discount) || 0
    const roundOff = Number(j.roundOff) || 0
    const finalTotal = (j.finalTotal !== undefined && j.finalTotal !== null) ? Number(j.finalTotal) : (subtotal - discount + roundOff)
    const safeItems = `"${(items || '').replace(/"/g, '""')}"`
    const line = [j.jobNumber, j.productName, j.clientName, j.foreman, j.priority, j.createdAt?.toISOString(), subtotal.toFixed(2), discount.toFixed(2), roundOff.toFixed(2), finalTotal.toFixed(2), safeItems]
    csvLines.push(line.join(','))
  })
  return csvLines.join('\n')
}