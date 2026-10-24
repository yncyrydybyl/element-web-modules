import React, { useEffect, useState } from "react";
import { t } from "../i18n";
import { AppsIcon } from "./AppsIcon";

export interface AppsButtonProps {
  roomId: string;
  /** Recomputed on render and on room state changes: "can" (store present or may add), "moderator" (may not add). */
  getMode: (roomId: string) => "can" | "moderator";
  /** Is the store currently open in this room's right panel (for aria-pressed)? */
  isOpen: (roomId: string) => boolean;
  /** Subscribe to changes that affect getMode/isOpen; returns an unsubscribe function. */
  subscribe: (roomId: string, cb: () => void) => () => void;
  onActivate: (roomId: string) => Promise<unknown>;
}

/**
 * Header icon button. A real <button> (Enter/Space work natively); accessible name "Apps", the tooltip
 * (title) doubles as aria-description.
 * When the user may not add apps and the store is not in the room it looks disabled (aria-disabled, still
 * focusable and clickable) and the click explains why.
 */
export function AppsButton({ roomId, getMode, isOpen, subscribe, onActivate }: AppsButtonProps) {
  const [, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => subscribe(roomId, () => setTick((n) => n + 1)), [roomId, subscribe]);
  const mode = getMode(roomId);
  const open = isOpen(roomId);
  const label = open ? t("button_tooltip_close") : mode === "moderator" ? t("button_tooltip_moderator") : t("button_tooltip");
  return (
    <button
      type="button"
      className="mcm-apps"
      data-testid="marcade-apps-button"
      aria-label={t("button_label")}
      aria-description={label}
      title={label}
      aria-disabled={mode === "moderator" ? true : undefined}
      aria-pressed={open}
      aria-busy={busy || undefined}
      onClick={() => {
        if (busy) return;
        setBusy(true);
        void onActivate(roomId).finally(() => {
          setBusy(false);
          setTick((n) => n + 1);
        });
      }}
    >
      <AppsIcon />
    </button>
  );
}
