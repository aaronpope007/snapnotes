/** UUID v4 (lowercase or uppercase hex). */
export const BET_CLIPBOARD_SYNC_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const BET_CLIPBOARD_CLOUD_VERSION = 1 as const;

export type BetClipboardStackDepthCloud = '50' | '75' | '100' | '150' | '200';

/** Stored in MongoDB under `payload` — validated in the client before use. */
export interface BetClipboardCloudPayloadV1 {
  version: typeof BET_CLIPBOARD_CLOUD_VERSION;
  sizingsByStack: unknown;
  stakePresets: unknown;
  selectedStakePresetName: string;
  srpPotBlinds: number;
  threeBetPotBlinds: number;
  fourBetPotBlinds: number;
  fiveBetPotBlinds: number;
  stackDepth: BetClipboardStackDepthCloud;
  selectedOpenKey: string;
}

export interface BetClipboardSyncResponse {
  syncId: string;
  payload: unknown;
  updatedAt: string;
}
