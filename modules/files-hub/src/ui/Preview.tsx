import { useEffect, useState, type JSX } from "react";

import { formatSize, type FileItem } from "../files";
import { P, type ModuleTranslate } from "../i18n";
import { pdfBlob, previewKind, safeMimetype } from "../media";
import { FileTypeIcon } from "./icons";

export interface PreviewProps {
    t: ModuleTranslate;
    item: FileItem;
    maxMb: number;
    loadBytes(item: FileItem, signal: AbortSignal): Promise<ArrayBuffer>;
}

const OFFICE_APPS: Record<string, string> = { word: "Word", excel: "Excel", powerpoint: "PowerPoint" };

type State = { status: "idle" } | { status: "loading" } | { status: "ready"; url: string } | { status: "error"; message: string };

/**
 * Inline preview from the decrypted bytes. Images and videos use Element's Blob MIME allow-list; PDFs
 * go to the browser's PDF viewer in an iframe (see `pdfBlob`). Office files only get an icon: there's
 * no way to render them here without sending the plaintext to a server (see README).
 */
export function Preview({ t, item, maxMb, loadBytes }: PreviewProps): JSX.Element {
    // Without a built-in PDF viewer (some mobile browsers, headless Chromium) the iframe would stay blank.
    const noPdfViewer = typeof navigator !== "undefined" && (navigator as { pdfViewerEnabled?: boolean }).pdfViewerEnabled === false;
    const detected = previewKind(item);
    const kind = detected === "pdf" && noPdfViewer ? null : detected;
    const tooLarge = item.size !== undefined && item.size > maxMb * 1024 * 1024;
    const [forced, setForced] = useState(false);
    const [state, setState] = useState<State>({ status: "idle" });

    useEffect(() => {
        setForced(false);
    }, [item.eventId]);

    useEffect(() => {
        if (!kind || (tooLarge && !forced)) {
            setState({ status: "idle" });
            return;
        }
        const ctl = new AbortController();
        let url: string | undefined;
        setState({ status: "loading" });
        loadBytes(item, ctl.signal)
            .then((bytes) => {
                if (ctl.signal.aborted) return;
                const blob = kind === "pdf" ? pdfBlob(bytes) : new Blob([bytes], { type: safeMimetype(item.mimetype) });
                if (!blob) {
                    setState({ status: "error", message: t(`${P}not_pdf`) });
                    return;
                }
                url = URL.createObjectURL(blob);
                setState({ status: "ready", url });
            })
            .catch((e: unknown) => {
                if (!ctl.signal.aborted) setState({ status: "error", message: t(`${P}preview_failed`, { error: (e as Error)?.message ?? String(e) }) });
            });
        return () => {
            ctl.abort();
            if (url) URL.revokeObjectURL(url);
        };
    }, [item, kind, tooLarge, forced, loadBytes, t]);

    let body: JSX.Element;
    if (!kind) {
        const app = item.office ? OFFICE_APPS[item.office] : undefined;
        body = (
            <div className="fh-preview-placeholder">
                <FileTypeIcon office={item.office} category={item.category} size={72} />
                <p>{app ? t(`${P}office_hint`, { app }) : detected === "pdf" ? t(`${P}no_pdf_viewer`) : t(`${P}no_preview`)}</p>
            </div>
        );
    } else if (tooLarge && !forced) {
        body = (
            <div className="fh-preview-placeholder">
                <FileTypeIcon office={item.office} category={item.category} size={72} />
                <p>{t(`${P}too_large`, { max: maxMb })}</p>
                <button type="button" className="fh-button" onClick={() => setForced(true)}>
                    {t(`${P}load_anyway`)}
                </button>
            </div>
        );
    } else if (state.status === "ready") {
        body =
            kind === "image" ? (
                <img className="fh-preview-media" src={state.url} alt={item.name} data-testid="fileshub-preview-image" />
            ) : kind === "video" ? (
                <video className="fh-preview-media" src={state.url} controls data-testid="fileshub-preview-video" />
            ) : (
                <iframe className="fh-preview-pdf" src={state.url} title={item.name} data-testid="fileshub-preview-pdf" />
            );
    } else if (state.status === "error") {
        body = <p className="fh-preview-error">{state.message}</p>;
    } else {
        body = <p className="fh-hint">{t(`${P}loading_preview`)}</p>;
    }

    return (
        <div className="fh-preview-body" data-testid="fileshub-preview">
            {body}
            <div className="fh-preview-meta">
                <span className="fh-preview-name">{item.name}</span>
                <span className="fh-hint">{[item.mimetype, formatSize(item.size)].filter(Boolean).join(" · ")}</span>
            </div>
        </div>
    );
}
