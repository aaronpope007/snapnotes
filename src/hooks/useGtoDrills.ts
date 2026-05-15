import { useState, useEffect, useCallback } from 'react';
import { useConfirm } from './useConfirm';
import {
  fetchGtoDrills,
  createGtoDrill,
  updateGtoDrill,
  deleteGtoDrill,
  fetchGtoDrillResults,
  createGtoDrillResult,
  updateGtoDrillResult,
  deleteGtoDrillResult,
} from '../api/gtoDrills';
import { getApiErrorMessage } from '../utils/apiError';
import type {
  GtoDrill,
  GtoDrillCreate,
  GtoDrillResult,
  GtoDrillResultCreate,
  GtoDrillResultUpdate,
  GtoDrillUpdate,
} from '../types/gtoStudy';

export interface UseGtoDrillsOptions {
  userId: string | null;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export type GtoDetailTab = 'chart' | 'results';

export function useGtoDrills({ userId, onSuccess, onError }: UseGtoDrillsOptions) {
  const [drills, setDrills] = useState<GtoDrill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDrillId, setSelectedDrillId] = useState<string | null>(null);
  const [detailResults, setDetailResults] = useState<GtoDrillResult[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [drillFormOpen, setDrillFormOpen] = useState(false);
  const [editDrill, setEditDrill] = useState<GtoDrill | null>(null);

  const [logResultOpen, setLogResultOpen] = useState(false);
  const [logResultDrillId, setLogResultDrillId] = useState<string | null>(null);

  const [editResult, setEditResult] = useState<{
    drillId: string;
    result: GtoDrillResult;
  } | null>(null);

  const [detailTab, setDetailTab] = useState<GtoDetailTab>('results');

  const {
    confirmOpen: deleteDrillConfirmOpen,
    openConfirm: openDeleteDrillConfirm,
    closeConfirm: closeDeleteDrillConfirm,
    handleConfirm: handleDeleteDrillConfirm,
    confirmOptions: deleteDrillConfirmOptions,
  } = useConfirm({
    title: 'Delete drill?',
    message: 'This will permanently delete the drill and all logged results.',
    confirmText: 'Delete',
    confirmDanger: true,
  });

  const {
    confirmOpen: deleteResultConfirmOpen,
    openConfirm: openDeleteResultConfirm,
    closeConfirm: closeDeleteResultConfirm,
    handleConfirm: handleDeleteResultConfirm,
    confirmOptions: deleteResultConfirmOptions,
  } = useConfirm({
    title: 'Delete result?',
    message: 'This result will be permanently removed.',
    confirmText: 'Delete',
    confirmDanger: true,
  });

  const loadDrills = useCallback(async () => {
    if (!userId?.trim()) {
      setDrills([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchGtoDrills(userId);
      setDrills(data ?? []);
    } catch (err) {
      setDrills([]);
      onError?.(getApiErrorMessage(err, 'Failed to load drills'));
    } finally {
      setLoading(false);
    }
  }, [userId, onError]);

  const loadDetailResults = useCallback(
    async (drillId: string) => {
      if (!userId?.trim()) {
        setDetailResults([]);
        return;
      }
      setDetailLoading(true);
      try {
        const data = await fetchGtoDrillResults(drillId, userId);
        setDetailResults(data ?? []);
      } catch (err) {
        setDetailResults([]);
        onError?.(getApiErrorMessage(err, 'Failed to load drill results'));
      } finally {
        setDetailLoading(false);
      }
    },
    [userId, onError]
  );

  useEffect(() => {
    void loadDrills();
  }, [loadDrills]);

  useEffect(() => {
    if (selectedDrillId) {
      void loadDetailResults(selectedDrillId);
    } else {
      setDetailResults([]);
    }
  }, [selectedDrillId, loadDetailResults]);

  const selectedDrill = drills.find((d) => d._id === selectedDrillId) ?? null;

  const openDrillDetail = useCallback((drillId: string, initialTab: GtoDetailTab = 'results') => {
    setSelectedDrillId(drillId);
    setDetailTab(initialTab);
  }, []);

  const closeDrillDetail = useCallback(() => {
    setSelectedDrillId(null);
    setDetailResults([]);
    setDetailTab('results');
  }, []);

  const handleCreateDrill = useCallback(
    async (payload: GtoDrillCreate) => {
      if (!userId?.trim()) return;
      setSaving(true);
      try {
        const created = await createGtoDrill({ ...payload, userId });
        setDrillFormOpen(false);
        setEditDrill(null);
        await loadDrills();
        onSuccess?.('Drill saved');
        return created;
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to save drill'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, onSuccess, onError, loadDrills]
  );

  const handleUpdateDrill = useCallback(
    async (id: string, updates: GtoDrillUpdate) => {
      setSaving(true);
      try {
        const updated = await updateGtoDrill(id, updates);
        setDrillFormOpen(false);
        setEditDrill(null);
        await loadDrills();
        onSuccess?.('Drill updated');
        return updated;
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to update drill'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [onSuccess, onError, loadDrills]
  );

  const requestDeleteDrill = useCallback(
    (id: string) => {
      openDeleteDrillConfirm(async () => {
        try {
          await deleteGtoDrill(id);
          if (selectedDrillId === id) closeDrillDetail();
          await loadDrills();
          onSuccess?.('Drill deleted');
        } catch (err) {
          onError?.(getApiErrorMessage(err, 'Failed to delete drill'));
        }
      });
    },
    [openDeleteDrillConfirm, selectedDrillId, closeDrillDetail, onSuccess, onError, loadDrills]
  );

  const openLogResult = useCallback((drillId?: string) => {
    setLogResultDrillId(drillId ?? null);
    setLogResultOpen(true);
  }, []);

  const handleCreateResult = useCallback(
    async (drillId: string, payload: GtoDrillResultCreate) => {
      if (!userId?.trim()) return;
      setSaving(true);
      try {
        const created = await createGtoDrillResult(drillId, { ...payload, userId });
        if (selectedDrillId === drillId) {
          setDetailResults((prev) =>
            [created, ...prev].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
          );
        }
        setLogResultOpen(false);
        setLogResultDrillId(null);
        await loadDrills();
        onSuccess?.('Result logged');
        return created;
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to log result'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, selectedDrillId, onSuccess, onError, loadDrills]
  );

  const handleUpdateResult = useCallback(
    async (drillId: string, resultId: string, updates: GtoDrillResultUpdate) => {
      if (!userId?.trim()) return;
      setSaving(true);
      try {
        const updated = await updateGtoDrillResult(drillId, resultId, updates, userId);
        if (selectedDrillId === drillId) {
          setDetailResults((prev) =>
            prev
              .map((r) => (r._id === resultId ? updated : r))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          );
        }
        await loadDrills();
        setEditResult(null);
        onSuccess?.('Result updated');
      } catch (err) {
        onError?.(getApiErrorMessage(err, 'Failed to update result'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, selectedDrillId, onSuccess, onError, loadDrills]
  );

  const requestDeleteResult = useCallback(
    (drillId: string, resultId: string) => {
      openDeleteResultConfirm(async () => {
        if (!userId?.trim()) return;
        try {
          await deleteGtoDrillResult(drillId, resultId, userId);
          if (selectedDrillId === drillId) {
            setDetailResults((prev) => prev.filter((r) => r._id !== resultId));
          }
          await loadDrills();
          onSuccess?.('Result deleted');
        } catch (err) {
          onError?.(getApiErrorMessage(err, 'Failed to delete result'));
        }
      });
    },
    [openDeleteResultConfirm, userId, selectedDrillId, onSuccess, onError, loadDrills]
  );

  return {
    drills,
    loading,
    saving,
    selectedDrill,
    selectedDrillId,
    detailResults,
    detailLoading,
    loadDrills,
    loadDetailResults,
    openDrillDetail,
    closeDrillDetail,
    detailTab,
    setDetailTab,
    drillFormOpen,
    setDrillFormOpen,
    editDrill,
    setEditDrill,
    handleCreateDrill,
    handleUpdateDrill,
    requestDeleteDrill,
    logResultOpen,
    setLogResultOpen,
    logResultDrillId,
    openLogResult,
    handleCreateResult,
    editResult,
    setEditResult,
    handleUpdateResult,
    requestDeleteResult,
    deleteDrillConfirmOpen,
    closeDeleteDrillConfirm,
    handleDeleteDrillConfirm,
    deleteDrillConfirmOptions,
    deleteResultConfirmOpen,
    closeDeleteResultConfirm,
    handleDeleteResultConfirm,
    deleteResultConfirmOptions,
  };
}
