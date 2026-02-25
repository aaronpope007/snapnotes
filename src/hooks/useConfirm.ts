import { useState, useCallback, useRef } from 'react';
import type { ConfirmDialogOptions } from '../components/ConfirmDialog';

export function useConfirm(defaultOptions?: Partial<ConfirmDialogOptions>) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions>({});
  const onConfirmRef = useRef<(() => void) | null>(null);

  const openConfirm = useCallback(
    (onConfirm: () => void, overrides?: Partial<ConfirmDialogOptions>) => {
      onConfirmRef.current = onConfirm;
      setOptions({ ...defaultOptions, ...overrides });
      setOpen(true);
    },
    [defaultOptions]
  );

  const closeConfirm = useCallback(() => {
    setOpen(false);
    onConfirmRef.current = null;
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirmRef.current?.();
    onConfirmRef.current = null;
  }, []);

  return {
    confirmOpen: open,
    openConfirm,
    closeConfirm,
    handleConfirm,
    confirmOptions: options,
  };
}
