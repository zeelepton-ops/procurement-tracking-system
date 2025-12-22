import * as XLSX from 'xlsx'

export function parseTemplateExcel(buffer: ArrayBuffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const result: any = {}

  // If there's a sheet named 'template', read A1 as HTML
  const templateSheet = wb.Sheets['template'] || wb.Sheets[wb.SheetNames[0]]
  if (templateSheet) {
    const cell = templateSheet['A1']
    if (cell && cell.v) result.htmlTemplate = String(cell.v)
  }

  // Optional mapping sheet
  const mappingSheet = wb.Sheets['mapping']
  if (mappingSheet) {
    const json = XLSX.utils.sheet_to_json(mappingSheet, { header: ['placeholder', 'fieldPath'] })
    const mapping: Record<string, string> = {}
    json.forEach((r: any) => {
      if (r.placeholder && r.fieldPath) mapping[r.placeholder] = r.fieldPath
    })
    result.mapping = mapping
  }

  // If no htmlTemplate found, try to construct basic template from first sheet rows
  if (!result.htmlTemplate) {
    // simple fallback: join all rows as lines
    const data: any = XLSX.utils.sheet_to_json(templateSheet, { header: 1 })
    result.htmlTemplate = '<pre>' + (data as any[]).map((r: any) => Array.isArray(r) ? r.join('\t') : String(r)).join('\n') + '</pre>'
  }

  return result
}