import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCompactMode } from '../../context/CompactModeContext';
import { EdgeCard } from './EdgeCard';
import { AddEdgeModal } from './AddEdgeModal';
import type { Edge, EdgeStatus } from '../../types/learning';

interface EdgesTabProps extends ReturnType<typeof import('../../hooks/useEdges').useEdges> {
  userId: string | null;
}

export function EdgesTab({
  userId,
  edges,
  loading,
  filterStatus,
  setFilterStatus,
  addModalOpen,
  setAddModalOpen,
  editEdge,
  setEditEdge,
  saving,
  loadEdges,
  handleCreate,
  handleUpdate,
  handleDelete,
}: EdgesTabProps) {
  const compact = useCompactMode();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAddSubmit = async (payload: Parameters<typeof handleCreate>[0]) => {
    await handleCreate(payload);
  };

  const handleEditSubmit = async (payload: Parameters<typeof handleCreate>[0]) => {
    if (!editEdge) return;
    await handleUpdate(editEdge._id, {
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
            onChange={(e) => setFilterStatus(e.target.value as EdgeStatus | 'all')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="developing">Developing</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </Select>
        </FormControl>
        <IconButton size="small" onClick={() => void loadEdges()} aria-label="Refresh">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      ) : edges.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No edges. Add one to track advantages you&apos;re developing.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.25 : 0.5 }}>
          {edges.map((edge) => (
            <EdgeCard
              key={edge._id}
              edge={edge}
              expanded={expandedId === edge._id}
              onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
              onEdit={(e) => setEditEdge(e)}
              onDelete={handleDelete}
            />
          ))}
        </Box>
      )}

      <AddEdgeModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        userId={userId}
        editEdge={null}
        saving={saving}
        onSubmit={handleAddSubmit}
      />

      <AddEdgeModal
        open={editEdge !== null}
        onClose={() => setEditEdge(null)}
        userId={userId}
        initialTitle={editEdge?.title}
        initialDescription={editEdge?.description}
        initialCategory={editEdge?.category as Edge['category']}
        initialLinkedHandIds={editEdge?.linkedHandIds}
        editEdge={editEdge}
        saving={saving}
        onSubmit={handleEditSubmit}
      />
    </Box>
  );
}
