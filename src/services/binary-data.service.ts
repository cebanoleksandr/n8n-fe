import { api } from '../api/client'

/**
 * Files referenced by item.binary[...].id. They need the bearer token, so a
 * plain <img src> or link does not work: fetch a Blob instead.
 */
export const binaryDataService = {
  async fetch(id: string): Promise<Blob> {
    const { data } = await api.get<Blob>(`/binary-data/${id}`, {
      responseType: 'blob',
    })
    return data
  },

  async download(id: string, fileName?: string): Promise<void> {
    const blob = await binaryDataService.fetch(id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName ?? id
    link.click()
    // Revoking synchronously can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  },
}
