import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { GTO_STREET_OPTIONS } from '../../constants/gtoStudy';
import type { GtoStreetAction, GtoStreetName } from '../../types/gtoStudy';

interface GtoDrillCustomConfigSectionProps {
  streetActions: GtoStreetAction[];
  customNotes: string;
  onStreetActionsChange: (actions: GtoStreetAction[]) => void;
  onCustomNotesChange: (notes: string) => void;
}

export function GtoDrillCustomConfigSection({
  streetActions,
  customNotes,
  onStreetActionsChange,
  onCustomNotesChange,
}: GtoDrillCustomConfigSectionProps) {
  const addStreet = () => {
    const used = new Set(streetActions.map((s) => s.street));
    const next = GTO_STREET_OPTIONS.find((s) => !used.has(s)) ?? 'Preflop';
    onStreetActionsChange([...streetActions, { street: next, sizing: '' }]);
  };

  const removeStreet = (index: number) => {
    onStreetActionsChange(streetActions.filter((_, i) => i !== index));
  };

  const updateStreet = (index: number, patch: Partial<GtoStreetAction>) => {
    onStreetActionsChange(
      streetActions.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'action.hover',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
        Custom spot config
      </Typography>
      {streetActions.map((row, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 0.5, mb: 1, alignItems: 'flex-start' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Street</InputLabel>
            <Select
              label="Street"
              value={row.street}
              onChange={(e) => updateStreet(index, { street: e.target.value as GtoStreetName })}
            >
              {GTO_STREET_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            fullWidth
            label="Sizing / action line"
            placeholder='e.g. SB: Bet 33%, BB: Raise 2.5x, SB: Call'
            value={row.sizing}
            onChange={(e) => updateStreet(index, { sizing: e.target.value.slice(0, 500) })}
          />
          <IconButton
            size="small"
            onClick={() => removeStreet(index)}
            disabled={streetActions.length <= 1}
            aria-label="Remove street"
            sx={{ mt: 0.5 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={addStreet} sx={{ mb: 1 }}>
        Add street
      </Button>
      <TextField
        size="small"
        fullWidth
        label="Custom notes (optional)"
        multiline
        minRows={2}
        maxRows={4}
        value={customNotes}
        onChange={(e) => onCustomNotesChange(e.target.value.slice(0, 500))}
        helperText={`${customNotes.length}/500`}
      />
    </Box>
  );
}
