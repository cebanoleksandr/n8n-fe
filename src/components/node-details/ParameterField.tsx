import type { FC } from 'react'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import { useTranslation } from 'react-i18next'
import type { PropertySchema } from '../../api/types'
import { useExpressionReference } from '../../hooks/api'
import { defaultsOf, isEmptyValue, isPropertyVisible } from '../../utils/properties'
import CodeEditor, { type CodeLanguage } from '../code-editor/CodeEditor'
import FieldLabel from '../ui/FieldLabel'
import ExpressionPreview, { type ExpressionContext } from './ExpressionPreview'

interface IProps {
  property: PropertySchema
  value: unknown
  onChange: (value: unknown) => void
  context: ExpressionContext
  /** The node's type: picks the language of "code" fields. */
  nodeType: string
}

/** Code fields hold JavaScript, except the Postgres node's SQL. */
function codeLanguageOf(nodeType: string): CodeLanguage {
  return nodeType === 'integrations.postgres' ? 'sql' : 'javascript'
}

const NUMBER = /^-?\d+(\.\d+)?$/

/** A number, or text such as an expression ("{{ $json.count }}"). */
function parseNumberInput(text: string): unknown {
  return NUMBER.test(text.trim()) ? Number(text) : text
}

/** A "list" parameter: Set's fields, If's conditions, Switch's rules… */
const ListField: FC<IProps> = ({ property, value, onChange, context, nodeType }) => {
  const { t } = useTranslation()
  const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : []
  const itemProperties = property.itemProperties ?? []

  const updateItem = (index: number, patch: Record<string, unknown>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))

  return (
    <div className="flex flex-col gap-2">
      <div>
        <FieldLabel>{property.displayName}</FieldLabel>
        {property.description && (
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: -0.5 }}>
            {property.description}
          </Typography>
        )}
      </div>

      {items.map((item, index) => (
        <Paper
          key={index}
          className="relative flex flex-col gap-3 p-3 pr-12"
          sx={{ bgcolor: 'background.default' }}
        >
          {itemProperties
            // Missing fields of an item mean their defaults, as for the node.
            .filter((itemProperty) => isPropertyVisible(itemProperty, { ...defaultsOf(itemProperties), ...item }))
            .map((itemProperty) => (
              <ParameterField
                key={itemProperty.name}
                property={itemProperty}
                value={item[itemProperty.name] ?? itemProperty.default}
                onChange={(next) => updateItem(index, { [itemProperty.name]: next })}
                context={context}
                nodeType={nodeType}
              />
            ))}
          <Tooltip title={t('nodeDetails.removeItem')}>
            <IconButton
              size="small"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
      ))}

      <div>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => onChange([...items, defaultsOf(itemProperties)])}
        >
          {t('nodeDetails.addItem', { name: property.displayName })}
        </Button>
      </div>
    </div>
  )
}

/** One node parameter, as the control its type calls for. */
const ParameterField: FC<IProps> = (props) => {
  const { property, value, onChange, context, nodeType } = props
  const { t } = useTranslation()
  const reference = useExpressionReference()
  const label = property.displayName
  const missing = !!property.required && isEmptyValue(value)
  const helperText = missing ? t('nodeDetails.required') : property.description

  switch (property.type) {
    case 'list':
      return <ListField {...props} />

    case 'boolean':
      return (
        <div>
          <FormControlLabel
            label={<Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>}
            control={<Switch size="small" checked={!!value} onChange={(_, checked) => onChange(checked)} />}
            sx={{ ml: 0, gap: 1 }}
          />
          {property.description && <FormHelperText>{property.description}</FormHelperText>}
        </div>
      )

    case 'options':
      return (
        <div>
          <FieldLabel required={property.required} error={missing}>
            {label}
          </FieldLabel>
          <TextField
            select
            size="small"
            fullWidth
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(e) => {
              // Option values may be numbers or booleans: keep their type.
              const option = property.options?.find((o) => String(o.value) === e.target.value)
              onChange(option ? option.value : e.target.value)
            }}
            error={missing}
            helperText={helperText}
            slotProps={{ htmlInput: { 'aria-label': label } }}
          >
            {property.options?.map((option) => (
              <MenuItem key={String(option.value)} value={String(option.value)}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        </div>
      )

    case 'number':
      // A plain field: numbers, or an expression such as {{ $json.count }}.
      return (
        <div>
          <FieldLabel required={property.required} error={missing}>
            {label}
          </FieldLabel>
          <TextField
            size="small"
            fullWidth
            placeholder={property.placeholder}
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(e) => onChange(parseNumberInput(e.target.value))}
            slotProps={{ htmlInput: { 'aria-label': label } }}
            error={missing}
            helperText={helperText}
          />
          {typeof value === 'string' && value.includes('{{') && (
            <ExpressionPreview expression={value} context={context} />
          )}
        </div>
      )

    default: {
      const isCode = property.type === 'code'
      const text = value === undefined || value === null ? '' : String(value)
      return (
        <div>
          <CodeEditor
            value={text}
            onChange={onChange}
            label={label}
            required={property.required}
            placeholder={property.placeholder}
            error={missing}
            helperText={helperText}
            language={isCode ? codeLanguageOf(nodeType) : property.type === 'json' ? 'json' : 'text'}
            code={isCode}
            minRows={isCode ? 8 : property.type === 'json' ? 4 : 1}
            // Code runs as is; every other text parameter takes {{ }}.
            expressions={!isCode}
            hints={{ ...context, reference: reference.data }}
          />
          {!isCode && text.includes('{{') && <ExpressionPreview expression={text} context={context} />}
        </div>
      )
    }
  }
}

export default ParameterField
