import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCompactMode } from '../../context/CompactModeContext';
import { ConfirmDialog } from '../ConfirmDialog';
import { GtoDrillRow } from './GtoDrillRow';
import { GtoDrillDetailView } from './GtoDrillDetailView';
import { GtoDrillFormModal } from './GtoDrillFormModal';
import { GtoDrillResultModal } from './GtoDrillResultModal';
import { LogResultModal } from './LogResultModal';
import type { useGtoDrills } from '../../hooks/useGtoDrills';
import type { GtoDrill } from '../../types/gtoStudy';

interface GtoDrillsTabProps {
  hook: ReturnType<typeof useGtoDrills>;
  listDrills: GtoDrill[];
}

export function GtoDrillsTab({ hook, listDrills }: GtoDrillsTabProps) {
  const compact = useCompactMode();

  if (hook.selectedDrill) {
    return (
      <>
        <GtoDrillDetailView drill={hook.selectedDrill} hook={hook} />
        <GtoDrillFormModal
          open={hook.drillFormOpen && Boolean(hook.editDrill)}
          onClose={() => {
            hook.setDrillFormOpen(false);
            hook.setEditDrill(null);
          }}
          saving={hook.saving}
          drill={hook.editDrill}
          onSubmitCreate={hook.handleCreateDrill}
          onSubmitUpdate={hook.handleUpdateDrill}
        />
        <GtoDrillResultModal
          open={Boolean(hook.editResult)}
          onClose={() => hook.setEditResult(null)}
          saving={hook.saving}
          drillName={hook.selectedDrill.name}
          result={hook.editResult?.result ?? null}
          onSubmitCreate={async () => {}}
          onSubmitUpdate={(payload) =>
            hook.handleUpdateResult(
              hook.editResult!.drillId,
              hook.editResult!.result._id,
              payload
            )
          }
        />
        <ConfirmDialog
          open={hook.deleteResultConfirmOpen}
          onClose={hook.closeDeleteResultConfirm}
          onConfirm={hook.handleDeleteResultConfirm}
          {...hook.deleteResultConfirmOptions}
        />
      </>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: compact ? 1 : 1.5 }}>
        <IconButton size="small" onClick={() => void hook.loadDrills()} aria-label="Refresh">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {hook.loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      ) : hook.drills.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No drills yet. Create a drill definition, then log results from GTO Wizard.
        </Typography>
      ) : listDrills.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No drills match your search.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.5 : 0.75 }}>
          {listDrills.map((drill) => (
            <GtoDrillRow
              key={drill._id}
              drill={drill}
              onOpenDrill={(d) => hook.openDrillDetail(d._id, 'results')}
              onOpenChart={(d) => hook.openDrillDetail(d._id, 'chart')}
              onLogResult={hook.openLogResult}
              onEdit={(d) => {
                hook.setEditDrill(d);
                hook.setDrillFormOpen(true);
              }}
              onDelete={hook.requestDeleteDrill}
            />
          ))}
        </Box>
      )}

      <GtoDrillFormModal
        open={hook.drillFormOpen}
        onClose={() => {
          hook.setDrillFormOpen(false);
          hook.setEditDrill(null);
        }}
        saving={hook.saving}
        drill={hook.editDrill}
        onSubmitCreate={hook.handleCreateDrill}
        onSubmitUpdate={hook.handleUpdateDrill}
      />

      <LogResultModal
        open={hook.logResultOpen}
        onClose={() => {
          hook.setLogResultOpen(false);
        }}
        saving={hook.saving}
        drills={hook.drills}
        initialDrillId={hook.logResultDrillId}
        onCreateDrill={hook.handleCreateDrill}
        onLogResult={async (drillId, payload) => {
          await hook.handleCreateResult(drillId, payload);
        }}
      />

      <GtoDrillResultModal
        open={Boolean(hook.editResult) && !hook.selectedDrill}
        onClose={() => hook.setEditResult(null)}
        saving={hook.saving}
        drillName={hook.drills.find((d) => d._id === hook.editResult?.drillId)?.name ?? 'Drill'}
        result={hook.editResult?.result ?? null}
        onSubmitCreate={async () => {}}
        onSubmitUpdate={(payload) =>
          hook.handleUpdateResult(
            hook.editResult!.drillId,
            hook.editResult!.result._id,
            payload
          )
        }
      />

      <ConfirmDialog
        open={hook.deleteDrillConfirmOpen}
        onClose={hook.closeDeleteDrillConfirm}
        onConfirm={hook.handleDeleteDrillConfirm}
        {...hook.deleteDrillConfirmOptions}
      />
      <ConfirmDialog
        open={hook.deleteResultConfirmOpen}
        onClose={hook.closeDeleteResultConfirm}
        onConfirm={hook.handleDeleteResultConfirm}
        {...hook.deleteResultConfirmOptions}
      />
    </Box>
  );
}
