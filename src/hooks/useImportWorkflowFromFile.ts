import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { WorkflowGraph, WorkflowImport } from '../api/types'
import { setAlertAC } from '../storage/alertSlice'
import { useAppDispatch } from '../storage/hooks'
import { apiErrorMessage } from '../utils/apiErrorMessage'
import { useImportWorkflow } from './api'

/** Credential references in a graph: imports drop those this workspace lacks. */
function countCredentials(graph: WorkflowGraph) {
  return graph.nodes.reduce((sum, node) => sum + Object.keys(node.credentials ?? {}).length, 0)
}

/** Our export (GET /workflows/:id/export), roughly: the server checks the rest. */
function isWorkflowExport(data: unknown): data is WorkflowImport {
  if (!data || typeof data !== 'object') return false
  const { name, graph } = data as Record<string, unknown>
  return (
    typeof name === 'string' &&
    !!graph &&
    typeof graph === 'object' &&
    Array.isArray((graph as Record<string, unknown>).nodes) &&
    Array.isArray((graph as Record<string, unknown>).connections)
  )
}

/**
 * "Import from file": picks a .json exported from a workflow, creates a
 * workflow from it and opens it in the editor.
 */
export function useImportWorkflowFromFile() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const importWorkflow = useImportWorkflow()

  const fail = (text: string) => dispatch(setAlertAC({ text, mode: 'error' }))

  const importFile = async (file: File) => {
    let data: unknown
    try {
      data = JSON.parse(await file.text())
    } catch {
      return fail(t('workflows.import.notJson', { file: file.name }))
    }
    if (!isWorkflowExport(data)) return fail(t('workflows.import.notWorkflow', { file: file.name }))

    importWorkflow.mutate(data, {
      onSuccess: (workflow) => {
        const dropped = countCredentials(data.graph) - countCredentials(workflow.graph)
        dispatch(
          setAlertAC(
            dropped > 0
              ? { text: t('workflows.import.droppedCredentials', { count: dropped }), mode: 'warning' }
              : { text: t('workflows.import.done', { name: workflow.name }), mode: 'success' },
          ),
        )
        navigate(`/workflows/${workflow.id}`)
      },
      onError: (error) => fail(apiErrorMessage(error, t)),
    })
  }

  /** Opens the browser's file picker; call it from a click. */
  const pickFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void importFile(file)
    }
    input.click()
  }

  return { pickFile, importFile, isPending: importWorkflow.isPending }
}
