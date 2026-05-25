import { useState, useEffect, useRef, useCallback } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { GtoDrillFormModal } from './GtoDrillFormModal';
import { GtoDrillResultModal } from './GtoDrillResultModal';
import type { GtoDrill, GtoDrillCreate, GtoDrillResultCreate } from '../../types/gtoStudy';

const NEW_DRILL_VALUE = '__new__';

interface LogResultModalProps {
  open: boolean;
  onClose: () => void;
  saving: boolean;
  drills: GtoDrill[];
  initialDrillId?: string | null;
  onCreateDrill: (payload: GtoDrillCreate) => Promise<GtoDrill | undefined>;
  onLogResult: (drillId: string, payload: GtoDrillResultCreate) => Promise<void>;
  onCopySuccess?: () => void;
  onCopyError?: (msg: string) => void;
}

export function LogResultModal({
  open,
  onClose,
  saving,
  drills,
  initialDrillId,
  onCreateDrill,
  onLogResult,
  onCopySuccess,
  onCopyError,
}: LogResultModalProps) {
  const [selectedId, setSelectedId] = useState<string>(initialDrillId ?? '');
  const [newDrillOpen, setNewDrillOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [pendingDrillId, setPendingDrillId] = useState<string | null>(null);
  const wasOpenRef = useRef(false);

  /** Reset wizard when closed; initialize when opened (not when drills refresh after create). */
  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      setResultOpen(false);
      setNewDrillOpen(false);
      setPendingDrillId(null);
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;
    setSelectedId(
      initialDrillId ?? (drills.length > 0 ? drills[0]._id : NEW_DRILL_VALUE)
    );
    setResultOpen(false);
    setPendingDrillId(null);
  }, [open, initialDrillId, drills]);

  const selectedDrill = drills.find((d) => d._id === selectedId) ?? null;
  const canCopyName =
    selectedId !== NEW_DRILL_VALUE && Boolean(selectedDrill?.name.trim());

  const handleCopySelectedName = useCallback(async () => {
    const text = selectedDrill?.name.trim() ?? '';
    if (!text) {
      onCopyError?.('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      onCopySuccess?.();
    } catch {
      onCopyError?.('Could not copy to clipboard');
    }
  }, [selectedDrill?.name, onCopySuccess, onCopyError]);

  const handleContinue = () => {
    if (selectedId === NEW_DRILL_VALUE) {
      setNewDrillOpen(true);
      return;
    }
    if (!selectedId) return;
    setPendingDrillId(selectedId);
    setResultOpen(true);
  };

  const handleDrillCreated = async (payload: GtoDrillCreate) => {
    const created = await onCreateDrill(payload);
    setNewDrillOpen(false);
    if (created) {
      setSelectedId(created._id);
      setPendingDrillId(created._id);
      setResultOpen(true);
    }
  };

  const activeDrill =
    drills.find((d) => d._id === (pendingDrillId ?? selectedId)) ?? selectedDrill;

  return (
    <>
      <Dialog open={open && !resultOpen && !newDrillOpen} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Log drill result</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Select a drill definition, or create a new one.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Drill</InputLabel>
              <Select
                label="Drill"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <MenuItem value={NEW_DRILL_VALUE}>
                  <em>+ Create new drill…</em>
                </MenuItem>
                {drills.length > 0 && (
                  <MenuItem disabled sx={{ opacity: 1, fontSize: '0.65rem', minHeight: 28 }}>
                    Saved drills
                  </MenuItem>
                )}
                {drills.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Copy name for Lucid">
              <span>
                <IconButton
                  size="small"
                  onClick={() => void handleCopySelectedName()}
                  disabled={!canCopyName}
                  aria-label="Copy drill name"
                  sx={{ mt: 0.5 }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleContinue}
            disabled={!selectedId}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <GtoDrillFormModal
        open={newDrillOpen}
        onClose={() => setNewDrillOpen(false)}
        saving={saving}
        onSubmitCreate={handleDrillCreated}
        onSubmitUpdate={async () => {}}
        onCopySuccess={onCopySuccess}
        onCopyError={onCopyError}
      />

      {activeDrill && (
        <GtoDrillResultModal
          open={resultOpen}
          onClose={() => {
            setResultOpen(false);
            onClose();
          }}
          saving={saving}
          drillName={activeDrill.name}
          onSubmitCreate={(payload) => onLogResult(activeDrill._id, payload)}
          onSubmitUpdate={async () => {}}
        />
      )}
    </>
  );
}
