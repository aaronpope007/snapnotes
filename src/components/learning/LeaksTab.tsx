import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCompactMode } from '../../context/CompactModeContext';
import { LeakCard } from './LeakCard';
import { AddLeakModal } from './AddLeakModal';
import type { Leak, LeakStatus } from '../../types/learning';

interface LeaksTabProps extends ReturnType<typeof import('../../hooks/useLeaks').useLeaks> {
  userId: string | null;
}

export function LeaksTab({
  userId,
  leaks,
  loading,
  filterStatus,
  setFilterStatus,
  expandedId,
  setExpandedId,
  addModalOpen,
  setAddModalOpen,
  editLeak,
  setEditLeak,
  saving,
  loadLeaks,
  handleCreate,
  handleUpdate,
  handleDelete,
  handleStatusCycle,
}: LeaksTabProps) {
  const compact = useCompactMode();

  const handleAddSubmit = async (payload: Parameters<typeof handleCreate>[0]) => {
    await handleCreate(payload);
  };

  const handleEditSubmit = async (payload: Parameters<typeof handleCreate>[0]) => {
    if (!editLeak) return;
    await handleUpdate(editLeak._id, {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      linkedHandIds: payload.linkedHandIds,
    });
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 0.5 : 1,
          mb: compact ? 1 : 1.5,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => setFilterStatus(e.target.value as LeakStatus | 'all')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="identified">Identified</MenuItem>
            <MenuItem value="working">Working</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
        <IconButton size="small" onClick={() => void loadLeaks()} aria-label="Refresh">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      ) : leaks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No leaks. Add one to track spots you want to improve.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.25 : 0.5 }}>
          {leaks.map((leak) => (
            <LeakCard
              key={leak._id}
              leak={leak}
              expanded={expandedId === leak._id}
              onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
              onStatusCycle={handleStatusCycle}
              onEdit={(l) => setEditLeak(l)}
              onDelete={handleDelete}
            />
          ))}
        </Box>
      )}

      <AddLeakModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        userId={userId}
        editLeak={null}
        saving={saving}
        onSubmit={handleAddSubmit}
      />

      <AddLeakModal
        open={editLeak !== null}
        onClose={() => setEditLeak(null)}
        userId={userId}
        initialTitle={editLeak?.title}
        initialDescription={editLeak?.description}
        initialCategory={editLeak?.category as Leak['category']}
        initialLinkedHandIds={editLeak?.linkedHandIds}
        editLeak={editLeak}
        saving={saving}
        onSubmit={handleEditSubmit}
      />
    </Box>
  );
}
