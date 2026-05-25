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
  type DrillHistoryDrill,
} from '../components/gtoStudy/DrillHistoryModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { filterGtoDrills, emptyGtoDrillFacetFilters } from '../utils/gtoDrillFilter';
import { fetchGtoTierProgress } from '../api/gtoTierProgress';
import type { GtoFormat } from '../types/gtoStudy';
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
