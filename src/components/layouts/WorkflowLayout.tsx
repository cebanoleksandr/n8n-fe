import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Link from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { useCurrentMembership, useSetWorkflowActive, useWorkflow } from '../../hooks/api'

/** The editor and the workflow's own executions, under a shared header. */
const WorkflowLayout = () => {
  const { t } = useTranslation()
  const { workflowId } = useParams()
  const { pathname } = useLocation()
  const membership = useCurrentMembership()
  const { data: workflow, isPending, isError } = useWorkflow(workflowId)
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
        className="shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 h-14"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Breadcrumbs className="min-w-0">
          <Link component={RouterLink} to="/workflows" underline="hover" color="text.secondary">
            {membership?.workspaceName ?? t('nav.overview')}
          </Link>
          {isPending ? (
            <Skeleton width={120} />
          ) : (
            <Typography color="text.primary" noWrap>
              {isError ? t('workflow.notFound') : workflow.name}
            </Typography>
          )}
        </Breadcrumbs>

        <Tabs value={current} sx={{ minHeight: 0 }}>
          {tabs.map((tab) => (
            <Tab
              key={tab.to}
              value={tab.to}
              label={t(tab.label)}
              component={NavLink}
              to={tab.to}
              end
              sx={{ minHeight: 56 }}
            />
          ))}
        </Tabs>

        <div className="flex items-center justify-end gap-3">
          {workflow && (
            <>
              <Chip size="small" variant="outlined" label={`v${workflow.version}`} />
              <FormControlLabel
                label={t(workflow.active ? 'workflow.active' : 'workflow.inactive')}
                labelPlacement="start"
                control={
                  <Switch
                    checked={workflow.active}
                    disabled={setActive.isPending}
                    onChange={(_, active) => setActive.mutate({ id: workflow.id, active })}
                  />
                }
              />
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
