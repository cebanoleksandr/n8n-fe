import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { setAlertAC } from '../storage/alertSlice'
import { useAppDispatch } from '../storage/hooks'
import { useCreateWorkflow } from './api'

/** Creates an empty workflow and opens it in the editor, like n8n's "+" button. */
export function useCreateWorkflowAndOpen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const create = useCreateWorkflow()

  const createAndOpen = () => {
    create.mutate(
      { name: t('workflows.defaultName') },
      {
        onSuccess: (workflow) => navigate(`/workflows/${workflow.id}`),
        onError: () =>
          dispatch(setAlertAC({ text: 'workflows.createFailed', mode: 'error' })),
      },
    )
  }

  return { createAndOpen, isPending: create.isPending }
}
