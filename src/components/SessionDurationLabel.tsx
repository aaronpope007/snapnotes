import { useState, useEffect } from 'react';
import { formatSessionDuration } from '../utils/activeSession';

interface SessionDurationLabelProps {
  startTime: string;
}

/**
 * Displays "Session in progress: Xh Ym Zs" and updates every second.
 * Owns its own tick state so only this component re-renders each second.
 */
export function SessionDurationLabel({ startTime }: SessionDurationLabelProps) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{`Session in progress: ${formatSessionDuration(startTime)}`}</>;
}
