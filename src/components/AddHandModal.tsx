import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { HandHistoryFormContent } from './HandHistoryFormContent';

interface AddHandModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  handText: string;
  spoilerText: string;
  initialComment: string;
  initialCommentPrivate: boolean;
  taggedReviewers: string[];
  reviewerOptions: string[];
  saving: boolean;
  onTitleChange: (v: string) => void;
  onHandTextChange: (v: string) => void;
  onSpoilerTextChange: (v: string) => void;
  onInitialCommentChange: (v: string) => void;
  onInitialCommentPrivateChange: (v: boolean) => void;
  onTaggedReviewersChange: (v: string[]) => void;
  onSubmit: () => void;
}

export function AddHandModal({
  open,
  onClose,
  title,
  handText,
  spoilerText,
  initialComment,
  initialCommentPrivate,
  taggedReviewers,
  reviewerOptions,
  saving,
  onTitleChange,
  onHandTextChange,
  onSpoilerTextChange,
  onInitialCommentChange,
  onInitialCommentPrivateChange,
  onTaggedReviewersChange,
  onSubmit,
}: AddHandModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <Typography component="span" variant="h6">
          Add hand for review
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
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
          >
            Tag reviewers (optional)
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
        <Box sx={{ mt: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
          >
            Initial comment (optional)
          </Typography>
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            maxRows={4}
            placeholder="Your thoughts, context, etc. Private by default; uncheck Mark private to show reviewers."
            value={initialComment}
            onChange={(e) => onInitialCommentChange(e.target.value)}
            slotProps={{ input: { 'aria-label': 'Initial comment' } }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={initialCommentPrivate}
                onChange={(e) => onInitialCommentPrivateChange(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="caption" color="text.secondary">
                Mark private (hidden from reviewers)
              </Typography>
            }
            sx={{ mt: 0.5 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={saving || !handText.trim()}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
