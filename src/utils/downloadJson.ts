/** Saves `data` as a pretty-printed .json file through the browser. */
export function downloadJson(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`
  link.click()
  URL.revokeObjectURL(url)
}
