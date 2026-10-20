import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Link from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { useCurrentMembership, useHasRole, useSetWorkflowActive, useWorkflow } from '../../hooks/api'
import { useIsMobile } from '../../hooks/useIsMobile'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { canActivate } from '../../utils/activation'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import WorkflowMenu from '../workflow-editor/WorkflowMenu'
import WorkflowNameField from '../workflow-editor/WorkflowNameField'

/** The editor and the workflow's own executions, under a shared header. */
const WorkflowLayout = () => {
  const { t } = useTranslation()
  const { workflowId } = useParams()
  const { pathname } = useLocation()
  const membership = useCurrentMembership()
  const canEdit = useHasRole('editor')
  const isMobile = useIsMobile()
  const dispatch = useAppDispatch()
  const { data: workflow, isPending, isError } = useWorkflow(workflowId)
  const activatable = !!workflow && canActivate(workflow.graph)
  const setActive = useSetWorkflowActive()

  const base = `/workflows/${workflowId}`
  const tabs = [
    { to: base, label: 'workflow.tabs.editor' },
    { to: `${base}/executions`, label: 'workflow.tabs.executions' },
  ]
  // The executions tab also covers one run (/executions/:id).
  const current = pathname.startsWith(`${base}/executions`)
    ? `${base}/executions`
    : pathname === base
      ? base
      : false

  return (
    <div className="h-full flex flex-col">
      <Box
        component="header"
        // Phones: name and switch on one row, the tabs below them.
        className="shrink-0 grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[1fr_auto_1fr] items-center
                   gap-x-2 md:gap-4 px-2 md:px-4 pt-1 md:pt-0 md:h-14"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <div className="flex items-center gap-1 min-w-0">
          <Breadcrumbs className="min-w-0" sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' }, '& .MuiBreadcrumbs-li': { minWidth: 0 } }}>
            {/* Phones reach the overview from the menu: the name gets the room. */}
            {!isMobile && (
              <Link component={RouterLink} to="/workflows" underline="hover" color="text.secondary" noWrap>
                {membership?.workspaceName ?? t('nav.overview')}
              </Link>
            )}
            {isPending ? (
              <Skeleton width={120} />
            ) : isError ? (
              <Typography color="text.primary" noWrap>
                {t('workflow.notFound')}
              </Typography>
            ) : (
              <WorkflowNameField workflow={workflow} canEdit={canEdit} />
            )}
          </Breadcrumbs>
          {workflow && <WorkflowMenu workflow={workflow} canEdit={canEdit} />}
        </div>

        <Tabs value={current} className="col-span-2 order-last md:col-span-1 md:order-none" sx={{ minHeight: 0 }}>
          {tabs.map((tab) => (
            <Tab
              key={tab.to}
              value={tab.to}
              label={t(tab.label)}
              component={NavLink}
              to={tab.to}
              end
              sx={{ minHeight: { xs: 44, md: 56 } }}
            />
          ))}
        </Tabs>

        <div className="flex items-center justify-end gap-3">
          {workflow && (
            <>
              <Chip
                size="small"
                variant="outlined"
                label={`v${workflow.version}`}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              />
              <Tooltip
                // Explains a disabled switch; an active workflow can always be turned off.
                title={!workflow.active && !activatable ? t('workflow.activateHint') : ''}
              >
                <FormControlLabel
                  label={t(workflow.active ? 'workflow.active' : 'workflow.inactive')}
                  labelPlacement="start"
                  // Phones: the switch alone, its state says enough.
                  sx={{ '& .MuiFormControlLabel-label': { display: { xs: 'none', sm: 'block' } } }}
                  control={
                    <Switch
                      checked={workflow.active}
                      disabled={!canEdit || setActive.isPending || (!workflow.active && !activatable)}
                      onChange={(_, active) =>
                        setActive.mutate(
                          { id: workflow.id, active },
                          {
                            // The server says why (e.g. a webhook path taken by another workflow).
                            onError: (error) =>
                              dispatch(setAlertAC({ text: apiErrorMessage(error, t), mode: 'error' })),
                          },
                        )
                      }
                    />
                  }
                />
              </Tooltip>
            </>
          )}
        </div>
      </Box>

      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </div>
  )
}

export default WorkflowLayout
