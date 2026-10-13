import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import BoltIcon from '@mui/icons-material/Bolt'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'

export type CanvasNodeStatus = 'success' | 'error' | 'running'

export type CanvasNodeData = {
  name: string
  /** Shown under the name, e.g. the node type. */
  subtitle?: string
  icon: React.ReactNode
  isTrigger: boolean
  disabled?: boolean
  inputs: number
  /** One label per output; empty strings for unnamed ones. */
  outputs: string[]
  /** Absent: did not run (dimmed when the canvas shows a run). */
  status?: CanvasNodeStatus
  dimmed?: boolean
}

export type CanvasNodeType = Node<CanvasNodeData, 'workflowNode'>

const NODE_SIZE = 80

const STATUS_COLOR: Record<CanvasNodeStatus, string> = {
  success: 'success.main',
  error: 'error.main',
  running: 'info.main',
}

/** Spreads handles evenly down the node's side. */
function handleTop(index: number, count: number) {
  return `${((index + 1) / (count + 1)) * 100}%`
}

// Inline: React Flow's stylesheet is unlayered, so it would beat MUI's sx
// (which sits in the "mui" layer) and stack every handle at top: 50%.
const handleStyle = {
  width: 10,
  height: 10,
  background: 'var(--mui-palette-background-paper)',
  borderColor: 'var(--mui-palette-text-secondary)',
}

const CanvasNode = ({ data, selected }: NodeProps<CanvasNodeType>) => {
  const borderColor = data.status
    ? STATUS_COLOR[data.status]
    : selected
      ? 'primary.main'
      : 'divider'

  return (
    <Box
      className="relative flex flex-col items-center"
      sx={{ width: NODE_SIZE, opacity: data.dimmed || data.disabled ? 0.45 : 1 }}
    >
      {data.isTrigger && (
        <BoltIcon
          fontSize="small"
          color="warning"
          sx={{ position: 'absolute', left: -22, top: NODE_SIZE / 2 - 10 }}
        />
      )}

      <Box
        className="relative flex items-center justify-center"
        sx={{
          width: NODE_SIZE,
          height: NODE_SIZE,
          bgcolor: 'background.paper',
          border: 2,
          borderColor,
          // Triggers are rounded on their input side, like in n8n.
          borderRadius: data.isTrigger ? '40px 8px 8px 40px' : 2,
          boxShadow: selected ? 4 : 0,
          color: 'text.primary',
          '& svg': { fontSize: 36 },
        }}
      >
        {data.icon}

        {data.status === 'success' && (
          <CheckIcon color="success" sx={{ position: 'absolute', right: 4, bottom: 4, fontSize: '18px !important' }} />
        )}
        {data.status === 'error' && (
          <CloseIcon color="error" sx={{ position: 'absolute', right: 4, bottom: 4, fontSize: '18px !important' }} />
        )}

        {Array.from({ length: data.inputs }, (_, i) => (
          <Handle
            key={`in-${i}`}
            id={`in-${i}`}
            type="target"
            position={Position.Left}
            isConnectable={false}
            style={{ ...handleStyle, top: handleTop(i, data.inputs) }}
          />
        ))}
        {data.outputs.map((label, i) => (
          <Handle
            key={`out-${i}`}
            id={`out-${i}`}
            type="source"
            position={Position.Right}
            isConnectable={false}
            style={{ ...handleStyle, top: handleTop(i, data.outputs.length) }}
          >
            {label && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ position: 'absolute', left: 12, top: -9, fontSize: 10, whiteSpace: 'nowrap', pointerEvents: 'none' }}
              >
                {label}
              </Typography>
            )}
          </Handle>
        ))}
      </Box>

      {/* Wider than the node and centered under it, outside its box. */}
      <Box
        className="absolute flex flex-col items-center text-center"
        sx={{ top: NODE_SIZE + 6, left: '50%', transform: 'translateX(-50%)', width: 180 }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {data.name}
        </Typography>
        {data.subtitle && (
          <Typography variant="caption" color="text.secondary">
            {data.subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default memo(CanvasNode)
