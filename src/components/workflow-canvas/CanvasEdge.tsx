import { memo, useState } from 'react'
import Box from '@mui/material/Box'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from '@xyflow/react'

export type CanvasEdgeData = {
  /** E.g. "3 items" after a run. */
  label?: string
  color: string
  /** Editable canvas: the hover button removes the connection. */
  onDelete?: () => void
  deleteLabel?: string
}

export type CanvasEdgeType = Edge<CanvasEdgeData, 'workflowEdge'>

/** A connection; hovering it in the editor shows a delete button, as in n8n. */
const CanvasEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
  selected,
}: EdgeProps<CanvasEdgeType>) => {
  const [hovered, setHovered] = useState(false)
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  // Selected too: a tap selects it on touch screens, which have no hover.
  const showDelete = !!data?.onDelete && (hovered || !!selected)

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* interactionWidth: a wide invisible path, so the thin line is easy to hover. */}
      <BaseEdge path={path} markerEnd={markerEnd} style={style} interactionWidth={24} />
      <EdgeLabelRenderer>
        {(data?.label || showDelete) && (
          <Box
            // nodrag/nopan: a click here must not pan the canvas.
            className="nodrag nopan absolute flex items-center gap-1"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            sx={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {data?.label && !showDelete && (
              <Box
                component="span"
                sx={{
                  px: 0.75,
                  borderRadius: 1,
                  fontSize: 11,
                  color: data.color,
                  bgcolor: 'background.default',
                }}
              >
                {data.label}
              </Box>
            )}
            {showDelete && (
              <Box
                component="button"
                type="button"
                aria-label={data.deleteLabel}
                title={data.deleteLabel}
                onClick={(e) => {
                  e.stopPropagation()
                  data.onDelete?.()
                }}
                className="flex items-center justify-center cursor-pointer"
                sx={{
                  width: 26,
                  height: 26,
                  p: 0,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  color: 'text.secondary',
                  '&:hover': { color: 'error.main', borderColor: 'error.main' },
                  '& svg': { fontSize: 16 },
                }}
              >
                <DeleteOutlineIcon />
              </Box>
            )}
          </Box>
        )}
      </EdgeLabelRenderer>
    </g>
  )
}

export default memo(CanvasEdge)
