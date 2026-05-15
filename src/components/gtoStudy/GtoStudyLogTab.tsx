import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCompactMode } from '../../context/CompactModeContext';
import { GtoStudySessionRow } from './GtoStudySessionRow';
import { GtoStudySessionModal } from './GtoStudySessionModal';
import { groupSessionsByDate } from '../../utils/gtoStudyUtils';
import type { useGtoStudy } from '../../hooks/useGtoStudy';

interface GtoStudyLogTabProps extends ReturnType<typeof useGtoStudy> {}

export function GtoStudyLogTab({
  sessions,
  loading,
  addModalOpen,
  setAddModalOpen,
  editSession,
  setEditSession,
  saving,
  loadSessions,
  handleCreate,
  handleUpdate,
  handleDelete,
}: GtoStudyLogTabProps) {
  const compact = useCompactMode();
  const groups = groupSessionsByDate(sessions);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: compact ? 1 : 1.5 }}>
        <IconButton size="small" onClick={() => void loadSessions()} aria-label="Refresh">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      ) : sessions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No drill sessions yet. Log your first GTO Wizard drill.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 1 : 1.5 }}>
          {groups.map((group) => (
            <Box key={group.dateKey}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  mb: 0.5,
                  fontSize: '0.65rem',
                }}
              >
                {group.header}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.25 : 0.5 }}>
                {group.sessions.map((session) => (
                  <GtoStudySessionRow
                    key={session._id}
                    session={session}
                    onEdit={setEditSession}
                    onDelete={handleDelete}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <GtoStudySessionModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        saving={saving}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
      />
      <GtoStudySessionModal
        open={Boolean(editSession)}
        onClose={() => setEditSession(null)}
        saving={saving}
        session={editSession}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
      />
    </Box>
  );
}
