import { useEffect, useRef, useState } from 'react'
import { useExecutionEvents, useListenTestWebhook, useStopTestWebhook } from '../../hooks/api'

/**
 * "Listen for test event": the backend accepts one request on the test URL
 * (for 120 s) and runs the saved workflow with it. The run is picked up from
 * the workflow's live events and handed to `onExecution`.
 */
export function useTestWebhook(workflowId: string, onExecution: (executionId: string) => void) {
  const listen = useListenTestWebhook()
  const stop = useStopTestWebhook()
  // When listening ends (ms since epoch), or null.
  const [until, setUntil] = useState<number | null>(null)

  useExecutionEvents(until ? { workflowId } : null, (event) => {
    if (event.type === 'execution.queued') {
      setUntil(null)
      onExecution(event.executionId)
    }
  })

  // The backend forgets the URL on its own after the timeout.
  useEffect(() => {
    if (!until) return
    const timer = setTimeout(() => setUntil(null), Math.max(0, until - Date.now()))
    return () => clearTimeout(timer)
  }, [until])

  // Leaving the editor while listening frees the URL right away.
  const listeningRef = useRef(false)
  useEffect(() => {
    listeningRef.current = !!until
  }, [until])
  const stopRef = useRef(stop.mutate)
  useEffect(() => {
    stopRef.current = stop.mutate
  })
  useEffect(
    () => () => {
      if (listeningRef.current) stopRef.current(workflowId)
    },
    [workflowId],
  )

  /** Throws the API error (e.g. no Webhook node, path taken by another workflow). */
  const start = async (nodeId?: string) => {
    const result = await listen.mutateAsync({ id: workflowId, nodeId })
    setUntil(Date.now() + result.expiresInSeconds * 1000)
  }

  const cancel = () => {
    setUntil(null)
    stop.mutate(workflowId)
  }

  return { until, isStarting: listen.isPending, start, cancel }
}
