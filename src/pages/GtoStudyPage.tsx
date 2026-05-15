import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useUserName } from '../context/UserNameContext';
import { useGtoStudy } from '../hooks/useGtoStudy';
import { GtoStudyTabs, type GtoStudyTabValue } from '../components/gtoStudy/GtoStudyTabs';
import { GtoStudyLogTab } from '../components/gtoStudy/GtoStudyLogTab';
import { GtoStudyEvChart, type GtoChartBreakdown } from '../components/gtoStudy/GtoStudyEvChart';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface GtoStudyPageProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function GtoStudyPage({ onSuccess, onError }: GtoStudyPageProps) {
  const userName = useUserName();
  const [activeTab, setActiveTab] = useState<GtoStudyTabValue>('log');
  const [breakdown, setBreakdown] = useState<GtoChartBreakdown>('none');
  const gtoStudy = useGtoStudy({ userId: userName, onSuccess, onError });

  return (
    <Box sx={{ width: '100%', maxWidth: 480 }}>
      <GtoStudyTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAdd={() => gtoStudy.setAddModalOpen(true)}
      />
      {!userName?.trim() ? (
        <Typography variant="body2" color="text.secondary">
          Enter your name to log GTO study sessions.
        </Typography>
      ) : activeTab === 'log' ? (
        <ErrorBoundary>
          <GtoStudyLogTab {...gtoStudy} />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary>
          <GtoStudyEvChart
            sessions={gtoStudy.sessions}
            breakdown={breakdown}
            onBreakdownChange={setBreakdown}
          />
        </ErrorBoundary>
      )}
    </Box>
  );
}
