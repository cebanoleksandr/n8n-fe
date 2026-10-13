import type { ReactNode } from 'react'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import AltRouteIcon from '@mui/icons-material/AltRoute'
import CallMergeIcon from '@mui/icons-material/CallMerge'
import CallSplitIcon from '@mui/icons-material/CallSplit'
import CodeIcon from '@mui/icons-material/Code'
import EditNoteIcon from '@mui/icons-material/EditNote'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import FunctionsIcon from '@mui/icons-material/Functions'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import HttpIcon from '@mui/icons-material/Http'
import LayersClearOutlinedIcon from '@mui/icons-material/LayersClearOutlined'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ReplyIcon from '@mui/icons-material/Reply'
import ScheduleIcon from '@mui/icons-material/Schedule'
import SendIcon from '@mui/icons-material/Send'
import SortIcon from '@mui/icons-material/Sort'
import StorageIcon from '@mui/icons-material/Storage'
import TagIcon from '@mui/icons-material/Tag'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop'
import WebhookIcon from '@mui/icons-material/Webhook'
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'

// The API has no node icons: one per built-in type.
const ICONS: Record<string, ReactNode> = {
  'core.manualTrigger': <PlayArrowIcon />,
  'core.schedule': <ScheduleIcon />,
  'core.webhook': <WebhookIcon />,
  'core.errorTrigger': <ErrorOutlineIcon />,
  'core.executeWorkflowTrigger': <AccountTreeOutlinedIcon />,
  'core.executeWorkflow': <AccountTreeOutlinedIcon />,
  'core.respondToWebhook': <ReplyIcon />,
  'core.httpRequest': <HttpIcon />,
  'core.code': <CodeIcon />,
  'core.set': <EditNoteIcon />,
  'core.if': <CallSplitIcon />,
  'core.switch': <AltRouteIcon />,
  'core.merge': <CallMergeIcon />,
  'core.filter': <FilterAltOutlinedIcon />,
  'core.sort': <SortIcon />,
  'core.limit': <VerticalAlignTopIcon />,
  'core.aggregate': <FunctionsIcon />,
  'core.splitOut': <UnfoldMoreIcon />,
  'core.removeDuplicates': <LayersClearOutlinedIcon />,
  'core.wait': <HourglassEmptyIcon />,
  'integrations.postgres': <StorageIcon />,
  'integrations.sendEmail': <EmailOutlinedIcon />,
  'integrations.slack': <TagIcon />,
  'integrations.telegram': <SendIcon />,
}

export function nodeIcon(type: string): ReactNode {
  return ICONS[type] ?? <WidgetsOutlinedIcon />
}
