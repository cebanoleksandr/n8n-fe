import { Outlet, useParams } from 'react-router-dom'
import ExecutionsSidebar from '../../components/executions/ExecutionsSidebar'

/** The workflow's "Executions" tab: its runs on the left, the open one on the right. */
const WorkflowExecutionsPage = () => {
  const { workflowId } = useParams()

  return (
    <div className="h-full flex min-h-0">
      <ExecutionsSidebar workflowId={workflowId!} />
      <div className="flex-1 min-w-0 min-h-0">
        <Outlet />
      </div>
    </div>
  )
}

export default WorkflowExecutionsPage
