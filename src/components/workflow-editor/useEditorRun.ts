import { useEffect, useRef, useState } from 'react'
import { isFinished, type RunWorkflowInput } from '../../api/types'
import { pollWhileRunning, useExecution, useExecutionEvents, useRunWorkflow } from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'

/**
 * "Execute workflow" in the editor: starts a run and follows it live, so the
 * canvas and the logs fill in node by node.
 */
export function useEditorRun(workflowId: string) {
  const dispatch = useAppDispatch()
  const start = useRunWorkflow()
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [runningNodeId, setRunningNodeId] = useState<string | null>(null)

  const execution = useExecution(executionId ?? undefined, pollWhileRunning)
  const finished = !!execution.data && isFinished(execution.data.status)

  useExecutionEvents(executionId && !finished ? { executionId } : null, (event) => {
    if (event.type === 'node.started') setRunningNodeId(event.nodeId)
    if (event.type === 'node.finished') setRunningNodeId(null)
  })

  // Told once per run, from its status: the "finished" event may be missed.
  const announced = useRef<string | null>(null)
  useEffect(() => {
    if (!finished || !executionId || announced.current === executionId) return
    announced.current = executionId
    dispatch(
      setAlertAC(
        execution.data?.status === 'success'
          ? { text: 'editor.run.succeeded', mode: 'success' }
          : { text: 'editor.run.failed', mode: 'error' },
      ),
    )
  }, [finished, executionId, execution.data?.status, dispatch])

  /** `input.destinationNodeId`: run only that node and what it depends on. */
  const run = (input?: RunWorkflowInput) =>
    start.mutateAsync({ workflowId, input }).then((summary) => {
      setRunningNodeId(null)
      setExecutionId(summary.id)
      return summary
    })

  /** Follows a run started elsewhere, e.g. by a test webhook request. */
  const follow = (id: string) => {
    setRunningNodeId(null)
    setExecutionId(id)
  }

  return {
    run,
    follow,
    isStarting: start.isPending,
    execution: execution.data,
    isRunning: !!executionId && !finished,
    // A finished run has no node running, even if that event was missed.
    runningNodeId: finished ? null : runningNodeId,
  }
}
