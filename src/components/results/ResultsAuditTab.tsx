import { useMemo, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { SessionFormatFilter, SessionResult } from '../../types/results';
import {
  auditRowsToCsv,
  buildBankrollCarryAuditRows,
  sumAuditNetForIds,
} from '../../utils/sessionBankrollAudit';

function formatFilterLabel(f: SessionFormatFilter): string {
  if (f === 'all') return 'All';
  if (f === 'huOnly') return 'HU only';
  if (f === 'ringOnly') return 'Ring only';
  return 'Both';
}

function howLabel(h: string): string {
  if (h === 'explicit_start_end') return 'Start+end';
  if (h === 'carry_plus_end') return 'Prior end → end';
  if (h === 'daily_net_fallback') return 'Daily net';
  return '—';
}

interface ResultsAuditTabProps {
  allSessions: SessionResult[];
  formatFilteredSessions: SessionResult[];
  formatFilter: SessionFormatFilter;
  loading: boolean;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function ResultsAuditTab({
  allSessions,
  formatFilteredSessions,
  formatFilter,
  loading,
  onSuccess,
  onError,
}: ResultsAuditTabProps) {
  const [copied, setCopied] = useState(false);

  const auditRows = useMemo(
    () => buildBankrollCarryAuditRows(allSessions),
    [allSessions]
  );

  const filteredIds = useMemo(
    () => new Set(formatFilteredSessions.map((s) => s._id)),
    [formatFilteredSessions]
  );

  const totalAll = useMemo(
    () => auditRows.reduce((sum, r) => sum + r.netUsed, 0),
    [auditRows]
  );

  const totalFiltered = useMemo(
    () => sumAuditNetForIds(auditRows, filteredIds),
    [auditRows, filteredIds]
  );

  const warningCount = useMemo(
    () => auditRows.reduce((n, r) => n + (r.warnings.length > 0 ? 1 : 0), 0),
    [auditRows]
  );

  const handleCopyCsv = useCallback(async () => {
    const csv = auditRowsToCsv(auditRows);
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      onSuccess?.('Audit table copied as CSV.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      onError?.('Could not copy to clipboard.');
    }
  }, [auditRows, onSuccess, onError]);

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading…
      </Typography>
    );
  }

  if (allSessions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Add sessions to run an audit.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          This table uses the same rules as the sessions grid and Summary: sessions are sorted by date, and when
          account start is blank the prior session&apos;s end bankroll is used (full history, not only the current
          format filter).
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          Net used is what totals use. Δ bankroll is end minus effective start when both exist. Compare with Daily net
          if you logged both.
        </Typography>
      </Alert>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Reconciliation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sum of net used (all sessions, chronological):{' '}
          <Box component="span" sx={{ color: totalAll >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
            ${totalAll.toFixed(2)}
          </Box>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sum for current filter ({formatFilterLabel(formatFilter)}):{' '}
          <Box component="span" sx={{ color: totalFiltered >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
            ${totalFiltered.toFixed(2)}
          </Box>{' '}
          ({filteredIds.size} session{filteredIds.size !== 1 ? 's' : ''})
        </Typography>
        {warningCount > 0 && (
          <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
            {warningCount} row{warningCount !== 1 ? 's' : ''} with warnings — check the last column.
          </Typography>
        )}
        <Button
          size="small"
          variant="outlined"
          startIcon={<ContentCopyIcon />}
          onClick={() => void handleCopyCsv()}
          sx={{ mt: 1 }}
        >
          {copied ? 'Copied' : 'Copy audit as CSV'}
        </Button>
      </Paper>

      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 480 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Fmt</TableCell>
              <TableCell align="right">Start (stored)</TableCell>
              <TableCell align="right">Start (eff.)</TableCell>
              <TableCell align="right">End</TableCell>
              <TableCell align="right">Δ bankroll</TableCell>
              <TableCell align="right">Daily net</TableCell>
              <TableCell align="right">Net used</TableCell>
              <TableCell>How</TableCell>
              <TableCell>Warnings</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditRows.map((r) => (
              <TableRow
                key={r.sessionId}
                sx={{
                  bgcolor: filteredIds.has(r.sessionId) ? 'action.selected' : undefined,
                }}
              >
                <TableCell>{r.dateKey}</TableCell>
                <TableCell>{r.formatShort}</TableCell>
                <TableCell align="right">
                  {r.startStored != null ? `$${r.startStored.toFixed(2)}` : '—'}
                </TableCell>
                <TableCell align="right">
                  {r.startEffective != null ? `$${r.startEffective.toFixed(2)}` : '—'}
                </TableCell>
                <TableCell align="right">
                  {r.endStored != null ? `$${r.endStored.toFixed(2)}` : '—'}
                </TableCell>
                <TableCell align="right">
                  {r.netFromBankrolls != null ? (
                    <Box
                      component="span"
                      sx={{ color: r.netFromBankrolls >= 0 ? 'success.main' : 'error.main' }}
                    >
                      ${r.netFromBankrolls.toFixed(2)}
                    </Box>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell align="right">
                  {r.dailyNetStored != null ? (
                    <Box
                      component="span"
                      sx={{ color: r.dailyNetStored >= 0 ? 'success.main' : 'error.main' }}
                    >
                      ${r.dailyNetStored.toFixed(2)}
                    </Box>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell align="right">
                  <Box
                    component="span"
                    sx={{ color: r.netUsed >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}
                  >
                    ${r.netUsed.toFixed(2)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {howLabel(r.howComputed)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 220 }}>
                  <Typography variant="caption" color="warning.main">
                    {r.warnings.length ? r.warnings.join(' · ') : '—'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary">
        Rows highlighted use the current format filter. ID in CSV is the full Mongo id for matching edits.
      </Typography>
    </Box>
  );
}
