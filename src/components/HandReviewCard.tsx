import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BugReportIcon from '@mui/icons-material/BugReport';
import { RichNoteRenderer } from './RichNoteRenderer';
import { HandReviewCommentsSection } from './HandReviewCommentsSection';
import { MDFPanel } from './MDFPanel';
import { FoldEquityPanel } from './FoldEquityPanel';
import type { HandReviewCommentsSectionActions } from './HandReviewCommentsSection';
import { StarRatingInput } from './StarRatingInput';
import { SpicyRatingInput } from './SpicyRatingInput';
import { ChiliIcon } from './ChiliIcon';
import { STAR_COLOR } from '../constants/ratings';
import { DEFAULT_HAND_TITLE } from '../../shared/constants';
import {
  avgRating,
  userRating,
  normalizeStarRating,
  getStarRatingLabel,
  getSpicyRatingLabel,
} from '../utils/handReviewUtils';
import { useCompactMode } from '../context/CompactModeContext';
import { useCalculatorVisibility } from '../context/CalculatorVisibilityContext';
import type { HandToReview } from '../types';

export interface HandReviewCardActions {
  onToggleExpand: (handId: string) => void;
  onCopyLink: (handId: string) => void;
  onEdit: (hand: HandToReview) => void;
  onArchive: (hand: HandToReview) => void;
  onDelete: (handId: string) => void;
  onAddLeak?: (hand: HandToReview) => void;
  onAddLeakForAuthor?: (hand: HandToReview) => void;
  onRate: (handId: string, starRating?: number, spicyRating?: number) => void;
  onMarkReviewed?: (handId: string) => void;
  setHoverStarRating: (handId: string, value: number | null) => void;
  setHoverSpicyRating: (handId: string, value: number | null) => void;
  setRevealedSpoiler: (handId: string, revealed: boolean) => void;
  setRevealedRationale: (handId: string, revealed: boolean) => void;
  commentActions: HandReviewCommentsSectionActions;
}

interface HandReviewCardProps {
  hand: HandToReview;
  expanded: boolean;
  userName: string;
  commentText: string;
  commentSaving: boolean;
  editingComment: { handId: string; commentIndex: number } | null;
  editingCommentText: string;
  expandedComments: Set<string>;
  revealedPrivateComments: Set<string>;
  ratingSaving: boolean;
  revealedSpoilerIds: Set<string>;
  revealedRationaleIds: Set<string>;
  hoverStarRating: number | null;
  hoverSpicyRating: number | null;
  actions: HandReviewCardActions;
}

export function HandReviewCard({
  hand,
  expanded,
  userName,
  commentText,
  commentSaving,
  editingComment,
  editingCommentText,
  expandedComments,
  revealedPrivateComments,
  ratingSaving,
  revealedSpoilerIds,
  revealedRationaleIds,
  hoverStarRating,
  hoverSpicyRating,
  actions: {
    onToggleExpand,
    onCopyLink,
    onEdit,
    onArchive,
    onDelete,
    onAddLeak,
    onAddLeakForAuthor,
    onRate,
    onMarkReviewed,
    setHoverStarRating,
    setHoverSpicyRating,
    setRevealedSpoiler,
    setRevealedRationale,
    commentActions,
  },
}: HandReviewCardProps) {
  const calcVisibility = useCalculatorVisibility();
  const [ratingsExpanded, setRatingsExpanded] = useState(false);
  const starAvg = avgRating(hand.starRatings);
  const spicyAvg = avgRating(hand.spicyRatings);
  const starRatingsList = hand.starRatings ?? [];
  const spicyRatingsList = hand.spicyRatings ?? [];
  const allUsers = [
    ...new Set([
      ...starRatingsList.map((r) => r.user),
      ...spicyRatingsList.map((r) => r.user),
    ]),
  ].sort();
  const spoilerRevealed = revealedSpoilerIds.has(hand._id);
  const rationaleRevealed = revealedRationaleIds.has(hand._id);
  const hasReviewed = userName && (hand.reviewedBy ?? []).includes(userName);
  const canMarkReviewed = userName && !hasReviewed && onMarkReviewed;
  const compact = useCompactMode();

  return (
    <Paper
      variant="outlined"
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        component="button"
        onClick={() => onToggleExpand(hand._id)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 0.25 : 0.5,
          width: '100%',
          minWidth: 0,
          p: compact ? 0.375 : 1,
          minHeight: compact ? 28 : undefined,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          bgcolor: expanded ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <IconButton size="small" sx={{ p: 0, flexShrink: 0 }}>
          {expanded ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Tooltip title={hand.title || DEFAULT_HAND_TITLE} enterDelay={0}>
            <Typography
              variant={compact ? 'caption' : 'body2'}
              component="span"
              sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
              color: 'text.primary',
            }}
            >
              {hand.title || DEFAULT_HAND_TITLE}
            </Typography>
          </Tooltip>
          {(starAvg != null || spicyAvg != null) && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {starAvg != null && (
                <>
                  <Box component="span" sx={{ color: STAR_COLOR }}>★</Box>{' '}
                  {normalizeStarRating(starAvg)} ({(hand.starRatings ?? []).length})
                </>
              )}
              {starAvg != null && spicyAvg != null && ' • '}
              {spicyAvg != null && (
                <>
                  <ChiliIcon size={12} inline /> {spicyAvg} ({(hand.spicyRatings ?? []).length})
                </>
              )}
            </Typography>
          )}
        </Box>
        {hand.isPrivate && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mr: 0.5, flexShrink: 0 }} title="Private (only you see this)">
            <LockIcon sx={{ fontSize: 14 }} />
            Private
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, flexShrink: 0 }}>
          {hand.status === 'archived' ? 'Archived' : 'Open'}
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onCopyLink(hand._id);
          }}
          sx={{ p: 0.25, flexShrink: 0 }}
          aria-label="Copy link"
          title="Copy link to paste in Discord"
        >
          <LinkIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(hand);
          }}
          sx={{ p: 0.25, flexShrink: 0 }}
          aria-label="Edit"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onArchive(hand);
          }}
          sx={{ p: 0.25, flexShrink: 0 }}
          aria-label={hand.status === 'archived' ? 'Unarchive' : 'Archive'}
        >
          {hand.status === 'archived' ? (
            <UnarchiveIcon fontSize="small" />
          ) : (
            <ArchiveIcon fontSize="small" />
          )}
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(hand._id);
          }}
          sx={{ p: 0.25, flexShrink: 0 }}
          aria-label="Delete"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            p: compact ? 0.75 : 1.5,
            pt: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            by {hand.createdBy} • {new Date(hand.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
          </Typography>

          {((hand.taggedReviewerNames ?? []).length > 0) && (
            <Box sx={{ mb: compact ? 0.5 : 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
                Pending reviewers
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(hand.taggedReviewerNames ?? []).map((name) => {
                  const hasActivity =
                    (hand.starRatings ?? []).some((r) => r.user === name) ||
                    (hand.spicyRatings ?? []).some((r) => r.user === name) ||
                    (hand.comments ?? []).some((c) => c.addedBy === name);
                  const hasSeen = (hand.seenBy ?? []).includes(name);
                  const color = hasActivity ? 'success.main' : hasSeen ? 'warning.main' : 'error.main';
                  return (
                    <Typography
                      key={name}
                      variant="caption"
                      sx={{ color, fontWeight: 600 }}
                    >
                      {name}
                    </Typography>
                  );
                })}
              </Box>
            </Box>
          )}

          {userName && (onAddLeak || onAddLeakForAuthor) && (
            <Box sx={{ mb: compact ? 0.5 : 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {onAddLeak && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<BugReportIcon />}
                  onClick={() => onAddLeak(hand)}
                  sx={{ textTransform: 'none' }}
                >
                  Add leak to myself
                </Button>
              )}
              {onAddLeakForAuthor && userName !== hand.createdBy && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<BugReportIcon />}
                  onClick={() => onAddLeakForAuthor(hand)}
                  sx={{ textTransform: 'none' }}
                >
                  Add leak for {hand.createdBy}
                </Button>
              )}
            </Box>
          )}
          {userName && (hasReviewed || canMarkReviewed) && (
            <Box sx={{ mb: compact ? 0.5 : 1 }}>
              {hasReviewed ? (
                <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                  You reviewed this hand
                </Typography>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => onMarkReviewed?.(hand._id)}
                  sx={{ textTransform: 'none' }}
                >
                  Mark as reviewed
                </Button>
              )}
            </Box>
          )}

          <Box sx={{ mb: compact ? 1 : 1.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
            >
              Your rating
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: '3.75rem', display: 'inline-block' }}
                >
                  {getStarRatingLabel(
                    hoverStarRating ?? normalizeStarRating(userRating(hand.starRatings, userName ?? ''))
                  )}
                  :
                </Typography>
                <StarRatingInput
                  value={normalizeStarRating(userRating(hand.starRatings, userName ?? ''))}
                  onChange={(v) => onRate(hand._id, v, undefined)}
                  onHoverChange={(v) => setHoverStarRating(hand._id, v)}
                  size="small"
                  disabled={ratingSaving || !userName}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: '3.75rem', display: 'inline-block' }}
                >
                  {getSpicyRatingLabel(
                    hoverSpicyRating ?? userRating(hand.spicyRatings, userName ?? '')
                  )}
                  :
                </Typography>
                <SpicyRatingInput
                  value={userRating(hand.spicyRatings, userName ?? '')}
                  onChange={(v) => onRate(hand._id, undefined, v)}
                  onHoverChange={(v) => setHoverSpicyRating(hand._id, v)}
                  size="small"
                  disabled={ratingSaving || !userName}
                />
              </Box>
            </Box>
            {(starAvg != null || spicyAvg != null) && (
              <Box sx={{ mt: 0.5 }}>
                <Box
                  component="button"
                  onClick={() => setRatingsExpanded((prev) => !prev)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    p: 0,
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  <Typography variant="caption">
                    Overall: {starAvg != null && (
                      <>
                        <Box component="span" sx={{ color: STAR_COLOR }}>★</Box>{' '}
                        {normalizeStarRating(starAvg)} ({starRatingsList.length})
                      </>
                    )}
                    {starAvg != null && spicyAvg != null && ' • '}
                    {spicyAvg != null && (
                      <>
                        <ChiliIcon size={12} inline /> {spicyAvg} ({spicyRatingsList.length})
                      </>
                    )}
                  </Typography>
                  <IconButton size="small" sx={{ p: 0, ml: 0 }}>
                    {ratingsExpanded ? (
                      <ExpandLessIcon sx={{ fontSize: 14 }} />
                    ) : (
                      <ExpandMoreIcon sx={{ fontSize: 14 }} />
                    )}
                  </IconButton>
                </Box>
                <Collapse in={ratingsExpanded}>
                  <Box
                    sx={{
                      mt: 0.5,
                      pl: 1,
                      borderLeft: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {allUsers.map((user) => {
                      const star = starRatingsList.find((r) => r.user === user);
                      const spicy = spicyRatingsList.find((r) => r.user === user);
                      if (!star && !spicy) return null;
                      return (
                        <Typography
                          key={user}
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', py: 0.25 }}
                        >
                          {user}:{' '}
                          {star != null && (
                            <>
                              <Box component="span" sx={{ color: STAR_COLOR }}>★</Box>{' '}
                              {normalizeStarRating(star.rating)}
                            </>
                          )}
                          {star != null && spicy != null && ' • '}
                          {spicy != null && (
                            <>
                              <ChiliIcon size={12} inline /> {spicy.rating}
                            </>
                          )}
                        </Typography>
                      );
                    })}
                  </Box>
                </Collapse>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: compact ? 0.75 : 1 }}>
            {calcVisibility.showMDF && <MDFPanel compact={compact} />}
            {calcVisibility.showFE && <FoldEquityPanel compact={compact} />}
          </Box>

          <Box
            sx={{
              fontSize: compact ? '0.7rem' : '0.85rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              mb: compact ? 1 : 1.5,
            }}
          >
            {hand.handText ? (
              <RichNoteRenderer text={hand.handText} cardSize={compact ? 'xxxs' : 'sm'} />
            ) : (
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                No hand text
              </Typography>
            )}
          </Box>

          {(hand.rationale ?? '').trim() !== '' && (
            <Box sx={{ mb: compact ? 1 : 1.5 }}>
              <Box
                component="button"
                type="button"
                onClick={() => setRevealedRationale(hand._id, !rationaleRevealed)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  p: 0,
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  '&:hover': { color: 'text.primary' },
                }}
                aria-expanded={rationaleRevealed}
              >
                {rationaleRevealed ? (
                  <ExpandLessIcon sx={{ fontSize: 16 }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: 16 }} />
                )}
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {rationaleRevealed ? 'Hide rationale' : 'Show rationale'}
                </Typography>
              </Box>
              <Collapse in={rationaleRevealed}>
                <Box
                  sx={{
                    mt: 0.5,
                    p: compact ? 0.375 : 1,
                    borderRadius: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    fontSize: compact ? '0.7rem' : '0.85rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <RichNoteRenderer text={hand.rationale ?? ''} cardSize={compact ? 'xxxs' : 'sm'} />
                </Box>
              </Collapse>
            </Box>
          )}

          {(hand.spoilerText ?? '').trim() !== '' && (
            <Box sx={{ mb: compact ? 1 : 1.5 }}>
              <Box
                component="button"
                type="button"
                onClick={() => setRevealedSpoiler(hand._id, !spoilerRevealed)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  p: 0,
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  '&:hover': { color: 'text.primary' },
                }}
                aria-expanded={spoilerRevealed}
              >
                {spoilerRevealed ? (
                  <ExpandLessIcon sx={{ fontSize: 16 }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: 16 }} />
                )}
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {spoilerRevealed ? 'Hide spoiler' : 'Reveal spoiler'}
                </Typography>
              </Box>
              <Collapse in={spoilerRevealed}>
                <Box
                  sx={{
                    mt: 0.5,
                    p: compact ? 0.375 : 1,
                    borderRadius: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    fontSize: compact ? '0.7rem' : '0.85rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <RichNoteRenderer text={hand.spoilerText ?? ''} cardSize={compact ? 'xxxs' : 'sm'} />
                </Box>
              </Collapse>
            </Box>
          )}

          <HandReviewCommentsSection
            hand={hand}
            userName={userName}
            commentText={commentText}
            commentSaving={commentSaving}
            editingComment={editingComment}
            editingCommentText={editingCommentText}
            expandedComments={expandedComments}
            revealedPrivateComments={revealedPrivateComments}
            actions={commentActions}
          />
        </Box>
      </Collapse>
    </Paper>
  );
}
