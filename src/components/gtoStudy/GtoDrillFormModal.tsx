import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useDirtyFormClose } from '../../hooks/useDirtyFormClose';
import { ConfirmDialog } from '../ConfirmDialog';
import { GtoDrillCustomConfigSection } from './GtoDrillCustomConfigSection';
import { GtoDrillDescriptionSection } from './GtoDrillDescriptionSection';
import {
  GTO_ENDS_AFTER_LABELS,
  GTO_ENDS_AFTER_OPTIONS,
  GTO_FORMAT_LABELS,
  GTO_HAND_START_OPTIONS,
  GTO_POT_TYPE_LABELS,
  GTO_SOLVER_OPTIONS,
  getDefaultHeroPosition,
  getDefaultStack,
  getDefaultStreet,
  getPositionsForFormat,
  getPotTypesForDrill,
  getStreetOptionsForHandStart,
  isHuPosition,
  syncHuPostflopPositions,
} from '../../constants/gtoStudy';
import {
  drillToFormState,
  emptyDrillFormState,
  formStateToPayload,
  isDrillFormDirty,
  type GtoDrillFormState,
} from '../../utils/gtoDrillForm';
import type { GtoDrill, GtoDrillCreate, GtoDrillUpdate } from '../../types/gtoStudy';
import type {
  GtoFormat,
  GtoHandStart,
  GtoPosition,
  GtoPotType,
  GtoSolver,
  GtoStack,
  GtoStreetName,
} from '../../types/gtoStudy';

interface GtoDrillFormModalProps {
  open: boolean;
  onClose: () => void;
  saving: boolean;
  drill?: GtoDrill | null;
  cloneForm?: GtoDrillFormState | null;
  onSubmitCreate: (payload: GtoDrillCreate) => Promise<unknown>;
  onSubmitUpdate: (id: string, payload: GtoDrillUpdate) => Promise<unknown>;
  onCopySuccess?: () => void;
  onCopyError?: (msg: string) => void;
}

export function GtoDrillFormModal({
  open,
  onClose,
  saving,
  drill,
  cloneForm,
  onSubmitCreate,
  onSubmitUpdate,
  onCopySuccess,
  onCopyError,
}: GtoDrillFormModalProps) {
  const isEdit = Boolean(drill);
  const isClone = Boolean(cloneForm) && !isEdit;
  const [form, setForm] = useState<GtoDrillFormState>(emptyDrillFormState);
  const baselineRef = useRef<GtoDrillFormState | null>(null);

  const {
    confirmOpen: discardConfirmOpen,
    closeConfirm: closeDiscardConfirm,
    handleConfirm: handleDiscardConfirm,
    confirmOptions: discardConfirmOptions,
    requestClose: requestDirtyClose,
  } = useDirtyFormClose();

  const positions = getPositionsForFormat(form.format);
  const potTypes = useMemo(
    () => getPotTypesForDrill(form.format, form.handStart),
    [form.format, form.handStart]
  );
  const showVillain = form.handStart === 'Postflop';
  const huPostflop = form.format === 'HU' && showVillain;
  const showCustom = form.potType === 'Custom';
  const streetOptions = getStreetOptionsForHandStart(form.handStart);
  const descriptionResetKey = `${open}-${drill?._id ?? ''}-${isClone}`;

  useEffect(() => {
    if (!open) return;
    if (drill) {
      const initial = drillToFormState(drill);
      setForm(initial);
      baselineRef.current = initial;
    } else if (cloneForm) {
      setForm(cloneForm);
      baselineRef.current = cloneForm;
    } else {
      const initial = emptyDrillFormState();
      setForm(initial);
      baselineRef.current = initial;
    }
  }, [open, drill, cloneForm]);

  useEffect(() => {
    if (!open || isEdit || isClone) return;
    const stack = getDefaultStack(form.format);
    const heroPosition = getDefaultHeroPosition(form.format) as GtoPosition;
    setForm((prev) => {
      if (prev.stack === stack && prev.heroPosition === heroPosition) return prev;
      return { ...prev, stack, heroPosition };
    });
  }, [form.format, open, isEdit, isClone]);

  useEffect(() => {
    if (!potTypes.includes(form.potType)) {
      setForm((prev) => ({ ...prev, potType: potTypes[0] }));
    }
  }, [potTypes, form.potType]);

  useEffect(() => {
    if (!open) return;
    const allowed = getStreetOptionsForHandStart(form.handStart);
    if (!allowed.includes(form.street)) {
      setForm((prev) => ({ ...prev, street: getDefaultStreet(form.handStart) }));
    }
  }, [form.handStart, form.street, open]);

  useEffect(() => {
    if (!positions.includes(form.heroPosition)) {
      setForm((prev) => ({ ...prev, heroPosition: positions[0] as GtoPosition }));
    }
  }, [positions, form.heroPosition]);

  useEffect(() => {
    if (form.handStart === 'Preflop') {
      setForm((prev) => (prev.villainPosition === '' ? prev : { ...prev, villainPosition: '' }));
      return;
    }
    if (form.format !== 'HU') return;
    setForm((prev) => {
      const synced = syncHuPostflopPositions(prev.heroPosition, prev.villainPosition, 'hero');
      if (
        prev.heroPosition === synced.heroPosition &&
        prev.villainPosition === synced.villainPosition
      ) {
        return prev;
      }
      return { ...prev, ...synced };
    });
  }, [form.handStart, form.format]);

  const requestClose = () => {
    requestDirtyClose(
      isDrillFormDirty(form, baselineRef.current, !isEdit && !isClone),
      onClose
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = formStateToPayload(form);
    if (drill) {
      await onSubmitUpdate(drill._id, payload);
    } else {
      await onSubmitCreate(payload);
    }
  };

  const handleCopyName = useCallback(async () => {
    const text = form.name.trim();
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
  }, [form.name, onCopySuccess, onCopyError]);

  const patch = (updates: Partial<GtoDrillFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      if (next.format !== 'HU' || next.handStart !== 'Postflop') return next;
      if ('heroPosition' in updates && !('villainPosition' in updates)) {
        return {
          ...next,
          ...syncHuPostflopPositions(next.heroPosition, next.villainPosition, 'hero'),
        };
      }
      if ('villainPosition' in updates && !('heroPosition' in updates)) {
        return {
          ...next,
          ...syncHuPostflopPositions(next.heroPosition, next.villainPosition, 'villain'),
        };
      }
      return next;
    });
  };

  return (
    <>
      <Dialog open={open} onClose={requestClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {isEdit ? 'Edit drill' : isClone ? 'Clone drill' : 'New drill'}
          </DialogTitle>
          <DialogContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              overflow: 'visible',
            }}
          >
            <TextField
              label="Drill name"
              fullWidth
              required
              size="small"
              margin="normal"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value.slice(0, 120) })}
              placeholder="e.g. BTN vs BB SRP"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Copy name for Lucid">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => void handleCopyName()}
                          disabled={!form.name.trim()}
                          aria-label="Copy drill name"
                          edge="end"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Format</InputLabel>
                <Select
                  label="Format"
                  value={form.format}
                  onChange={(e) => patch({ format: e.target.value as GtoFormat })}
                >
                  {(Object.keys(GTO_FORMAT_LABELS) as GtoFormat[]).map((f) => (
                    <MenuItem key={f} value={f}>
                      {GTO_FORMAT_LABELS[f]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Stacks</InputLabel>
                <Select
                  label="Stacks"
                  value={form.stack}
                  onChange={(e) => patch({ stack: e.target.value as GtoStack })}
                >
                  {(form.format === 'HU' ? ['100bb', '200bb'] : ['200bb']).map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Hand starts at</InputLabel>
                <Select
                  label="Hand starts at"
                  value={form.handStart}
                  onChange={(e) => patch({ handStart: e.target.value as GtoHandStart })}
                >
                  {GTO_HAND_START_OPTIONS.map((h) => (
                    <MenuItem key={h} value={h}>
                      {h}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Pot type</InputLabel>
                <Select
                  label="Pot type"
                  value={form.potType}
                  onChange={(e) => patch({ potType: e.target.value as GtoPotType })}
                >
                  {potTypes.map((p) => (
                    <MenuItem key={p} value={p}>
                      {GTO_POT_TYPE_LABELS[p]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Street</InputLabel>
              <Select
                label="Street"
                value={form.street}
                onChange={(e) => patch({ street: e.target.value as GtoStreetName })}
              >
                {streetOptions.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {showCustom && (
              <GtoDrillCustomConfigSection
                streetActions={form.streetActions}
                customNotes={form.customNotes}
                onStreetActionsChange={(streetActions) => patch({ streetActions })}
                onCustomNotesChange={(customNotes) => patch({ customNotes })}
              />
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Hero position</InputLabel>
                <Select
                  label="Hero position"
                  value={form.heroPosition}
                  onChange={(e) => patch({ heroPosition: e.target.value as GtoPosition })}
                >
                  {positions.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {showVillain ? (
                <FormControl fullWidth size="small">
                  <InputLabel>Villain position</InputLabel>
                  <Select
                    label="Villain position"
                    value={form.villainPosition}
                    onChange={(e) =>
                      patch({
                        villainPosition: huPostflop
                          ? (e.target.value as GtoPosition)
                          : (e.target.value as GtoPosition | ''),
                      })
                    }
                  >
                    {!huPostflop && (
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                    )}
                    {(huPostflop ? positions.filter((p) => isHuPosition(p)) : positions).map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Box sx={{ flex: 1 }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Ends after</InputLabel>
                <Select
                  label="Ends after"
                  value={form.endsAfter}
                  onChange={(e) => patch({ endsAfter: e.target.value as GtoDrillFormState['endsAfter'] })}
                >
                  {GTO_ENDS_AFTER_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {GTO_ENDS_AFTER_LABELS[opt]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Solver</InputLabel>
                <Select
                  label="Solver"
                  value={form.solver}
                  onChange={(e) => patch({ solver: e.target.value as GtoSolver })}
                >
                  {GTO_SOLVER_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <GtoDrillDescriptionSection
              value={form.description}
              onChange={(description) => patch({ description })}
              resetKey={descriptionResetKey}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={requestClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : isEdit ? 'Save' : 'Create drill'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <ConfirmDialog
        open={discardConfirmOpen}
        onClose={closeDiscardConfirm}
        onConfirm={handleDiscardConfirm}
        {...discardConfirmOptions}
      />
    </>
  );
}
