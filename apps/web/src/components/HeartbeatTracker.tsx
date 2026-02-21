'use client'

import { useHeartbeat } from '@/lib/hooks/useHeartbeat'
import { useAuth } from '@/lib/auth'

/**
 * Silent component that fires a single heartbeat per session
 * for return-visit analytics. Renders nothing.
 */
export function HeartbeatTracker() {
  const { user } = useAuth()

  // Only fire heartbeat for authenticated users
  if (user) {
    return <HeartbeatInner />
  }

  return null
}

function HeartbeatInner() {
  useHeartbeat()
  return null
}
