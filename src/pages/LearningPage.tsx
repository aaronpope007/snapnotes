import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useUserName } from '../context/UserNameContext';
import { useLeaks } from '../hooks/useLeaks';
import { useMentalGame } from '../hooks/useMentalGame';
import { useDueReviews } from '../hooks/useDueReviews';
import { useStudyTodos } from '../hooks/useStudyTodos';
import { LearningTabs, type LearningTabValue } from '../components/learning/LearningTabs';
import { LeaksTab } from '../components/learning/LeaksTab';
import { MentalTab } from '../components/learning/MentalTab';
import { DueForReviewTab } from '../components/learning/DueForReviewTab';
import { StudyTodoTab } from '../components/learning/StudyTodoTab';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface LearningPageProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function LearningPage({ onSuccess, onError }: LearningPageProps) {
  const userName = useUserName();
  const [activeTab, setActiveTab] = useState<LearningTabValue>('leaks');
  const [addLeakInitialText, setAddLeakInitialText] = useState<string | null>(null);

  const due = useDueReviews({ userId: userName, onSuccess, onError });
  const { loadDue, dueLeaks } = due;

  const handleLeakSuccess = useCallback(
    (msg: string) => {
      onSuccess?.(msg);
      void loadDue();
    },
    [onSuccess, loadDue]
  );

  const leaks = useLeaks({
    userId: userName,
    enabled: activeTab === 'leaks',
    onSuccess: handleLeakSuccess,
    onError,
  });
  const mental = useMentalGame({
    userId: userName,
    enabled: activeTab === 'mental',
    onSuccess,
    onError,
  });
  const studyTodos = useStudyTodos({
    userId: userName,
    enabled: activeTab === 'todo',
    onSuccess,
    onError,
  });

  const dueCount = dueLeaks.length;

  return (
    <Box sx={{ width: '100%', maxWidth: 480 }}>
      <LearningTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dueCount={dueCount}
        onAddLeak={() => leaks.setAddModalOpen(true)}
        onAddMental={() => mental.setAddModalOpen(true)}
      />
      {!userName?.trim() ? (
        <Typography variant="body2" color="text.secondary">
          Enter your name to use Leaks.
        </Typography>
      ) : activeTab === 'leaks' ? (
        <ErrorBoundary>
          <LeaksTab
            {...leaks}
            userId={userName}
            initialAddLeakText={addLeakInitialText}
            onClearInitialAddLeakText={() => setAddLeakInitialText(null)}
          />
        </ErrorBoundary>
      ) : activeTab === 'mental' ? (
        <ErrorBoundary>
          <MentalTab {...mental} userId={userName} />
        </ErrorBoundary>
      ) : activeTab === 'todo' ? (
        <ErrorBoundary>
          <StudyTodoTab
            todos={studyTodos.todos}
            loading={studyTodos.loading}
            onAdd={studyTodos.handleAdd}
            onToggle={studyTodos.handleToggle}
            onDelete={studyTodos.handleDelete}
            onAddToLeaks={(text) => {
              setAddLeakInitialText(text);
              setActiveTab('leaks');
            }}
          />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary>
          <DueForReviewTab {...due} userId={userName} />
        </ErrorBoundary>
      )}
    </Box>
  );
}
