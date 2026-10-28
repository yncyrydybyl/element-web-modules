import React, { useState } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";
import { t } from "../i18n";

/**
 * "Only moderators can add apps" + the `/addwidget …` line to hand to a moderator, or ("manual") the line for a
 * client that can send it when this Element cannot add the store itself.
 */
export function ModeratorDialog({ command, reason, onCancel }: { command: string; reason: "moderator" | "manual" } & DialogProps<void>) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mcm-dialog">
      <p>{t(reason === "manual" ? "manual_body" : "moderator_body")}</p>
      <code className="mcm-dialog__cmd" data-testid="marcade-addwidget-line">
        {command}
      </code>
      <div className="mcm-dialog__buttons">
        <button
          type="button"
          className="mcm-button"
          onClick={() => navigator.clipboard?.writeText(command).then(() => setCopied(true), () => setCopied(false))}
        >
          {copied ? t("copied") : t("copy")}
        </button>
        <button type="button" className="mcm-button mcm-button--primary" onClick={() => onCancel()}>
          {t("close")}
        </button>
      </div>
    </div>
  );
}
