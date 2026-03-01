import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { fetchHandsToReview } from '../api/handsToReview';
import { useUserName } from '../context/UserNameContext';
import { useCompactMode } from '../context/CompactModeContext';

const STORAGE_KEY = 'snapnotes_topbar_dismissed_date';

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function wasDismissedToday(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  return stored === getTodayDateString();
}

function dismissBar(): void {
  localStorage.setItem(STORAGE_KEY, getTodayDateString());
}

interface TopNotificationBarProps {
  onReviewClick?: () => void;
}

export function TopNotificationBar({ onReviewClick }: TopNotificationBarProps) {
  const userName = useUserName();
  const compact = useCompactMode();
  const [forMeCount, setForMeCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(wasDismissedToday());

  // Re-show bar when a new day starts (e.g. app left open overnight)
  useEffect(() => {
    const interval = setInterval(() => {
      if (dismissed && forMeCount > 0 && !wasDismissedToday()) {
        setDismissed(false);
      }
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [dismissed, forMeCount]);

  useEffect(() => {
    if (!userName?.trim()) {
      setForMeCount(0);
      return;
    }
    let cancelled = false;
    fetchHandsToReview('open', userName)
      .then((hands) => {
        if (cancelled) return;
        const count = hands.filter(
          (h) =>
            (h.taggedReviewerNames ?? []).includes(userName) &&
            !(h.reviewedBy ?? []).includes(userName) &&
            h.status !== 'archived'
        ).length;
        setForMeCount(count);
      })
      .catch(() => {
        if (!cancelled) setForMeCount(0);
      });
    return () => { cancelled = true; };
  }, [userName]);

  useEffect(() => {
    setVisible(forMeCount > 0 && !dismissed);
  }, [forMeCount, dismissed]);

  const handleClose = () => {
    dismissBar();
    setDismissed(true);
  };

  if (!visible) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        px: compact ? 1.5 : 2,
        py: compact ? 0.75 : 1,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
        <RateReviewIcon sx={{ fontSize: compact ? 18 : 20, flexShrink: 0 }} />
        <Typography variant={compact ? 'caption' : 'body2'} sx={{ fontWeight: 500 }}>
          You have {forMeCount} hand{forMeCount !== 1 ? 's' : ''} tagged for you to review.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        {onReviewClick && (
          <Button
            size="small"
            variant="contained"
            color="inherit"
            sx={{
              color: 'primary.main',
              bgcolor: 'primary.contrastText',
              textTransform: 'none',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => {
              onReviewClick();
            }}
          >
            Review
          </Button>
        )}
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ color: 'primary.contrastText' }}
          aria-label="Dismiss"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
