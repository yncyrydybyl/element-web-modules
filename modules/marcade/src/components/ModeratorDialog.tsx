import React, { useState } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";
import { t } from "../i18n";

/** "Only moderators can add apps" + the `/addwidget …` line to hand to a moderator. */
export function ModeratorDialog({ command, onCancel }: { command: string } & DialogProps<void>) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mcm-dialog">
      <p>{t("moderator_body")}</p>
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
