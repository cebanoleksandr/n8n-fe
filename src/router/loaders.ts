import { type LoaderFunctionArgs, redirect } from 'react-router-dom'
import { queryClient } from '../api/query-client'
import { meQuery, setupStatusQuery } from '../hooks/api/auth'

/** Protected routes: a fresh instance goes to setup, a guest to login. */
export const requireAuthLoader = async ({ request }: LoaderFunctionArgs) => {
  const { needsSetup } = await queryClient.ensureQueryData(setupStatusQuery)
  if (needsSetup) return redirect('/auth/setup')

  const me = await queryClient.ensureQueryData(meQuery)
  if (!me) {
    const { pathname, search } = new URL(request.url)
    const redirectTo = encodeURIComponent(pathname + search)
    return redirect(`/auth/login?redirectTo=${redirectTo}`)
  }
  return null
}

/** Login: nothing to do here once signed in. */
export const guestOnlyLoader = async () => {
  const { needsSetup } = await queryClient.ensureQueryData(setupStatusQuery)
  if (needsSetup) return redirect('/auth/setup')

  const me = await queryClient.ensureQueryData(meQuery)
  if (me) return redirect('/workflows')
  return null
}

/** Setup is reachable only until the owner account exists. */
export const setupLoader = async () => {
  const { needsSetup } = await queryClient.ensureQueryData(setupStatusQuery)
  if (!needsSetup) return redirect('/auth/login')
  return null
}
