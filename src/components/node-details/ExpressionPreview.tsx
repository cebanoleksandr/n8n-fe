import { useEffect, useState, type FC } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { getErrorMessage } from '../../api/client'
import { useEvaluateExpression } from '../../hooks/api'
import { fonts } from '../../theme'

const DELAY_MS = 400

export interface ExpressionContext {
  /** The first input item, as $json. */
  json?: Record<string, unknown>
  /** Outputs of earlier nodes by name, for $('Node'). */
  nodes?: Record<string, Record<string, unknown>[]>
}

interface IProps {
  expression: string
  context: ExpressionContext
}

function show(value: unknown) {
  if (value === undefined) return 'undefined'
  return typeof value === 'string' ? value : JSON.stringify(value)
}

/** The value of a {{ }} expression on the last run's data, under its field. */
const ExpressionPreview: FC<IProps> = ({ expression, context }) => {
  const { t } = useTranslation()
  // Asked only once typing pauses.
  const [settled, setSettled] = useState(expression)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(expression), DELAY_MS)
    return () => clearTimeout(timer)
  }, [expression])

  const result = useEvaluateExpression({ expression: settled, ...context })
  if (!settled.includes('{{')) return null

  return (
    <Box
      className="mt-1 px-2 py-1 rounded"
      sx={{ bgcolor: 'action.hover', fontFamily: fonts.mono, fontSize: 12, wordBreak: 'break-all' }}
    >
      <Typography variant="caption" color="text.secondary" component="span">
        {t('nodeDetails.result')}{' '}
      </Typography>
      {result.isError ? (
        <Box component="span" sx={{ color: 'error.main' }}>
          {getErrorMessage(result.error)}
        </Box>
      ) : (
        <Box component="span" sx={{ opacity: result.isPlaceholderData ? 0.6 : 1 }}>
          {result.isPending ? '…' : show(result.data)}
        </Box>
      )}
    </Box>
  )
}

export default ExpressionPreview
