import { useEffect, useRef, type FC } from 'react'
import Box from '@mui/material/Box'
import FormHelperText from '@mui/material/FormHelperText'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, HighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorState, type Extension } from '@codemirror/state'
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
  placeholder as placeholderExtension,
  tooltips,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { fonts } from '../../theme'
import FieldLabel from '../ui/FieldLabel'
import { expressionCompletions, expressionHighlight, type ExpressionHints } from './expressionLanguage'

export type CodeLanguage = 'text' | 'javascript' | 'sql' | 'json'

interface IProps {
  value: string
  onChange: (value: string) => void
  language?: CodeLanguage
  /** {{ }} highlighting and autocomplete (parameters accept expressions). */
  expressions?: boolean
  hints?: ExpressionHints
  label?: string
  required?: boolean
  placeholder?: string
  helperText?: string
  error?: boolean
  /** Code: line numbers and a taller box. */
  code?: boolean
  minRows?: number
  readOnly?: boolean
  /** Px; omit for the default (480 for code, 240 otherwise), null to grow freely. */
  maxHeight?: number | null
}

// Theme colors, so the highlighting follows light and dark mode.
const highlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword, tags.modifier], color: 'var(--mui-palette-secondary-main)' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--mui-palette-success-main)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--mui-palette-warning-main)' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--mui-palette-text-disabled)', fontStyle: 'italic' },
  { tag: [tags.propertyName, tags.attributeName], color: 'var(--mui-palette-info-main)' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: 'var(--mui-palette-primary-main)' },
  { tag: [tags.typeName, tags.className], color: 'var(--mui-palette-secondary-main)' },
])

/**
 * The editor's own look. It has to be an EditorView theme: CodeMirror's
 * stylesheet is unlayered and would beat MUI's sx (in the "mui" layer).
 */
function editorTheme({ mono, minRows, maxHeight }: { mono: boolean; minRows: number; maxHeight: number | null }) {
  return EditorView.theme({
    '&': { backgroundColor: 'transparent', borderRadius: 'inherit', overflow: 'hidden' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': {
      fontFamily: mono ? fonts.mono : fonts.sans,
      fontSize: mono ? '13px' : '14px',
      lineHeight: `${LINE_HEIGHT}px`,
      // One row: 36px + borders, the height of MUI's small fields at 14px.
      minHeight: `${minRows * LINE_HEIGHT + 16}px`,
      maxHeight: maxHeight === null ? 'none' : `${maxHeight}px`,
    },
    '.cm-content': { padding: '8px 0', caretColor: 'var(--mui-palette-text-primary)' },
    '.cm-line': { padding: '0 12px' },
    '.cm-gutters': {
      backgroundColor: 'var(--mui-palette-action-hover)',
      color: 'var(--mui-palette-text-disabled)',
      border: 'none',
    },
    '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--mui-palette-action-hover)' },
    '.cm-placeholder': { color: 'var(--mui-palette-text-disabled)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--mui-palette-text-primary)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'var(--mui-palette-action-selected)',
    },
    '.cm-expression': {
      color: 'var(--mui-palette-primary-main)',
      backgroundColor: 'var(--mui-palette-action-hover)',
      borderRadius: '3px',
    },
    '&.cm-focused .cm-matchingBracket': {
      backgroundColor: 'var(--mui-palette-action-selected)',
      outline: 'none',
    },
  })
}

/** Grammars load on first use: most fields are plain text with {{ }}. */
async function loadLanguage(language: CodeLanguage): Promise<Extension> {
  switch (language) {
    case 'javascript':
      return (await import('@codemirror/lang-javascript')).javascript()
    case 'sql': {
      const { sql, PostgreSQL } = await import('@codemirror/lang-sql')
      return sql({ dialect: PostgreSQL })
    }
    case 'json':
      return (await import('@codemirror/lang-json')).json()
    default:
      return []
  }
}

const LINE_HEIGHT = 20

/**
 * Completion popups go to <body>: inside the editor they would be cut off by
 * the scrolling panel (and the popup's transform). CodeMirror carries its
 * theme classes along, so they are styled here rather than with sx.
 */
const tooltipTheme = EditorView.theme({
  '.cm-tooltip': {
    zIndex: '1600',
    backgroundColor: 'var(--mui-palette-background-paper)',
    color: 'var(--mui-palette-text-primary)',
    border: '1px solid var(--mui-palette-divider)',
    borderRadius: '8px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
    fontFamily: fonts.sans,
    fontSize: '13px',
    overflow: 'hidden',
  },
  '.cm-tooltip-autocomplete > ul': { maxHeight: '260px', fontFamily: fonts.mono },
  '.cm-tooltip-autocomplete > ul > li': { padding: '3px 10px' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--mui-palette-action-selected)',
    color: 'var(--mui-palette-text-primary)',
  },
  '.cm-completionDetail': {
    color: 'var(--mui-palette-text-secondary)',
    fontStyle: 'normal',
    marginLeft: '8px',
  },
  '.cm-completionMatchedText': { textDecoration: 'none', fontWeight: '700' },
  '.cm-tooltip.cm-completionInfo': { maxWidth: '320px', padding: '6px 10px' },
})

/** CodeMirror, framed like a MUI outlined field. */
const CodeEditor: FC<IProps> = ({
  value,
  onChange,
  language = 'text',
  expressions = false,
  hints,
  label,
  required,
  placeholder,
  helperText,
  error,
  code = false,
  minRows = 1,
  readOnly = false,
  maxHeight,
}) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  // Latest props for callbacks created once, with the editor.
  const onChangeRef = useRef(onChange)
  const hintsRef = useRef(hints)
  useEffect(() => {
    onChangeRef.current = onChange
    hintsRef.current = hints
  })

  const languageSlot = useRef(new Compartment())
  const readOnlySlot = useRef(new Compartment())

  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          drawSelection(),
          // Shows where a field dragged from the input will land.
          dropCursor(),
          closeBrackets(),
          bracketMatching(),
          indentOnInput(),
          syntaxHighlighting(highlightStyle),
          EditorView.lineWrapping,
          placeholderExtension(placeholder ?? ''),
          code ? [lineNumbers(), highlightActiveLine()] : [],
          expressions ? expressionHighlight : [],
          editorTheme({
            mono: code || language !== 'text',
            minRows,
            maxHeight: maxHeight === undefined ? (code ? 480 : 240) : maxHeight,
          }),
          tooltips({ parent: document.body }),
          tooltipTheme,
          autocompletion({
            override: expressions ? [expressionCompletions(() => hintsRef.current ?? {})] : undefined,
            icons: false,
          }),
          keymap.of([
            ...closeBracketsKeymap,
            ...completionKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...(code ? [indentWithTab] : []),
          ]),
          // Filled in by the effect below once the grammar has loaded.
          languageSlot.current.of([]),
          readOnlySlot.current.of(EditorState.readOnly.of(readOnly)),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString())
          }),
        ],
      }),
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // The editor is created once; the effects below keep it in sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Outside changes (e.g. undo in the graph, another node) replace the text.
  useEffect(() => {
    const view = viewRef.current
    if (!view || view.state.doc.toString() === value) return
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
  }, [value])

  useEffect(() => {
    let current = true
    void loadLanguage(language).then((extension) => {
      if (current) viewRef.current?.dispatch({ effects: languageSlot.current.reconfigure(extension) })
    })
    return () => {
      current = false
    }
  }, [language])

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: readOnlySlot.current.reconfigure(EditorState.readOnly.of(readOnly)),
    })
  }, [readOnly])

  return (
    <div>
      {label && (
        <FieldLabel required={required} error={error}>
          {label}
        </FieldLabel>
      )}
      <Box
        ref={hostRef}
        sx={{
          border: 1,
          // The outline of MUI's outlined fields.
          borderColor: error ? 'error.main' : 'rgba(var(--mui-palette-common-onBackgroundChannel) / 0.23)',
          borderRadius: 1,
          bgcolor: 'background.paper',
          '&:hover': { borderColor: error ? 'error.main' : 'text.primary' },
          '&:focus-within': { borderColor: error ? 'error.main' : 'primary.main', boxShadow: '0 0 0 1px currentColor' },
        }}
      />
      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </div>
  )
}

export default CodeEditor
