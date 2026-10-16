import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { EditorState } from '@codemirror/state'
import { describe, expect, it } from 'vitest'
import type { ExpressionReference } from '../../api/types'
import { expressionCompletions, type ExpressionHints } from './expressionLanguage'

const entry = (name: string) => ({ name, signature: '', description: '' })

const reference: ExpressionReference = {
  variables: [entry('$json'), entry('$now')],
  functions: [entry('$if')],
  methods: { string: [entry('toUpperCase')], number: [entry('toFixed')], array: [entry('join')] },
  properties: { string: [entry('length')], array: [entry('length')] },
}

const hints: ExpressionHints = {
  reference,
  json: { name: 'Ann', user: { email: 'a@b.c', age: 3 } },
  nodes: { 'Get All Jobs': [{ url: 'x', meta: { score: 85 } }] },
}

/** Completions with the cursor at "|". */
function complete(doc: string, explicit = false) {
  const pos = doc.indexOf('|')
  const state = EditorState.create({ doc: doc.replace('|', '') })
  const result = expressionCompletions(() => hints)(new CompletionContext(state, pos, explicit)) as CompletionResult | null
  return result && { from: result.from, labels: result.options.map((o) => o.label), applies: result.options.map((o) => o.apply) }
}

describe('expression completions', () => {
  it('stay quiet outside {{ }}', () => {
    expect(complete('Hello $js|')).toBeNull()
    expect(complete('{{ $json }} and $js|')).toBeNull()
  })

  it('offer variables and functions right after {{', () => {
    expect(complete('Hi {{ |')).toEqual({ from: 6, labels: ['$json', '$now', '$if'], applies: [undefined, undefined, undefined] })
  })

  it('complete a started word, but not after every space', () => {
    expect(complete('{{ $n| }}')?.labels).toEqual(['$json', '$now', '$if'])
    expect(complete('{{ $json.name + | }}')).toBeNull()
    expect(complete('{{ $json.name + | }}', true)?.labels).toContain('$now')
  })

  it('offer fields of $json, nested too', () => {
    expect(complete('{{ $json.| }}')?.labels).toEqual(['name', 'user'])
    expect(complete('{{ $json.user.e| }}')).toMatchObject({ from: 14, labels: ['email', 'age'] })
  })

  it('offer node names inside $(, closing the call', () => {
    expect(complete(`{{ $('G| }}`)).toEqual({ from: 6, labels: ['Get All Jobs'], applies: [`Get All Jobs')`] })
    expect(complete(`{{ $("| }}`)?.applies).toEqual([`Get All Jobs")`])
  })

  it('walk $(...).item.json into that node’s output', () => {
    expect(complete(`{{ $('Get All Jobs').| }}`)?.labels).toEqual(['item', 'first()', 'last()', 'all()'])
    expect(complete(`{{ $('Get All Jobs').item.| }}`)?.labels).toEqual(['json', 'binary'])
    expect(complete(`{{ $('Get All Jobs').item.json.| }}`)?.labels).toEqual(['url', 'meta'])
    expect(complete(`{{ $('Get All Jobs').first().json.meta.s| }}`)?.labels).toEqual(['score'])
  })

  it('offer methods once a path reaches a plain value', () => {
    const methods = ['toUpperCase', 'toFixed', 'join', 'length']
    expect(complete('{{ $json.name.to| }}')?.labels).toEqual(methods)
    expect(complete(`{{ $('Get All Jobs').item.json.url.| }}`)?.labels).toEqual(methods)
  })
})
