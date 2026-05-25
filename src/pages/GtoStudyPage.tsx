import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useUserName } from '../context/UserNameContext';
import { useGtoDrills } from '../hooks/useGtoDrills';
import { GtoStudyTabs } from '../components/gtoStudy/GtoStudyTabs';
import { GtoDrillsTab } from '../components/gtoStudy/GtoDrillsTab';
import { TierProgressPanel } from '../components/gtoStudy/TierProgressPanel';
import { DrillTodayCard } from '../components/gtoStudy/DrillTodayCard';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { filterGtoDrills, emptyGtoDrillFacetFilters } from '../utils/gtoDrillFilter';
import { fetchGtoTierProgress } from '../api/gtoTierProgress';
import type { GtoTierProgressRow } from '../types/gtoTierProgress';

interface GtoStudyPageProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function GtoStudyPage({ onSuccess, onError }: GtoStudyPageProps) {
  const userName = useUserName();
  const hook = useGtoDrills({ userId: userName, onSuccess, onError });
  const [filterQuery, setFilterQuery] = useState('');
  const [facetFilters, setFacetFilters] = useState(emptyGtoDrillFacetFilters);
  const [facetFilterResetKey, setFacetFilterResetKey] = useState(0);
  const [tierRows, setTierRows] = useState<GtoTierProgressRow[]>([]);
  const [tierLoading, setTierLoading] = useState(false);
  const [tierError, setTierError] = useState<string | null>(null);

  const handleClearAllFilters = () => {
    setFilterQuery('');
    setFacetFilters(() => emptyGtoDrillFacetFilters());
    setFacetFilterResetKey((k) => k + 1);
  };

  const visibleDrills = useMemo(
    () => filterGtoDrills(hook.drills, filterQuery, facetFilters),
    [hook.drills, filterQuery, facetFilters]
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
      const data = await fetchGtoTierProgress(userName);
      setTierRows(data);
    } catch {
      setTierError('Failed to load tier progress');
      setTierRows([]);
    } finally {
      setTierLoading(false);
    }
  }, [userName]);

  useEffect(() => {
    void loadTierProgress();
  }, [loadTierProgress, tierProgressRefreshKey]);

  const handleLogResultById = useCallback(
    (drillId: string) => {
      hook.openLogResult(drillId);
    },
    [hook.openLogResult]
  );

  return (
    <Box sx={{ width: '100%' }}>
      {!hook.selectedDrillId && (
        <GtoStudyTabs
          filterQuery={filterQuery}
          onFilterChange={setFilterQuery}
          facetFilters={facetFilters}
          onFacetFiltersChange={setFacetFilters}
          facetFilterResetKey={facetFilterResetKey}
          onClearAllFilters={handleClearAllFilters}
          onLog={() => hook.openLogResult()}
          onNewDrill={() => hook.openNewDrillForm()}
          drillCount={userName?.trim() ? visibleDrills.length : undefined}
          loading={hook.loading}
        />
      )}
      {!userName?.trim() ? (
        <Typography variant="body2" color="text.secondary">
          Enter your name to use GTO Study.
        </Typography>
      ) : (
        <ErrorBoundary>
          {!hook.selectedDrillId && (
            <>
              <DrillTodayCard
                rows={tierRows}
                loading={tierLoading}
                onLogResult={handleLogResultById}
              />
              <TierProgressPanel
                rows={tierRows}
                loading={tierLoading}
                error={tierError}
                onLogResult={handleLogResultById}
              />
            </>
          )}
          <GtoDrillsTab
            hook={hook}
            listDrills={visibleDrills}
            onCopySuccess={() => onSuccess?.('Drill name copied')}
            onCopyError={(msg) => onError?.(msg)}
          />
        </ErrorBoundary>
      )}
    </Box>
  );
}
