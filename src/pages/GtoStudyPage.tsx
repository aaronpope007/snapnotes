import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useUserName } from '../context/UserNameContext';
import { useGtoDrills } from '../hooks/useGtoDrills';
import { GtoStudyTabs } from '../components/gtoStudy/GtoStudyTabs';
import { GtoDrillsTab } from '../components/gtoStudy/GtoDrillsTab';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface GtoStudyPageProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function GtoStudyPage({ onSuccess, onError }: GtoStudyPageProps) {
  const userName = useUserName();
  const hook = useGtoDrills({ userId: userName, onSuccess, onError });

  return (
    <Box sx={{ width: '100%', maxWidth: 480 }}>
      {!hook.selectedDrillId && (
        <GtoStudyTabs
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
          <GtoDrillsTab hook={hook} />
        </ErrorBoundary>
      )}
    </Box>
  );
}
