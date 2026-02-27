import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCompactMode } from '../../context/CompactModeContext';
import { MentalGameChart } from './MentalGameChart';
import { MentalEntryCard } from './MentalEntryCard';
import { AddMentalEntryModal } from './AddMentalEntryModal';
interface MentalTabProps extends ReturnType<typeof import('../../hooks/useMentalGame').useMentalGame> {
  userId: string | null;
}

export function MentalTab({
  entries,
  loading,
  addModalOpen,
  setAddModalOpen,
  saving,
  loadEntries,
  handleCreate,
  handleDelete,
}: MentalTabProps) {
  const compact = useCompactMode();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: compact ? 1 : 1.5,
        }}
      >
        <IconButton size="small" onClick={() => void loadEntries()} aria-label="Refresh">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      <MentalGameChart entries={entries} maxEntries={30} />

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      ) : entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No entries. Log a session to track your mental game.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.25 : 0.5 }}>
          {entries.map((entry) => (
            <MentalEntryCard key={entry._id} entry={entry} onDelete={handleDelete} />
          ))}
        </Box>
      )}

      <AddMentalEntryModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        saving={saving}
        onSubmit={handleCreate}
      />
    </Box>
  );
}
