'use client'

import { useEffect, useRef } from 'react'

/**
 * Fires a single heartbeat per browser session to track return visits.
 * Only fires once per page session (not on every navigation).
 */
export function useHeartbeat() {
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

    // Fire and forget
    fetch('/api/analytics/heartbeat', { method: 'POST' }).catch(() => {
      // Silent failure — analytics should never break the app
    })
  }, [])
}
