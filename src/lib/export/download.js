export const safeFilePart = (value, fallback = 'astrelio') => {
  const normalized = String(value || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || fallback
}

export const timestampFilePart = (date = new Date()) =>
  date.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[:.]/g, '-')

export const downloadBlob = (blob, filename) => {
  const url  = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href     = url
  link.download = filename
  link.rel      = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

export const downloadJson = (data, filename) => {
  const blob = new window.Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' })
  downloadBlob(blob, filename)
}
