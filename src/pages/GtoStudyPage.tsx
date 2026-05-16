import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useUserName } from '../context/UserNameContext';
import { useGtoDrills } from '../hooks/useGtoDrills';
import { GtoStudyTabs } from '../components/gtoStudy/GtoStudyTabs';
import { GtoDrillsTab } from '../components/gtoStudy/GtoDrillsTab';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { filterGtoDrillsByQuery } from '../utils/gtoDrillFilter';

interface GtoStudyPageProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function GtoStudyPage({ onSuccess, onError }: GtoStudyPageProps) {
  const userName = useUserName();
  const hook = useGtoDrills({ userId: userName, onSuccess, onError });
  const [filterQuery, setFilterQuery] = useState('');

  const visibleDrills = useMemo(
    () => filterGtoDrillsByQuery(hook.drills, filterQuery),
    [hook.drills, filterQuery]
  );

  return (
    <Box sx={{ width: '100%', maxWidth: 480 }}>
      {!hook.selectedDrillId && (
        <GtoStudyTabs
          filterQuery={filterQuery}
          onFilterChange={setFilterQuery}
          onLog={() => hook.openLogResult()}
          onNewDrill={() => {
            hook.setEditDrill(null);
            hook.setDrillFormOpen(true);
          }}
        />
      )}
      {!userName?.trim() ? (
        <Typography variant="body2" color="text.secondary">
          Enter your name to use GTO Study.
        </Typography>
      ) : (
        <ErrorBoundary>
          <GtoDrillsTab hook={hook} listDrills={visibleDrills} />
        </ErrorBoundary>
      )}
    </Box>
  );
}
