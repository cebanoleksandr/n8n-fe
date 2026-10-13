import { createBrowserRouter, redirect } from 'react-router-dom'
import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router-dom'
import AppLayout from '../components/layouts/AppLayout'
import AuthLayout from '../components/layouts/AuthLayout'
import RootLayout from '../components/layouts/RootLayout'
import AppLoader from '../components/ui/AppLoader'
import { guestOnlyLoader, requireAuthLoader } from './loaders'

/**
 * Loads a page's code when its route is first visited, so each page is its
 * own chunk. Nested lazy routes load in parallel, not one after another.
 */
function page(load: () => Promise<{ default: ComponentType }>): RouteObject['lazy'] {
  return async () => ({ Component: (await load()).default })
}

export const routes: RouteObject[] = [
  {
    Component: RootLayout,
    // Shown on first load until the matched pages' code has arrived.
    HydrateFallback: AppLoader,
    children: [
      {
        path: 'auth',
        Component: AuthLayout,
        children: [
          {
            index: true,
            loader: () => redirect('/auth/login'),
          },
          {
            path: 'login',
            loader: guestOnlyLoader,
            lazy: page(() => import('../pages/auth/LoginPage')),
          },
          {
            path: 'register',
            loader: guestOnlyLoader,
            lazy: page(() => import('../pages/auth/RegisterPage')),
          },
          {
            // The link built from CreatedInvitation.token
            path: 'invite/:token',
            lazy: page(() => import('../pages/auth/AcceptInvitationPage')),
          },
        ],
      },
      {
        path: '/',
        Component: AppLayout,
        loader: requireAuthLoader,
        children: [
          {
            index: true,
            loader: () => redirect('/workflows'),
          },
          {
            lazy: page(() => import('../components/layouts/OverviewLayout')),
            children: [
              {
                path: 'workflows',
                lazy: page(() => import('../pages/workflows/WorkflowsPage')),
              },
              {
                path: 'credentials',
                lazy: page(() => import('../pages/credentials/CredentialsPage')),
              },
              {
                path: 'executions',
                lazy: page(() => import('../pages/executions/ExecutionsPage')),
              },
            ],
          },
          {
            path: 'workflows/:workflowId',
            lazy: page(() => import('../components/layouts/WorkflowLayout')),
            children: [
              {
                index: true,
                lazy: page(() => import('../pages/workflows/WorkflowEditorPage')),
              },
              {
                path: 'executions',
                lazy: page(() => import('../pages/workflows/WorkflowExecutionsPage')),
                children: [
                  {
                    index: true,
                    lazy: page(() => import('../pages/workflows/WorkflowExecutionsIndex')),
                  },
                  {
                    path: ':executionId',
                    lazy: page(() => import('../pages/executions/ExecutionDetailsPage')),
                  },
                ],
              },
            ],
          },
          {
            // Opens the run inside its workflow's executions tab.
            path: 'executions/:executionId',
            lazy: page(() => import('../pages/executions/ExecutionRedirect')),
          },
          {
            path: 'settings',
            lazy: page(() => import('../components/layouts/SettingsLayout')),
            children: [
              {
                index: true,
                loader: () => redirect('/settings/profile'),
              },
              {
                path: 'profile',
                lazy: page(() => import('../pages/settings/ProfileSettingsPage')),
              },
              {
                path: 'workspace',
                lazy: page(() => import('../pages/settings/WorkspaceSettingsPage')),
              },
              {
                path: 'members',
                lazy: page(() => import('../pages/settings/MembersSettingsPage')),
              },
            ],
          },
        ],
      },
      {
        path: '*',
        lazy: page(() => import('../pages/NotFoundPage')),
      },
    ],
  },
]

const router = createBrowserRouter(routes)

export default router
