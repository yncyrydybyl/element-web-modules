/** The loader's own UI and runtime styles (scoped to tl- classes and attributes; inert without a theme). */
export const LOADER_CSS = `
#tl-overlay-root { position: fixed; inset: 0; pointer-events: none; z-index: var(--tl-overlay-z, 3000); }
@media (prefers-reduced-motion: no-preference) {
  html[data-tl-phase-fading] *, html[data-tl-phase-fading] *::before, html[data-tl-phase-fading] *::after {
    transition: background-color 2s, color 2s, border-color 2s, fill 2s !important;
  }
}

.mx_TabbedView[data-tl-themes-tab] > .mx_TabbedView_tabPanel:not(.tl-tab-panel),
.mx_TabbedView:not([data-tl-themes-tab]) > .tl-tab-panel { display: none; }
.mx_UserSettingsDialog_title[data-tl-tab] { font-size: 0 !important; }
.mx_UserSettingsDialog_title[data-tl-tab] > * { display: none; }
.mx_UserSettingsDialog_title[data-tl-tab]::before { content: attr(data-tl-prefix) " "; font: var(--cpd-font-heading-md-semibold); white-space: pre; }
.mx_UserSettingsDialog_title[data-tl-tab]::after { content: attr(data-tl-tab); font: var(--cpd-font-heading-md-regular); }

.tl-tab { display: block; color: var(--cpd-color-text-primary); }
.tl-tab .mx_SettingsSection_inner { display: flex; flex-direction: column; gap: 12px; }
.tl-heading { margin: 0; font: var(--cpd-font-heading-sm-semibold); }
.tl-muted { color: var(--cpd-color-text-secondary); font: var(--cpd-font-body-sm-regular); margin: 0; }
.tl-notice { padding: 8px 12px; border-radius: 8px; background: var(--cpd-color-bg-info-subtle, #e4f3ff); color: var(--cpd-color-text-info-primary, #0467dd); margin: 0; font: var(--cpd-font-body-sm-regular); }
.tl-problems { padding: 8px 12px; border-radius: 8px; background: var(--cpd-color-bg-critical-subtle, #fff0f1); color: var(--cpd-color-text-critical-primary, #d51928); font: var(--cpd-font-body-sm-regular); }
.tl-problems ul { margin: 4px 0 0; padding-left: 18px; max-height: 160px; overflow: auto; }
.tl-problem-warning { color: var(--cpd-color-text-secondary); }

.tl-filters { display: flex; flex-direction: column; gap: 8px; }
.tl-search { box-sizing: border-box; width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--cpd-color-border-interactive-secondary); background: var(--cpd-color-bg-canvas-default); color: var(--cpd-color-text-primary); font: var(--cpd-font-body-md-regular); }
.tl-search:focus-visible { outline: 2px solid var(--cpd-color-border-focused); outline-offset: 1px; }
.tl-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.tl-chips-label { font: var(--cpd-font-body-sm-semibold); color: var(--cpd-color-text-secondary); margin-right: 4px; min-width: 48px; }
.tl-chip { cursor: pointer; padding: 3px 10px; border-radius: 99px; border: 1px solid var(--cpd-color-border-interactive-secondary); background: transparent; color: var(--cpd-color-text-primary); font: var(--cpd-font-body-sm-regular); }
.tl-chip:hover { background: var(--cpd-color-bg-subtle-secondary); }
.tl-chip-on { background: var(--cpd-color-bg-action-primary-rest); border-color: var(--cpd-color-bg-action-primary-rest); color: var(--cpd-color-text-on-solid-primary); }
.tl-chip-on:hover { background: var(--cpd-color-bg-action-primary-hovered); }
.tl-chip:focus-visible, .tl-card:focus-visible { outline: 2px solid var(--cpd-color-border-focused); outline-offset: 2px; }

.tl-family { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.tl-family-name { margin: 0; font: var(--cpd-font-body-lg-semibold); display: flex; gap: 8px; align-items: center; }
.tl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
.tl-card { position: relative; cursor: pointer; display: flex; flex-direction: column; gap: 8px; text-align: left; padding: 8px; border-radius: 12px; border: 1px solid var(--cpd-color-border-interactive-secondary); background: var(--cpd-color-bg-canvas-default); color: var(--cpd-color-text-primary); font: var(--cpd-font-body-sm-regular); }
.tl-card:hover { border-color: var(--cpd-color-border-interactive-hovered); background: var(--cpd-color-bg-subtle-secondary); }
.tl-card-active { border: 2px solid var(--cpd-color-border-accent, var(--cpd-color-text-action-accent)); padding: 7px; }
.tl-card-default { flex-direction: row; align-items: center; }
.tl-card-default .tl-swatch { width: 96px; flex: none; }
.tl-card-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.tl-card-name { font: var(--cpd-font-body-md-semibold); }
.tl-card-desc { color: var(--cpd-color-text-secondary); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.tl-card-meta { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.tl-badge { display: inline-block; padding: 0 6px; border-radius: 6px; background: var(--cpd-color-bg-subtle-primary); color: var(--cpd-color-text-secondary); font: var(--cpd-font-body-xs-medium, var(--cpd-font-body-sm-regular)); }
.tl-badge-active { position: absolute; top: 12px; right: 12px; background: var(--cpd-color-bg-accent-rest, #0dbd8b); color: var(--cpd-color-text-on-solid-primary, #fff); }
.tl-axis { color: var(--cpd-color-text-secondary); font: var(--cpd-font-body-xs-regular, var(--cpd-font-body-sm-regular)); }

.tl-swatch { position: relative; display: flex; height: 64px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(127,127,127,.35); }
.tl-swatch-side { width: 28%; display: flex; flex-direction: column; gap: 5px; padding: 7px 5px; box-sizing: border-box; }
.tl-swatch-side i { display: block; height: 6px; border-radius: 3px; opacity: .85; }
.tl-swatch-main { flex: 1; display: flex; flex-direction: column; gap: 6px; padding: 8px; position: relative; }
.tl-swatch-main b { display: block; height: 5px; border-radius: 3px; width: 85%; opacity: .8; }
.tl-swatch-main span { position: absolute; right: 8px; bottom: 7px; width: 22px; height: 10px; border-radius: 5px; }
.tl-swatch-sun { position: absolute; left: 4px; bottom: 2px; font-style: normal; font-size: 10px; color: #888; }
.tl-swatch-half { flex: 1; }
.tl-swatch-light { background: linear-gradient(#fff 0 30%, #f0f2f5 30%); }
.tl-swatch-dark { background: linear-gradient(#101317 0 30%, #1d1f24 30%); }

.tl-phase { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font: var(--cpd-font-body-sm-regular); }
.tl-phase select { font: inherit; padding: 2px 6px; border-radius: 6px; background: var(--cpd-color-bg-canvas-default); color: var(--cpd-color-text-primary); border: 1px solid var(--cpd-color-border-interactive-secondary); }


.tl-quick { display: flex; flex-direction: column; gap: 8px; width: min(560px, 80vw); }
.tl-quick-list { list-style: none; margin: 0; padding: 0; max-height: 55vh; overflow: auto; }
.tl-quick-item { display: grid; grid-template-columns: 64px 1fr; grid-template-rows: auto auto; column-gap: 10px; align-items: center; padding: 6px 8px; border-radius: 8px; cursor: pointer; }
.tl-quick-item .tl-swatch { grid-row: 1 / span 2; height: 36px; }
.tl-quick-item-sel { background: var(--cpd-color-bg-action-tertiary-hovered, var(--cpd-color-bg-subtle-secondary)); }
.tl-quick-item-chosen .tl-quick-name::after { content: " ✓"; color: var(--cpd-color-text-action-accent); }
.tl-quick-name { font: var(--cpd-font-body-md-semibold); color: var(--cpd-color-text-primary); }
.tl-quick-fam { font: var(--cpd-font-body-sm-regular); color: var(--cpd-color-text-secondary); }
.tl-quick-hint { text-align: center; }
`;
