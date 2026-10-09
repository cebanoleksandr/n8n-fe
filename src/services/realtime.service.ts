import { io, type Socket } from 'socket.io-client'
import { API_URL, refreshSession } from '../api/client'
import { session } from '../api/session'
import type { ExecutionEvent } from '../api/types'

export interface ExecutionSubscription {
  workflowId?: string
  executionId?: string
}

type Ack = { ok: true } | { ok: false; error: string }
type Listener = (event: ExecutionEvent) => void

interface Entry {
  target: ExecutionSubscription
  listener: Listener
}

/** Same origin in dev (Vite proxies /socket.io); the API origin otherwise. */
function socketUrl(): string {
  const base = /^https?:\/\//.test(API_URL)
    ? new URL(API_URL).origin
    : window.location.origin
  return `${base}/executions`
}

function matches(target: ExecutionSubscription, event: ExecutionEvent) {
  return (
    target.workflowId === event.workflowId ||
    target.executionId === event.executionId
  )
}

let socket: Socket | null = null
const entries = new Set<Entry>()

function emitSubscribe(s: Socket, target: ExecutionSubscription) {
  s.emit('subscribe', target, (ack: Ack) => {
    if (!ack.ok) console.warn('Execution subscription rejected:', ack.error)
  })
}

function getSocket(): Socket {
  if (socket) return socket
  const s = io(socketUrl(), {
    autoConnect: false,
    // Called on every (re)connect, so a refreshed token is picked up.
    auth: (cb) => cb({ token: session.getAccessToken() }),
  })
  // Rooms are per connection: join them again after every reconnect.
  s.on('connect', () => {
    for (const { target } of entries) emitSubscribe(s, target)
  })
  // The server checks the token only on connect; socket.io does not retry
  // middleware rejections by itself.
  s.on('connect_error', (err) => {
    if (err.message !== 'Unauthorized' || entries.size === 0) return
    refreshSession()
      .then(() => {
        if (entries.size > 0) s.connect()
      })
      .catch(() => {})
  })
  s.on('execution-event', (event: ExecutionEvent) => {
    for (const { target, listener } of entries) {
      if (matches(target, event)) listener(event)
    }
  })
  socket = s
  return s
}

export const realtimeService = {
  /** Live events of a workflow or an execution. Returns the unsubscribe function. */
  subscribe(target: ExecutionSubscription, listener: Listener): () => void {
    const entry: Entry = { target, listener }
    entries.add(entry)
    const s = getSocket()
    if (s.connected) emitSubscribe(s, target)
    else if (!s.active) connect(s)

    return () => {
      entries.delete(entry)
      const stillUsed = [...entries].some(
        (e) =>
          e.target.workflowId === target.workflowId &&
          e.target.executionId === target.executionId,
      )
      if (!stillUsed && s.connected) s.emit('unsubscribe', target)
      if (entries.size === 0) s.disconnect()
    }
  },

  disconnect() {
    entries.clear()
    socket?.disconnect()
  },
}

function connect(s: Socket) {
  if (session.getAccessToken()) {
    s.connect()
    return
  }
  refreshSession()
    .then(() => {
      if (entries.size > 0 && !s.active) s.connect()
    })
    .catch(() => {})
}
