import { useId, useMemo, useState, type FC, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
import { useTranslation } from 'react-i18next'
import type { Execution, NodeTypeDescription, WorkflowGraph, WorkflowNode } from '../../api/types'
import { useIsMobile } from '../../hooks/useIsMobile'
import { defaultsOf, isPropertyVisible } from '../../utils/properties'
import { nodeInputs, outputsByNodeName } from '../executions/executionData'
import ItemsJson from '../executions/ItemsJson'
import ItemsView from '../executions/ItemsView'
import BasePopup from '../popups/BasePopup'
import { nodeIcon } from '../workflow-canvas/nodeIcons'
import NodeCredentials from './NodeCredentials'
import NodeSettings from './NodeSettings'
import DataViewToggle from './DataViewToggle'
import ParameterField from './ParameterField'
import { PinnedDataEditor, PinnedDataView } from './PinnedData'
import { useDataView } from './useDataView'
import WebhookUrls, { type TestWebhookControl } from './WebhookUrls'

interface IProps {
  node: WorkflowNode
  description: NodeTypeDescription | undefined
  graph: WorkflowGraph
  /** The editor's last run, for input and output data. */
  execution: Execution | undefined
  /** This node is executing right now. */
  isRunning: boolean
  canEdit: boolean
  onChange: (node: WorkflowNode) => void
  /** Renames through the editor, which also updates expressions using the name. */
  onRename: (name: string) => void
  /** Runs this node and what it depends on (a Webhook node listens instead). */
  onTest: () => void
  /** Webhook nodes: listening on the test URL. */
  testWebhook?: TestWebhookControl
  /** Output pinned for test runs, if any. */
  pinned: Record<string, unknown>[] | undefined
  /** Saves (or, with null, removes) the pinned output; resolves when saved. */
  onSetPinned: (items: Record<string, unknown>[] | null) => Promise<boolean>
  isSavingPin: boolean
  onClose: () => void
}

/** Header height shared by the three columns, so their tops line up. */
const HEADER_HEIGHT = 48

const Column: FC<{ title: ReactNode; extra?: ReactNode; children: ReactNode; className?: string }> = ({
  title,
  extra,
  children,
  className = '',
}) => (
  <Box className={`flex flex-col min-h-0 min-w-0 ${className}`} sx={{ bgcolor: 'background.default' }}>
    <Box
      className="shrink-0 flex items-center justify-between gap-2 px-4"
      sx={{ height: HEADER_HEIGHT, borderBottom: 1, borderColor: 'divider' }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, lineHeight: 1, fontWeight: 600 }}>
        {title}
      </Typography>
      {extra}
    </Box>
    <div className="flex-1 min-h-0 overflow-auto p-4">{children}</div>
  </Box>
)

/** Centered hint in an empty column. */
const EmptyState: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-4">{children}</div>
)

/** n8n's node view: input on the left, settings in the middle, output on the right. */
const NodeDetailsPopup: FC<IProps> = ({
  node,
  description,
  graph,
  execution,
  isRunning,
  canEdit,
  onChange,
  onRename,
  onTest,
  testWebhook,
  pinned,
  onSetPinned,
  isSavingPin,
  onClose,
}) => {
  const { t } = useTranslation()
  const titleId = useId()
  const isMobile = useIsMobile()
  // Phones show one of the three columns at a time.
  const [mobileColumn, setMobileColumn] = useState<'input' | 'main' | 'output'>('main')
  const [tab, setTab] = useState<'parameters' | 'settings'>('parameters')
  const [outputTab, setOutputTab] = useState(0)
  const [inputView, setInputView] = useDataView('input')
  const [outputView, setOutputView] = useDataView('output')
  // Editing the pinned output as JSON: what the editor starts from.
  const [pinDraft, setPinDraft] = useState<Record<string, unknown>[] | null>(null)
  const [name, setName] = useState(node.name)
  const [nameError, setNameError] = useState<string | null>(null)

  const steps = useMemo(() => execution?.steps ?? [], [execution])
  const isTrigger = description?.group === 'trigger'
  const inputs = useMemo(() => nodeInputs(steps, graph, node.id), [steps, graph, node.id])
  const step = steps.findLast((s) => s.nodeId === node.id)
  const outputs = step?.output ?? []
  const shownOutput = Math.min(outputTab, Math.max(0, outputs.length - 1))

  // What expressions in the fields are previewed against.
  const context = useMemo(
    () => ({ json: inputs[0]?.items[0]?.json, nodes: outputsByNodeName(steps) }),
    [inputs, steps],
  )

  // A missing parameter means its default, as the backend reads it: show it,
  // and judge displayOptions by it.
  const parameters = useMemo(
    () => ({ ...defaultsOf(description?.properties ?? []), ...node.parameters }),
    [description, node.parameters],
  )
  const setParameter = (key: string, value: unknown) =>
    onChange({ ...node, parameters: { ...node.parameters, [key]: value } })

  const commitName = () => {
    const next = name.trim()
    if (next === node.name) return setNameError(null)
    if (!next) return setNameError(t('nodeDetails.nameRequired'))
    if (graph.nodes.some((other) => other.id !== node.id && other.name === next)) {
      return setNameError(t('nodeDetails.nameTaken'))
    }
    setNameError(null)
    onRename(next)
  }

  const credentialSlots = (description?.credentials ?? []).filter((slot) =>
    isPropertyVisible(slot, parameters),
  )

  const savePinned = async (items: Record<string, unknown>[] | null) => {
    if (await onSetPinned(items)) setPinDraft(null)
  }

  const renderOutput = () => {
    if (pinDraft) {
      return (
        <PinnedDataEditor
          initial={pinDraft}
          isSaving={isSavingPin}
          onSave={(items) => void savePinned(items)}
          onCancel={() => setPinDraft(null)}
        />
      )
    }
    if (pinned) {
      return (
        <PinnedDataView
          items={pinned}
          view={outputView}
          canEdit={canEdit}
          isSaving={isSavingPin}
          onEdit={() => setPinDraft(pinned)}
          onUnpin={() => void savePinned(null)}
        />
      )
    }
    if (isRunning) {
      return (
        <EmptyState>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">
            {t('nodeDetails.executing')}
          </Typography>
        </EmptyState>
      )
    }
    if (!step) {
      return (
        <EmptyState>
          <Typography variant="body2" color="text.secondary" className="max-w-xs">
            {t('nodeDetails.noOutput')}
          </Typography>
          {canEdit && (
            <div className="flex flex-col items-center gap-2">
              <Button variant="outlined" startIcon={<PlayArrowIcon />} onClick={onTest}>
                {t('nodeDetails.test')}
              </Button>
              {/* Pinned data needs no run: write it by hand. */}
              <Button size="small" startIcon={<PushPinOutlinedIcon />} onClick={() => setPinDraft([{}])}>
                {t('nodeDetails.pin.setTestData')}
              </Button>
            </div>
          )}
        </EmptyState>
      )
    }
    if (step.error) {
      return (
        <Alert severity="error">
          <AlertTitle>{step.error.name}</AlertTitle>
          {step.error.message}
        </Alert>
      )
    }
    return (
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
        {outputView === 'json' ? (
          <ItemsJson items={outputs[shownOutput] ?? []} />
        ) : (
          <ItemsView items={outputs[shownOutput] ?? []} />
        )}
      </>
    )
  }

  return (
    <BasePopup
      isVisible
      onClose={onClose}
      labelledBy={titleId}
      style={{
        // Phones: the whole screen.
        width: isMobile ? '100vw' : '95vw',
        maxWidth: isMobile ? '100vw' : '95vw',
        height: isMobile ? '100dvh' : '90vh',
        maxHeight: isMobile ? '100dvh' : undefined,
        borderRadius: isMobile ? 0 : undefined,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        className="shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Box
          className="shrink-0 hidden sm:flex items-center justify-center rounded-lg"
          sx={{ width: 40, height: 40, bgcolor: 'action.hover', color: 'text.primary', '& svg': { fontSize: 24 } }}
        >
          {nodeIcon(node.type)}
        </Box>
        <div className="min-w-0 flex-1">
          <InputBase
            id={titleId}
            value={name}
            readOnly={!canEdit}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') {
                // Undo the rename instead of closing the panel.
                e.stopPropagation()
                setName(node.name)
                setNameError(null)
              }
            }}
            inputProps={{ maxLength: 128, 'aria-label': t('nodeDetails.name') }}
            sx={{
              fontSize: 16,
              fontWeight: 600,
              maxWidth: 480,
              width: '100%',
              px: 0.75,
              ml: -0.75,
              borderRadius: 1,
              border: 1,
              borderColor: 'transparent',
              '&:hover': canEdit ? { borderColor: 'divider' } : undefined,
              '&.Mui-focused': { borderColor: 'primary.main' },
            }}
          />
          <Typography variant="caption" color={nameError ? 'error' : 'text.secondary'} component="div">
            {nameError ?? description?.displayName ?? node.type}
          </Typography>
        </div>
        {canEdit && (
          <Button
            variant="contained"
            size={isMobile ? 'small' : 'medium'}
            startIcon={<PlayArrowIcon />}
            onClick={onTest}
            loading={isRunning}
            loadingPosition="start"
            disabled={node.disabled}
          >
            {t('nodeDetails.test')}
          </Button>
        )}
        <IconButton onClick={onClose} aria-label={t('common.close')}>
          <CloseIcon />
        </IconButton>
      </Box>

      {isMobile && (
        <Tabs
          value={mobileColumn}
          onChange={(_, value) => setMobileColumn(value)}
          variant="fullWidth"
          sx={{ minHeight: 40, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { minHeight: 40, py: 0 } }}
        >
          {!isTrigger && <Tab value="input" label={t('executions.logs.input')} />}
          <Tab value="main" label={t('nodeDetails.parameters')} />
          <Tab value="output" label={t('executions.logs.output')} />
        </Tabs>
      )}

      <div className="flex-1 min-h-0 flex">
        {!isTrigger && (!isMobile || mobileColumn === 'input') && (
          <Column
            title={t('executions.logs.input')}
            className={isMobile ? 'flex-1' : 'w-[30%]'}
            extra={
              inputs.length > 0 && (
                <div className="flex items-center gap-2">
                  <Typography variant="caption" color="text.secondary">
                    {t('executions.items', {
                      count: inputs.reduce((sum, input) => sum + input.items.length, 0),
                    })}
                  </Typography>
                  <DataViewToggle value={inputView} onChange={setInputView} />
                </div>
              )
            }
          >
            {inputs.length === 0 ? (
              <EmptyState>
                <Typography variant="body2" color="text.secondary" className="max-w-xs">
                  {t('nodeDetails.noInput')}
                </Typography>
              </EmptyState>
            ) : (
              <div className="flex flex-col gap-4">
                {inputs.map((input, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    {inputs.length > 1 && (
                      <Typography variant="caption" color="text.secondary">
                        {t('executions.logs.from', { node: input.fromNodeName })}
                      </Typography>
                    )}
                    {inputView === 'json' ? (
                      <ItemsJson items={input.items} />
                    ) : (
                      <ItemsView
                        items={input.items}
                        // One input: $json. Several: name the node they came from.
                        dragExpression={
                          canEdit
                            ? inputs.length > 1
                              ? (path) => `{{ $(${JSON.stringify(input.fromNodeName)}).item.json${path} }}`
                              : (path) => `{{ $json${path} }}`
                            : undefined
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Column>
        )}

        {(!isMobile || mobileColumn === 'main') && (
          <Box
            className="flex-1 min-w-0 flex flex-col min-h-0"
            sx={{
              borderLeft: isTrigger || isMobile ? 0 : 1,
              borderRight: isMobile ? 0 : 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, value) => setTab(value)}
              sx={{
                px: 2,
                minHeight: HEADER_HEIGHT,
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': { minHeight: HEADER_HEIGHT },
              }}
            >
              <Tab value="parameters" label={t('nodeDetails.parameters')} />
              <Tab value="settings" label={t('nodeDetails.settingsTab')} />
            </Tabs>
            {/* Viewers see the settings but can't change them. */}
            <div className="flex-1 min-h-0 overflow-auto px-4 py-4 sm:px-6 sm:py-5" inert={!canEdit}>
              {/* Fields stay readable on wide screens instead of stretching. */}
              <div className="max-w-2xl mx-auto">
              {tab === 'parameters' ? (
                <div className="flex flex-col gap-5">
                  {description?.description && (
                    <Typography variant="body2" color="text.secondary">
                      {description.description}
                    </Typography>
                  )}
                  {node.type === 'core.webhook' && testWebhook && (
                    <WebhookUrls
                      method={String(parameters.method ?? 'POST')}
                      path={String(parameters.path ?? '')}
                      canEdit={canEdit}
                      testWebhook={testWebhook}
                      onGeneratePath={() => setParameter('path', crypto.randomUUID())}
                    />
                  )}
                  {credentialSlots.length > 0 && (
                    <NodeCredentials
                      descriptions={credentialSlots}
                      value={node.credentials}
                      onChange={(credentials) => onChange({ ...node, credentials })}
                    />
                  )}
                  {description?.properties
                    .filter((property) => isPropertyVisible(property, parameters))
                    .map((property) => (
                      <ParameterField
                        key={property.name}
                        property={property}
                        value={parameters[property.name]}
                        onChange={(value) => setParameter(property.name, value)}
                        context={context}
                        nodeType={node.type}
                      />
                    ))}
                  {description && description.properties.length === 0 && (
                    <Typography color="text.secondary">{t('nodeDetails.noParameters')}</Typography>
                  )}
                  {!description && <Alert severity="warning">{t('nodeDetails.unknownType', { type: node.type })}</Alert>}
                </div>
              ) : (
                <NodeSettings node={node} onChange={(patch) => onChange({ ...node, ...patch })} />
              )}
              </div>
            </div>
          </Box>
        )}

        {(!isMobile || mobileColumn === 'output') && (
          <Column
            title={t('executions.logs.output')}
            className={isMobile ? 'flex-1' : isTrigger ? 'w-[40%]' : 'w-[30%]'}
            extra={
              pinDraft ? null : pinned ? (
                <div className="flex items-center gap-2">
                  <Typography variant="caption" color="text.secondary">
                    {t('executions.items', { count: pinned.length })}
                  </Typography>
                  <DataViewToggle value={outputView} onChange={setOutputView} />
                </div>
              ) : (
                step && !step.error && (
                  <div className="flex items-center gap-2">
                    <Typography variant="caption" color="text.secondary">
                      {t('executions.items', { count: outputs[shownOutput]?.length ?? 0 })}
                    </Typography>
                    <DataViewToggle value={outputView} onChange={setOutputView} />
                    {canEdit && (
                      <Tooltip title={t('nodeDetails.pin.pin')}>
                        <IconButton
                          size="small"
                          aria-label={t('nodeDetails.pin.pin')}
                          disabled={isSavingPin}
                          // The first output: the one pinned data replaces.
                          onClick={() => void onSetPinned((outputs[0] ?? []).map((item) => item.json))}
                        >
                          <PushPinOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                )
              )
            }
          >
            {renderOutput()}
          </Column>
        )}
      </div>
    </BasePopup>
  )
}

export default NodeDetailsPopup
