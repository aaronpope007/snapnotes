import { useCallback } from 'react';
import { useConfirm } from './useConfirm';
import type { ConfirmDialogOptions } from '../components/ConfirmDialog';

export const DISCARD_FORM_CONFIRM_OPTIONS: Partial<ConfirmDialogOptions> = {
  title: 'Discard changes?',
  message: 'You have unsaved changes. Discard them?',
  confirmText: 'Discard',
  cancelText: 'Cancel',
  confirmDanger: true,
};

/**
 * Confirm before closing a form when dirty. Pair with ConfirmDialog using returned props.
 */
export function useDirtyFormClose(overrides?: Partial<ConfirmDialogOptions>) {
  const {
    confirmOpen,
    openConfirm,
    closeConfirm,
    handleConfirm,
    confirmOptions,
  } = useConfirm({ ...DISCARD_FORM_CONFIRM_OPTIONS, ...overrides });

  const requestClose = useCallback(
    (isDirty: boolean, onClose: () => void) => {
      if (isDirty) {
        openConfirm(onClose);
      } else {
        onClose();
      }
    },
    [openConfirm]
  );

  return {
    confirmOpen,
    closeConfirm,
    handleConfirm,
    confirmOptions,
    requestClose,
  };
}
