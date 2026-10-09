import { api } from '../api/client'
import type { EvaluateExpressionInput, ExpressionReference } from '../api/types'

export const expressionsService = {
  /** Variables, functions and methods for autocomplete. */
  async reference(): Promise<ExpressionReference> {
    const { data } = await api.get<ExpressionReference>('/expressions/reference')
    return data
  },

  /** Live preview on sample data; 400 with a message for invalid expressions. */
  async evaluate(input: EvaluateExpressionInput): Promise<unknown> {
    const { data } = await api.post<{ value: unknown }>(
      '/expressions/evaluate',
      input,
    )
    return data.value
  },
}
