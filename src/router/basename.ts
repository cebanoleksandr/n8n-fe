/**
 * Where the app lives on its host: "" at the root, "/n8n-fe" on GitHub Pages
 * (Vite's `base`, see vite.config.ts).
 */
export const BASENAME = import.meta.env.BASE_URL.replace(/\/+$/, '')

/** A browser pathname as a route path, without the basename. */
export function routePath(pathname: string): string {
  if (!BASENAME) return pathname
  if (pathname === BASENAME) return '/'
  return pathname.startsWith(`${BASENAME}/`) ? pathname.slice(BASENAME.length) : pathname
}

/** An absolute URL of a route, e.g. for links sent to other people. */
export function routeUrl(path: string): string {
  return `${window.location.origin}${BASENAME}${path}`
}
