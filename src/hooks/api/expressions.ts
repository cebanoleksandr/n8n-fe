import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/query-keys'
import type { EvaluateExpressionInput } from '../../api/types'
import { expressionsService } from '../../services/expressions.service'

/** Autocomplete data for the expression editor. */
export function useExpressionReference() {
  return useQuery({
    queryKey: queryKeys.static.expressionReference,
    queryFn: expressionsService.reference,
    staleTime: Infinity,
  })
}

/**
 * Live preview of an expression. Debounce `input` in the caller; an invalid
 * expression is an error (400) whose message getErrorMessage() returns.
 */
export function useEvaluateExpression(
  input: EvaluateExpressionInput | null,
) {
  return useQuery({
    queryKey: queryKeys.expressions.evaluate(input ?? { expression: '' }),
    queryFn: () => expressionsService.evaluate(input!),
    enabled: !!input && input.expression.includes('{{'),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    retry: false,
  })
}
