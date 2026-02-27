import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useUserName } from '../context/UserNameContext';
import { useLeaks } from '../hooks/useLeaks';
import { useEdges } from '../hooks/useEdges';
import { useMentalGame } from '../hooks/useMentalGame';
import { useDueReviews } from '../hooks/useDueReviews';
import { fetchDueLeaks } from '../api/learning';
import { LearningTabs, type LearningTabValue } from '../components/learning/LearningTabs';
import { LeaksTab } from '../components/learning/LeaksTab';
import { EdgesTab } from '../components/learning/EdgesTab';
import { MentalTab } from '../components/learning/MentalTab';
import { DueForReviewTab } from '../components/learning/DueForReviewTab';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface LearningPageProps {
  onBack?: () => void;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function LearningPage({ onBack, onSuccess, onError }: LearningPageProps) {
  const userName = useUserName();
  const [activeTab, setActiveTab] = useState<LearningTabValue>('leaks');
  const [dueCount, setDueCount] = useState(0);

  const loadDueCount = useCallback(async () => {
    if (!userName?.trim()) {
      setDueCount(0);
      return;
    }
    try {
      const list = await fetchDueLeaks(userName);
      setDueCount(list?.length ?? 0);
    } catch {
      setDueCount(0);
    }
  }, [userName]);

  const handleLeakSuccess = useCallback(
    (msg: string) => {
      onSuccess?.(msg);
      void loadDueCount();
    },
    [onSuccess, loadDueCount]
  );

  const handleDueSuccess = useCallback(
    (msg: string) => {
      onSuccess?.(msg);
      void loadDueCount();
    },
    [onSuccess, loadDueCount]
  );

  const leaks = useLeaks({ userId: userName, onSuccess: handleLeakSuccess, onError });
  const edges = useEdges({ userId: userName, onSuccess, onError });
  const mental = useMentalGame({ userId: userName, onSuccess, onError });
  const due = useDueReviews({ userId: userName, onSuccess: handleDueSuccess, onError });

  useEffect(() => {
    void loadDueCount();
  }, [loadDueCount, due.dueLeaks.length]);

  return (
    <Box sx={{ width: '100%', maxWidth: 480 }}>
      {onBack && (
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ mb: 1 }}
        >
          Back
        </Button>
      )}
      <LearningTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dueCount={dueCount}
        onAddLeak={() => leaks.setAddModalOpen(true)}
        onAddEdge={() => edges.setAddModalOpen(true)}
        onAddMental={() => mental.setAddModalOpen(true)}
      />
      {!userName?.trim() ? (
        <Typography variant="body2" color="text.secondary">
          Enter your name to use Leaks &amp; Edge.
        </Typography>
      ) : activeTab === 'leaks' ? (
        <ErrorBoundary>
          <LeaksTab {...leaks} userId={userName} />
        </ErrorBoundary>
      ) : activeTab === 'edges' ? (
        <ErrorBoundary>
          <EdgesTab {...edges} userId={userName} />
        </ErrorBoundary>
      ) : activeTab === 'mental' ? (
        <ErrorBoundary>
          <MentalTab {...mental} userId={userName} />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary>
          <DueForReviewTab {...due} userId={userName} />
        </ErrorBoundary>
      )}
    </Box>
  );
}
