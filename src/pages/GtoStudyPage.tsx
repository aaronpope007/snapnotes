import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useUserName } from '../context/UserNameContext';
import { useGtoDrills } from '../hooks/useGtoDrills';
import { GtoStudyTabs, type GtoDrillListView } from '../components/gtoStudy/GtoStudyTabs';
import { GtoDrillsTab } from '../components/gtoStudy/GtoDrillsTab';
import { TierProgressPanel } from '../components/gtoStudy/TierProgressPanel';
import { DrillTodayCard } from '../components/gtoStudy/DrillTodayCard';
import {
  DrillHistoryModal,
  getHistoryDrillId,
  getHistoryDrillName,
  type DrillHistoryDrill,
} from '../components/gtoStudy/DrillHistoryModal';
import { RecentResultsModal } from '../components/gtoStudy/RecentResultsModal';
import { GtoDrillResultModal } from '../components/gtoStudy/GtoDrillResultModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { filterGtoDrills, emptyGtoDrillFacetFilters } from '../utils/gtoDrillFilter';
import { fetchGtoTierProgress } from '../api/gtoTierProgress';
import type { GtoDrillResult, GtoFormat } from '../types/gtoStudy';
import type { GtoTierProgressRow } from '../types/gtoTierProgress';

interface GtoStudyPageProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function GtoStudyPage({ onSuccess, onError }: GtoStudyPageProps) {
  const userName = useUserName();
  const [studyFormat, setStudyFormat] = useState<GtoFormat>('HU');
  const hook = useGtoDrills({ userId: userName, format: studyFormat, onSuccess, onError });
  const [listView, setListView] = useState<GtoDrillListView>('active');
  const [filterQuery, setFilterQuery] = useState('');
  const [facetFilters, setFacetFilters] = useState(emptyGtoDrillFacetFilters);
  const [facetFilterResetKey, setFacetFilterResetKey] = useState(0);
  const [tierRows, setTierRows] = useState<GtoTierProgressRow[]>([]);
  const [tierLoading, setTierLoading] = useState(false);
  const [tierError, setTierError] = useState<string | null>(null);
  const [historyDrill, setHistoryDrill] = useState<DrillHistoryDrill | null>(null);
  const [recentOpen, setRecentOpen] = useState(false);
  const [editDrillNameHint, setEditDrillNameHint] = useState<string | null>(null);

  const handleClearAllFilters = () => {
    setFilterQuery('');
    setFacetFilters(() => emptyGtoDrillFacetFilters());
    setFacetFilterResetKey((k) => k + 1);
  };

  const isArchivedView = listView === 'archived';

  useEffect(() => {
    if (isArchivedView) void hook.loadArchivedDrills();
    else void hook.loadDrills();
  }, [isArchivedView, studyFormat, hook.loadArchivedDrills, hook.loadDrills]);

  const sourceDrills = isArchivedView ? hook.archivedDrills : hook.drills;
  const listLoading = isArchivedView ? hook.archivedLoading : hook.loading;

  const visibleDrills = useMemo(
    () => filterGtoDrills(sourceDrills, filterQuery, facetFilters),
    [sourceDrills, filterQuery, facetFilters]
  );

  const drillSolvers = useMemo(
    () => Object.fromEntries(hook.drills.map((d) => [d._id, d.solver])),
    [hook.drills]
  );

  const tierProgressRefreshKey = useMemo(
    () =>
      hook.drills
        .map((d) => `${d._id}:${d.updatedAt}:${d.recentResultsSummary?.[0]?.date ?? ''}`)
        .join('|'),
    [hook.drills]
  );

  const loadTierProgress = useCallback(async () => {
    if (!userName?.trim()) {
      setTierRows([]);
      return;
    }
    setTierLoading(true);
    setTierError(null);
    try {
      const data = await fetchGtoTierProgress(userName, studyFormat);
      setTierRows(data);
    } catch {
      setTierError('Failed to load tier progress');
      setTierRows([]);
    } finally {
      setTierLoading(false);
    }
  }, [userName, studyFormat]);

  useEffect(() => {
    void loadTierProgress();
  }, [loadTierProgress, tierProgressRefreshKey]);

  const handleLogResultById = useCallback(
    (drillId: string) => {
      hook.openLogResult(drillId);
    },
    [hook.openLogResult]
  );

  const handleOpenHistory = useCallback(
    (drill: DrillHistoryDrill) => {
      if (!userName?.trim()) {
        onError?.('Enter your name to view drill history');
        return;
      }
      setHistoryDrill(drill);
    },
    [userName, onError]
  );

  const handleHistoryLogResult = useCallback(
    (drill: DrillHistoryDrill) => {
      handleLogResultById(getHistoryDrillId(drill));
    },
    [handleLogResultById]
  );

  const handleHistoryResultsChanged = useCallback(() => {
    void hook.loadDrills({ silent: true });
    void loadTierProgress();
  }, [hook.loadDrills, loadTierProgress]);

  const handleOpenRecent = useCallback(() => {
    if (!userName?.trim()) {
      onError?.('Enter your name to view recent results');
      return;
    }
    setRecentOpen(true);
  }, [userName, onError]);

  const handleOpenHistoryByDrillId = useCallback(
    (drillId: string) => {
      const drill =
        hook.drills.find((d) => d._id === drillId) ??
        hook.archivedDrills.find((d) => d._id === drillId) ??
        tierRows.find((r) => r.drillId === drillId);
      if (drill) {
        handleOpenHistory(drill);
        return;
      }
      onError?.('Drill not found in the current list');
    },
    [hook.drills, hook.archivedDrills, tierRows, handleOpenHistory, onError]
  );

  const handleEditFromHistory = useCallback(
    (result: GtoDrillResult) => {
      if (!historyDrill) return;
      setEditDrillNameHint(getHistoryDrillName(historyDrill));
      hook.setEditResult({ drillId: getHistoryDrillId(historyDrill), result });
    },
    [historyDrill, hook]
  );

  const handleEditFromRecent = useCallback(
    (drillId: string, result: GtoDrillResult, drillName: string) => {
      setEditDrillNameHint(drillName);
      hook.setEditResult({ drillId, result });
    },
    [hook]
  );

  const editDrillName =
    editDrillNameHint ??
    (hook.editResult != null
      ? (hook.drills.find((d) => d._id === hook.editResult?.drillId)?.name ??
        hook.archivedDrills.find((d) => d._id === hook.editResult?.drillId)?.name ??
        'Drill')
      : '');

  return (
    <Box sx={{ width: '100%' }}>
      {!hook.selectedDrillId && (
        <GtoStudyTabs
          listView={listView}
          onListViewChange={setListView}
          filterQuery={filterQuery}
          onFilterChange={setFilterQuery}
          facetFilters={facetFilters}
          onFacetFiltersChange={setFacetFilters}
          facetFilterResetKey={facetFilterResetKey}
          onClearAllFilters={handleClearAllFilters}
          onLog={() => hook.openLogResult()}
          onOpenRecent={handleOpenRecent}
          onNewDrill={() => hook.openNewDrillForm()}
          drillCount={userName?.trim() ? visibleDrills.length : undefined}
          loading={listLoading}
        />
      )}
      {!userName?.trim() ? (
        <Typography variant="body2" color="text.secondary">
          Enter your name to use GTO Study.
        </Typography>
      ) : (
        <ErrorBoundary>
          {!hook.selectedDrillId && !isArchivedView && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={studyFormat}
                  onChange={(_, value: GtoFormat | null) => {
                    if (value) setStudyFormat(value);
                  }}
                  aria-label="Study game format"
                >
                  <ToggleButton value="HU">Heads-Up</ToggleButton>
                  <ToggleButton value="8max">8max Ring</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <DrillTodayCard
                rows={tierRows}
                loading={tierLoading}
                format={studyFormat}
                onOpenHistory={handleOpenHistory}
              />
              <TierProgressPanel
                rows={tierRows}
                loading={tierLoading}
                error={tierError}
                format={studyFormat}
                onOpenHistory={handleOpenHistory}
              />
            </>
          )}
          <DrillHistoryModal
            open={historyDrill != null}
            onClose={() => setHistoryDrill(null)}
            drill={historyDrill}
            userId={userName}
            drillSolvers={drillSolvers}
            onLogResult={handleHistoryLogResult}
            onLoadError={(msg) => onError?.(msg)}
            onDeleteSuccess={(msg) => onSuccess?.(msg)}
            onDeleteError={(msg) => onError?.(msg)}
            onResultsChanged={handleHistoryResultsChanged}
            onEditResult={handleEditFromHistory}
          />
          <RecentResultsModal
            open={recentOpen}
            onClose={() => setRecentOpen(false)}
            userId={userName}
            format={studyFormat}
            refreshKey={tierProgressRefreshKey}
            onEditResult={handleEditFromRecent}
            onOpenDrillHistory={handleOpenHistoryByDrillId}
            onLoadError={(msg) => onError?.(msg)}
            onDeleteSuccess={(msg) => onSuccess?.(msg)}
            onDeleteError={(msg) => onError?.(msg)}
            onResultsChanged={handleHistoryResultsChanged}
          />
          <GtoDrillResultModal
            open={Boolean(hook.editResult) && !hook.selectedDrill}
            onClose={() => {
              hook.setEditResult(null);
              setEditDrillNameHint(null);
            }}
            saving={hook.saving}
            drillName={editDrillName}
            result={hook.editResult?.result ?? null}
            onSubmitCreate={async () => {}}
            onSubmitUpdate={(payload) =>
              hook.handleUpdateResult(
                hook.editResult!.drillId,
                hook.editResult!.result._id,
                payload
              )
            }
          />
          <GtoDrillsTab
            hook={hook}
            listDrills={visibleDrills}
            isArchivedView={isArchivedView}
            listLoading={listLoading}
            onCopySuccess={() => onSuccess?.('Drill name copied')}
            onCopyError={(msg) => onError?.(msg)}
          />
        </ErrorBoundary>
      )}
    </Box>
  );
}
