import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import { HandHistoryFormContent } from './HandHistoryFormContent';

interface EditHandModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  handText: string;
  spoilerText: string;
  isPrivate: boolean;
  taggedReviewers: string[];
  reviewerOptions: string[];
  saving: boolean;
  onTitleChange: (v: string) => void;
  onHandTextChange: (v: string) => void;
  onSpoilerTextChange: (v: string) => void;
  onIsPrivateChange: (v: boolean) => void;
  onTaggedReviewersChange: (v: string[]) => void;
  onSave: () => void;
  onDelete: () => void;
}

export function EditHandModal({
  open,
  onClose,
  title,
  handText,
  spoilerText,
  isPrivate,
  taggedReviewers,
  reviewerOptions,
  saving,
  onTitleChange,
  onHandTextChange,
  onSpoilerTextChange,
  onIsPrivateChange,
  onTaggedReviewersChange,
  onSave,
  onDelete,
}: EditHandModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <Typography component="span" variant="h6">
          Edit hand
        </Typography>
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          — click a card to insert at cursor
        </Typography>
      </DialogTitle>
      <DialogContent>
        <HandHistoryFormContent
          title={title}
          onTitleChange={onTitleChange}
          content={handText}
          onContentChange={onHandTextChange}
          spoilerValue={spoilerText}
          onSpoilerChange={onSpoilerTextChange}
          contentLabel="Hand text"
          placeholder="Paste hand history... Click a card on the right to insert at cursor"
          contentRequired
          cardSize="xs"
        />
        <Box sx={{ mt: 1.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isPrivate}
                onChange={(e) => onIsPrivateChange(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="caption" color="text.secondary">
                Private (for my eyes only)
              </Typography>
            }
          />
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
          >
            Tag reviewers
          </Typography>
          <Autocomplete
            multiple
            size="small"
            options={reviewerOptions}
            value={taggedReviewers}
            onChange={(_, v) => onTaggedReviewersChange(v)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select who should review" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} size="small" {...getTagProps({ index })} />
              ))
            }
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button color="error" onClick={onDelete} disabled={saving}>
          Delete
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saving || !handText.trim()}
          >
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
