import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import type { SessionResultCreate, SessionUploadRow } from '../../types/results';
import { RESULTS_STAKE_OPTIONS } from '../../types/results';

interface AddOrUploadTabProps {
  userId: string | null;
  onAddSession: (payload: SessionResultCreate) => Promise<void>;
  onUpload: (sessions: SessionUploadRow[]) => Promise<{ count: number }>;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

/** Parse one CSV line handling quoted fields (e.g. "1,436") */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i += 1;
      let cell = '';
      while (i < line.length && line[i] !== '"') {
        cell += line[i];
        i += 1;
      }
      if (line[i] === '"') i += 1;
      out.push(cell.trim());
      if (line[i] === ',') i += 1;
    } else {
      let cell = '';
      while (i < line.length && line[i] !== ',') {
        cell += line[i];
        i += 1;
      }
      out.push(cell.trim());
      if (line[i] === ',') i += 1;
    }
  }
  return out;
}

/** Parse CSV text with headers: Date, total time, hands, Daily Net, Hands Start, Hands End, Account End (case-insensitive, flexible) */
function parseResultsCsv(text: string): SessionUploadRow[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());
  const dateIdx = headers.findIndex((h) => h === 'date' || h.includes('date'));
  const timeIdx = headers.findIndex((h) => h.includes('time') && h.includes('total'));
  const handsStartIdx = headers.findIndex((h) => h.includes('hands') && h.includes('start'));
  const handsEndIdx = headers.findIndex((h) => h.includes('hands') && h.includes('end') && !h.includes('start'));
  const handsIdx = headers.findIndex((h) => h === 'hands');
  const netIdx = headers.findIndex((h) => h.includes('net') || h === 'daily net');
  const accountEndIdx = headers.findIndex((h) => h === 'account end' || h === 'accountend');

  if (dateIdx === -1) return [];

  const rows: SessionUploadRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]).map((c) => c.replace(/^"|"$/g, ''));
    const dateVal = cells[dateIdx];
    if (!dateVal) continue;
    const timeVal = timeIdx >= 0 && cells[timeIdx] !== undefined ? cells[timeIdx].replace(/,/g, '') : undefined;
    const handsStartVal = handsStartIdx >= 0 && cells[handsStartIdx] !== undefined ? cells[handsStartIdx].replace(/,/g, '') : undefined;
    const handsEndVal = handsEndIdx >= 0 && cells[handsEndIdx] !== undefined ? cells[handsEndIdx].replace(/,/g, '') : undefined;
    const handsVal = handsIdx >= 0 && cells[handsIdx] !== undefined ? cells[handsIdx].replace(/,/g, '') : undefined;
    const netVal = netIdx >= 0 && cells[netIdx] !== undefined ? cells[netIdx].replace(/[$,]/g, '') : undefined;
    const accountEndVal = accountEndIdx >= 0 && cells[accountEndIdx] !== undefined ? cells[accountEndIdx].replace(/[$,]/g, '') : undefined;
    rows.push({
      date: dateVal,
      totalTime: timeVal || undefined,
      handsStartedAt: handsStartVal || undefined,
      handsEndedAt: handsEndVal || undefined,
      hands: handsVal || undefined,
      dailyNet: netVal || undefined,
      endBankroll: accountEndVal || undefined,
    });
  }
  return rows;
}

export function AddOrUploadTab({
  userId,
  onAddSession,
  onUpload,
  onSuccess,
  onError,
}: AddOrUploadTabProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [stake, setStake] = useState<number | ''>('');
  const [isRing, setIsRing] = useState(false);
  const [isHU, setIsHU] = useState(false);
  const [gameType, setGameType] = useState<'NLHE' | 'PLO'>('NLHE');
  const [hands, setHands] = useState<string>('');
  const [dailyNet, setDailyNet] = useState<string>('');
  const [csvText, setCsvText] = useState('');
  const [uploadFileKey, setUploadFileKey] = useState(0);

  const totalTimeFromTimes =
    startTime && endTime
      ? (() => {
          const [sh, sm] = startTime.split(':').map(Number);
          const [eh, em] = endTime.split(':').map(Number);
          const startMins = (sh ?? 0) * 60 + (sm ?? 0);
          let endMins = (eh ?? 0) * 60 + (em ?? 0);
          if (endMins < startMins) endMins += 24 * 60;
          return (endMins - startMins) / 60;
        })()
      : null;

  const handleSubmitSession = useCallback(async () => {
    if (!userId?.trim()) {
      onError('Enter your name to add sessions.');
      return;
    }
    setSaving(true);
    try {
      const sessionDate = date ? `${date}T12:00:00` : new Date().toISOString();
      const payload: SessionResultCreate = {
        date: sessionDate,
        totalTime: totalTimeFromTimes != null ? Math.round(totalTimeFromTimes * 100) / 100 : undefined,
        hands: hands.trim() ? Number(hands) : undefined,
        dailyNet: dailyNet.trim() ? Number(dailyNet.replace(/[$,]/g, '')) : undefined,
        startTime: startTime ? `${date}T${startTime}:00` : undefined,
        endTime: endTime ? `${date}T${endTime}:00` : undefined,
        stake: stake === '' ? undefined : stake,
        isRing: isRing || undefined,
        isHU: isHU || undefined,
        gameType,
      };
      await onAddSession(payload);
      onSuccess('Session added.');
      setStartTime('');
      setEndTime('');
      setHands('');
      setDailyNet('');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to add session');
    } finally {
      setSaving(false);
    }
  }, [
    userId,
    date,
    startTime,
    endTime,
    stake,
    isRing,
    isHU,
    gameType,
    hands,
    dailyNet,
    totalTimeFromTimes,
    onAddSession,
    onSuccess,
    onError,
  ]);

  const handleUploadCsv = useCallback(async () => {
    const rows = parseResultsCsv(csvText);
    if (rows.length === 0) {
      onError('Paste CSV with a header row including "Date". Columns: Date, total time, hands, Daily Net.');
      return;
    }
    if (!userId?.trim()) {
      onError('Enter your name to upload.');
      return;
    }
    setUploading(true);
    try {
      const { count } = await onUpload(rows);
      onSuccess(`Uploaded ${count} session(s).`);
      setCsvText('');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [csvText, userId, onUpload, onSuccess, onError]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        // If UTF-8 produced replacement chars (garbled), retry with ISO-8859-1 (common for Excel CSVs on Windows)
        if (text.includes('\uFFFD')) {
          const fallback = new FileReader();
          fallback.onload = () => setCsvText(String(fallback.result ?? ''));
          fallback.readAsText(file, 'ISO-8859-1');
        } else {
          setCsvText(text);
        }
      };
      reader.readAsText(file, 'UTF-8');
      setUploadFileKey((k) => k + 1);
    },
    []
  );

  if (!userId?.trim()) {
    return (
      <Typography variant="body2" color="text.secondary">
        Enter your name in the app to add or upload sessions.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Add new session
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <TextField
          label="Date"
          type="date"
          size="small"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
        />
        <TextField
          label="Start"
          type="time"
          size="small"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 100 }}
        />
        <TextField
          label="End"
          type="time"
          size="small"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 100 }}
        />
        <TextField
          select
          label="Stake"
          size="small"
          value={stake === '' ? '' : stake}
          onChange={(e) => setStake(e.target.value === '' ? '' : Number(e.target.value) || '')}
          sx={{ minWidth: 90 }}
        >
          <MenuItem value="">—</MenuItem>
          {RESULTS_STAKE_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Game"
          size="small"
          value={gameType}
          onChange={(e) => setGameType(e.target.value as 'NLHE' | 'PLO')}
          sx={{ minWidth: 100 }}
        >
          <MenuItem value="NLHE">NLHE</MenuItem>
          <MenuItem value="PLO">PLO</MenuItem>
        </TextField>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <FormControlLabel
          control={<Checkbox checked={isRing} onChange={(e) => setIsRing(e.target.checked)} size="small" />}
          label="Ring"
        />
        <FormControlLabel
          control={<Checkbox checked={isHU} onChange={(e) => setIsHU(e.target.checked)} size="small" />}
          label="HU"
        />
        <TextField
          label="Hands"
          type="number"
          size="small"
          value={hands}
          onChange={(e) => setHands(e.target.value)}
          sx={{ width: 90 }}
        />
        <TextField
          label="Net"
          size="small"
          value={dailyNet}
          onChange={(e) => setDailyNet(e.target.value)}
          placeholder="$0.00"
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          sx={{ width: 110 }}
        />
      </Box>
      <Button variant="contained" onClick={handleSubmitSession} disabled={saving}>
        {saving ? 'Adding…' : 'Add session'}
      </Button>

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
        Upload CSV (Date, total time, hands, Daily Net)
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        First row = headers. Date required; other columns optional.
      </Typography>
      <Button
        variant="outlined"
        component="label"
        startIcon={<CloudUploadIcon />}
        size="small"
      >
        Choose file
        <input
          key={uploadFileKey}
          type="file"
          accept=".csv,.txt"
          hidden
          onChange={handleFileChange}
        />
      </Button>
      <TextField
        multiline
        minRows={4}
        maxRows={10}
        placeholder="Or paste CSV here (header: Date, total time, hands, Daily Net)"
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        size="small"
        fullWidth
      />
      <Button
        variant="outlined"
        onClick={handleUploadCsv}
        disabled={uploading || !csvText.trim()}
      >
        {uploading ? 'Uploading…' : 'Upload'}
      </Button>
    </Box>
  );
}
