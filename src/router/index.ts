import { createBrowserRouter, redirect } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import AppLayout from '../components/layouts/AppLayout'
import AuthLayout from '../components/layouts/AuthLayout'
import SettingsLayout from '../components/layouts/SettingsLayout'
import AcceptInvitationPage from '../pages/auth/AcceptInvitationPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import CredentialsPage from '../pages/credentials/CredentialsPage'
import ExecutionDetailsPage from '../pages/executions/ExecutionDetailsPage'
import ExecutionsPage from '../pages/executions/ExecutionsPage'
import NotFoundPage from '../pages/NotFoundPage'
import MembersSettingsPage from '../pages/settings/MembersSettingsPage'
import ProfileSettingsPage from '../pages/settings/ProfileSettingsPage'
import WorkspaceSettingsPage from '../pages/settings/WorkspaceSettingsPage'
import WorkflowEditorPage from '../pages/workflows/WorkflowEditorPage'
import WorkflowsPage from '../pages/workflows/WorkflowsPage'
import { guestOnlyLoader, requireAuthLoader } from './loaders'

export const routes: RouteObject[] = [
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
        Component: LoginPage,
        loader: guestOnlyLoader,
      },
      {
        path: 'register',
        Component: RegisterPage,
        loader: guestOnlyLoader,
      },
      {
        // The link built from CreatedInvitation.token
        path: 'invite/:token',
        Component: AcceptInvitationPage,
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
        path: 'workflows',
        Component: WorkflowsPage,
      },
      {
        // The editor needs the whole screen, so it may later move out of AppLayout.
        path: 'workflows/:workflowId',
        Component: WorkflowEditorPage,
      },
      {
        path: 'executions',
        Component: ExecutionsPage,
      },
      {
        path: 'executions/:executionId',
        Component: ExecutionDetailsPage,
      },
      {
        path: 'credentials',
        Component: CredentialsPage,
      },
      {
        path: 'settings',
        Component: SettingsLayout,
        children: [
          {
            index: true,
            loader: () => redirect('/settings/profile'),
          },
          {
            path: 'profile',
            Component: ProfileSettingsPage,
          },
          {
            path: 'workspace',
            Component: WorkspaceSettingsPage,
          },
          {
            path: 'members',
            Component: MembersSettingsPage,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    Component: NotFoundPage,
  },
]

const router = createBrowserRouter(routes)

export default router
