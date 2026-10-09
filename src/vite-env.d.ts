/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL; defaults to `/api` (proxied to the backend by Vite in dev). */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
