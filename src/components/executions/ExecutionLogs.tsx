import { useState, type FC, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import ListItemButton from '@mui/material/ListItemButton'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { Execution, NodeTypeDescription, WorkflowGraph } from '../../api/types'
import { useIsMobile } from '../../hooks/useIsMobile'
import { formatDuration } from '../../utils/formatDate'
import { nodeIcon } from '../workflow-canvas/nodeIcons'
import { stepDuration, stepInputs } from './executionData'
import ItemsView from './ItemsView'

interface IProps {
  execution: Execution
  graph: WorkflowGraph
  nodeTypeDescriptions: NodeTypeDescription[] | undefined
  /** Index into execution.steps. */
  selectedStep: number | null
  onSelectStep: (index: number) => void
}

const Pane: FC<{ title: ReactNode; count?: number; children: ReactNode }> = ({
  title,
  count,
  children,
}) => {
  const { t } = useTranslation()
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <Typography variant="overline" sx={{ letterSpacing: 2, lineHeight: 1.5 }}>
          {title}
        </Typography>
        {count !== undefined && (
          <Typography variant="caption" color="text.secondary">
            {t('executions.items', { count })}
          </Typography>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-3 pb-3">{children}</div>
    </div>
  )
}

/** Runs of each node, and the items one of them received and sent. */
const ExecutionLogs: FC<IProps> = ({
  execution,
  graph,
  nodeTypeDescriptions,
  selectedStep,
  onSelectStep,
}) => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [outputTab, setOutputTab] = useState(0)
  // Phones show input or output, not both side by side.
  const [pane, setPane] = useState<'input' | 'output'>('output')

  const steps = execution.steps
  const step = selectedStep !== null ? steps[selectedStep] : undefined
  const node = step && graph.nodes.find((n) => n.id === step.nodeId)
  const description = node && nodeTypeDescriptions?.find((d) => d.type === node.type)

  const inputs = step && selectedStep !== null ? stepInputs(steps, selectedStep, graph) : []
  const inputCount = inputs.reduce((sum, input) => sum + input.items.length, 0)
  // Several outputs (If, Switch): one tab each, named by the node type.
  const outputs = step?.output ?? []
  const shownOutput = Math.min(outputTab, Math.max(0, outputs.length - 1))

  const selectStep = (index: number) => {
    setOutputTab(0)
    onSelectStep(index)
  }

  return (
    // Phones: the steps as a strip on top, the data below.
    <div className="h-full flex flex-col md:flex-row min-h-0">
      <Box
        className="shrink-0 flex flex-col min-h-0 md:w-64"
        sx={{ borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider' }}
      >
        <Typography variant="caption" color="text.secondary" className="px-3 pt-2 md:pb-2">
          {execution.finishedAt && execution.startedAt
            ? t(`executions.statusIn.${execution.status}`, {
                duration: formatDuration(
                  Date.parse(execution.finishedAt) - Date.parse(execution.startedAt),
                ),
              })
            : t(`executions.status.${execution.status}`)}
        </Typography>
        <div className="flex gap-1 overflow-x-auto md:flex-col md:gap-0 md:flex-1 md:overflow-x-hidden md:overflow-y-auto px-1 pb-2">
          {steps.map((item, index) => {
            const stepNode = graph.nodes.find((n) => n.id === item.nodeId)
            return (
              <ListItemButton
                key={index}
                selected={index === selectedStep}
                onClick={() => selectStep(index)}
                sx={{
                  borderRadius: 1,
                  gap: 1,
                  py: 0.5,
                  flexGrow: 0,
                  flexShrink: 0,
                  maxWidth: { xs: 220, md: 'none' },
                  '& svg': { fontSize: 18 },
                }}
              >
                <Box sx={{ color: item.status === 'error' ? 'error.main' : 'text.secondary', display: 'flex' }}>
                  {nodeIcon(stepNode?.type ?? '')}
                </Box>
                <Typography variant="body2" noWrap className="flex-1" sx={{ fontWeight: 500 }}>
                  {item.nodeName}
                </Typography>
                <Typography variant="caption" color={item.status === 'error' ? 'error' : 'text.secondary'}>
                  {formatDuration(stepDuration(item))}
                </Typography>
              </ListItemButton>
            )
          })}
          {steps.length === 0 && (
            <Typography variant="body2" color="text.secondary" className="flex-1 text-center py-2 md:py-6">
              {t('executions.logs.noSteps')}
            </Typography>
          )}
        </div>
      </Box>

      {step ? (
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <Box
            className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5"
            sx={{ borderBottom: 1, borderColor: 'divider', '& svg': { fontSize: 18 } }}
          >
            {nodeIcon(node?.type ?? '')}
            <Typography variant="body2" noWrap sx={{ fontWeight: 600, minWidth: 0 }}>
              {step.nodeName}
            </Typography>
            <Typography variant="caption" color={step.status === 'error' ? 'error' : 'text.secondary'}>
              {t(`executions.statusIn.${step.status}`, {
                duration: formatDuration(stepDuration(step)),
              })}
            </Typography>
            {step.pinned && <Chip size="small" label={t('executions.logs.pinned')} />}
            {step.tries > 1 && (
              <Chip size="small" variant="outlined" label={t('executions.logs.tries', { count: step.tries })} />
            )}
          </Box>

          {isMobile && (
            <Tabs
              value={pane}
              onChange={(_, value) => setPane(value)}
              variant="fullWidth"
              sx={{ minHeight: 36, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { minHeight: 36, py: 0 } }}
            >
              <Tab value="input" label={t('executions.logs.input')} />
              <Tab value="output" label={t('executions.logs.output')} />
            </Tabs>
          )}

          <div className="flex-1 flex min-h-0">
            {(!isMobile || pane === 'input') && (
              <Pane title={t('executions.logs.input')} count={inputCount}>
                {inputs.length === 0 ? (
                  <Typography color="text.secondary" className="text-center py-8">
                    {t('executions.logs.noInput')}
                  </Typography>
                ) : (
                  <div className="flex flex-col gap-4">
                    {inputs.map((input, index) => (
                      <div key={index} className="flex flex-col gap-2">
                        {inputs.length > 1 && (
                          <Typography variant="caption" color="text.secondary">
                            {t('executions.logs.from', { node: input.fromNodeName })}
                          </Typography>
                        )}
                        <ItemsView items={input.items} />
                      </div>
                    ))}
                  </div>
                )}
              </Pane>
            )}

            {!isMobile && <Box sx={{ borderLeft: 1, borderColor: 'divider' }} />}

            {(!isMobile || pane === 'output') && (
              <Pane
                title={t('executions.logs.output')}
                count={step.status === 'error' ? undefined : (outputs[shownOutput]?.length ?? 0)}
              >
                {step.error ? (
                  <Alert severity="error">
                    <AlertTitle>{step.error.name}</AlertTitle>
                    {step.error.message}
                    {step.error.itemIndex !== undefined && (
                      <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                        {t('executions.logs.errorItem', { index: step.error.itemIndex + 1 })}
                      </Typography>
                    )}
                  </Alert>
                ) : (
                  <>
                    {outputs.length > 1 && (
                      <Tabs
                        value={shownOutput}
                        onChange={(_, value: number) => setOutputTab(value)}
                        variant="scrollable"
                        sx={{ minHeight: 36, mb: 1 }}
                      >
                        {outputs.map((items, index) => (
                          <Tab
                            key={index}
                            value={index}
                            sx={{ minHeight: 36, py: 0 }}
                            label={`${description?.outputs[index] || t('executions.logs.outputN', { index: index + 1 })} (${items.length})`}
                          />
                        ))}
                      </Tabs>
                    )}
                    <ItemsView items={outputs[shownOutput] ?? []} />
                  </>
                )}
              </Pane>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Typography color="text.secondary">{t('executions.logs.pickNode')}</Typography>
        </div>
      )}
    </div>
  )
}

export default ExecutionLogs
