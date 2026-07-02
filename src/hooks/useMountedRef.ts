import { useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

/** Tracks whether the component is still mounted. */
export function useMountedRef(): { readonly current: boolean } {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}

/** Returns a fresh AbortSignal; aborts the prior in-flight request on unmount or re-call. */
export function useAbortSignalRef() {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const nextSignal = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller.signal;
  }, []);

  return nextSignal;
}

export function isAbortError(err: unknown): boolean {
  if (axios.isCancel(err)) return true;
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  return false;
}
