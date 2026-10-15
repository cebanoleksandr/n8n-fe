import type {
  Completion,
  CompletionContext,
  CompletionResult,
  CompletionSource,
} from '@codemirror/autocomplete'
import { Decoration, MatchDecorator, ViewPlugin, type ViewUpdate } from '@codemirror/view'
import type { DecorationSet, EditorView } from '@codemirror/view'
import type { ExpressionReference, ReferenceEntry } from '../../api/types'

/** Data the {{ }} autocomplete offers besides the built-in reference. */
export interface ExpressionHints {
  reference?: ExpressionReference
  /** The first input item: its keys complete $json. */
  json?: Record<string, unknown>
  /** Nodes that ran: their names complete $('…'), their outputs the fields after it. */
  nodes?: Record<string, Record<string, unknown>[]>
}

const expressionMark = Decoration.mark({ class: 'cm-expression' })

const expressionMatcher = new MatchDecorator({
  regexp: /\{\{[\s\S]*?\}\}/g,
  decoration: () => expressionMark,
})

/** Tints every {{ … }} so expressions stand out from fixed text. */
export const expressionHighlight = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = expressionMatcher.createDeco(view)
    }
    update(update: ViewUpdate) {
      this.decorations = expressionMatcher.updateDeco(update, this.decorations)
    }
  },
  { decorations: (plugin) => plugin.decorations },
)

/** Whether the cursor is inside an unclosed {{. */
function insideExpression(textBefore: string) {
  return textBefore.lastIndexOf('{{') > textBefore.lastIndexOf('}}')
}

function fromEntry(entry: ReferenceEntry, type: Completion['type']): Completion {
  return { label: entry.name, detail: entry.signature, info: entry.description, type }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** Follows "a.b" into an object, or undefined. */
function walk(value: unknown, path: string[]): unknown {
  let current = value
  for (const key of path) {
    if (!isPlainObject(current)) return undefined
    current = current[key]
  }
  return current
}

function keysOf(value: unknown): Completion[] {
  if (!isPlainObject(value)) return []
  return Object.entries(value).map(([key, field]) => ({
    label: key,
    type: 'property',
    detail: Array.isArray(field) ? 'array' : field === null ? 'null' : typeof field,
  }))
}

/**
 * Autocomplete inside {{ }}: variables and functions, $('Node') names,
 * fields of $json and of other nodes' output, and methods after a dot.
 */
export function expressionCompletions(getHints: () => ExpressionHints): CompletionSource {
  return (context: CompletionContext): CompletionResult | null => {
    const before = context.state.sliceDoc(0, context.pos)
    if (!insideExpression(before)) return null
    const hints = getHints()
    const reference = hints.reference

    // Unknown type: the methods of strings, numbers and arrays.
    const methods = (from: number): CompletionResult | null => {
      if (!reference) return null
      const seen = new Set<string>()
      const options: Completion[] = []
      for (const entry of [
        ...reference.methods.string,
        ...reference.methods.number,
        ...reference.methods.array,
        ...reference.properties.string,
        ...reference.properties.array,
      ]) {
        if (seen.has(entry.name)) continue
        seen.add(entry.name)
        options.push(fromEntry(entry, 'method'))
      }
      return { from, options, validFor: /^[\w$]*$/ }
    }

    // $('Partial name  ->  node names
    const nodeCall = context.matchBefore(/\$\(\s*(['"])[^'"]*$/)
    if (nodeCall) {
      const quote = nodeCall.text.match(/['"]/)![0]
      const start = nodeCall.from + nodeCall.text.indexOf(quote) + 1
      return {
        from: start,
        options: Object.keys(hints.nodes ?? {}).map((name) => ({
          label: name,
          type: 'variable',
          apply: `${name}${quote})`,
        })),
      }
    }

    // Fields of an object, else the methods its value might have.
    const membersOf = (value: unknown, from: number): CompletionResult | null => {
      if (isPlainObject(value)) return { from, options: keysOf(value), validFor: /^[\w$]*$/ }
      return methods(from)
    }

    // $('Node name').item.json.field — node names may contain spaces.
    const nodeRef = context.matchBefore(/\$\((['"])([^'"]+)\1\)((?:\.[\w$]*(?:\(\))?)*)$/)
    if (nodeRef) {
      const [, , name, rest] = nodeRef.text.match(/^\$\((['"])([^'"]+)\1\)(.*)$/)!
      if (rest) {
        const parts = rest.split('.').slice(1)
        const partial = parts.pop() ?? ''
        const from = context.pos - partial.length
        if (parts.length === 0) {
          return {
            from,
            options: ['item', 'first()', 'last()', 'all()'].map((label) => ({ label, type: 'property' })),
          }
        }
        const items = hints.nodes?.[name] ?? []
        if (['item', 'first()', 'last()'].includes(parts[0]) && parts[1] === 'json') {
          return membersOf(walk(items[0], parts.slice(2)), from)
        }
        if (parts.length === 1 && ['item', 'first()', 'last()'].includes(parts[0])) {
          return { from, options: [{ label: 'json', type: 'property' }, { label: 'binary', type: 'property' }] }
        }
        return methods(from)
      }
    }

    // $json.a.b, or any value followed by a dot.
    const dotted = context.matchBefore(/[\w$]+(\.[\w$]*)+$/)
    if (dotted) {
      const parts = dotted.text.split('.')
      const partial = parts.pop() ?? ''
      const from = context.pos - partial.length
      const [head, ...path] = parts
      if (head === '$json') return membersOf(walk(hints.json, path), from)
      return methods(from)
    }

    // A bare word: variables and functions. With nothing typed yet, only
    // right after "{{" (or on Ctrl+Space), not after every space.
    const word = context.matchBefore(/[\w$]*$/)!
    const afterBraces = /\{\{\s*$/.test(before.slice(0, word.from))
    if (word.from === word.to && !context.explicit && !afterBraces) return null
    if (!reference) return null
    return {
      from: word.from,
      options: [
        ...reference.variables.map((entry) => fromEntry(entry, 'variable')),
        ...reference.functions.map((entry) => fromEntry(entry, 'function')),
      ],
      validFor: /^[\w$]*$/,
    }
  }
}
