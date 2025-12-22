export function jobOrdersToCSV(jobs: any[]) {
  const csvHeaders = ['Job Number','Product Name','Client','Foreman','Priority','Created At','Items']
  const csvLines = [csvHeaders.join(',')]
  jobs.forEach((j) => {
    const items = j.items?.map((it: any) => `${it.workDescription} (${it.quantity} ${it.unit})`).join(' | ') || ''
    const safeItems = `"${(items || '').replace(/"/g, '""')}"`
    const line = [j.jobNumber, j.productName, j.clientName, j.foreman, j.priority, j.createdAt?.toISOString(), safeItems]
    csvLines.push(line.join(','))
  })
  return csvLines.join('\n')
}