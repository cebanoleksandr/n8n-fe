import { type LoaderFunctionArgs, redirect } from 'react-router-dom'
import { queryClient } from '../api/query-client'
import { meQuery } from '../hooks/api/auth'

/** Protected routes: a guest goes to login and comes back afterwards. */
export const requireAuthLoader = async ({ request }: LoaderFunctionArgs) => {
  const me = await queryClient.query({ ...meQuery, staleTime: 'static' })
  if (!me) {
    const { pathname, search } = new URL(request.url)
    const redirectTo = encodeURIComponent(pathname + search)
    return redirect(`/auth/login?redirectTo=${redirectTo}`)
  }
  return null
}

/** Login and sign-up: nothing to do here once signed in. */
export const guestOnlyLoader = async () => {
  const me = await queryClient.query({ ...meQuery, staleTime: 'static' })
  if (me) return redirect('/workflows')
  return null
}
