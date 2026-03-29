import { useState, useEffect } from 'react';
import type { ActiveSession } from '../utils/activeSession';
import { formatPlayingDuration } from '../utils/activeSession';

interface SessionDurationLabelProps {
  activeSession: ActiveSession;
}

/**
 * Displays "Session in progress: Xh Ym Zs" (playing time, excluding breaks) and updates every second.
 * Owns its own tick state so only this component re-renders each second.
 */
export function SessionDurationLabel({ activeSession }: SessionDurationLabelProps) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const suffix = activeSession.pauseStartedAt ? ' (paused)' : '';
  return <>{`Session in progress: ${formatPlayingDuration(activeSession)}${suffix}`}</>;
}
