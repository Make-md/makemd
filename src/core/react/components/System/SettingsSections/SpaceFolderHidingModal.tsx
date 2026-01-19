import React, { useEffect, useMemo, useState } from "react";
import { Superstate } from "makemd-core";
import i18n from "shared/i18n";

type DryRunPlan = any;

export const SpaceFolderHidingModal = (props: {
  superstate: Superstate;
  hide?: () => void;
}) => {
  const { superstate, hide } = props;
  const plugin = (superstate.ui as any)?.mainFrame?.plugin as any;
  const current = superstate.settings.spaceSubFolder;

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DryRunPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const snippetName = useMemo(
    () => (plugin?.getSpaceFolderHidingSnippetName ? plugin.getSpaceFolderHidingSnippetName() : "makemd-hide-space-folders"),
    [plugin]
  );
  const pattern = useMemo(
    () => (plugin?.getSpaceFolderHidingPattern ? plugin.getSpaceFolderHidingPattern(current) : `**/${current}/**`),
    [plugin, current]
  );

  const refreshDryRun = async () => {
    if (!plugin?.dryRunSpaceFolderHiding) {
      setError("Dry-run unavailable: plugin API not found.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nextPlan = await plugin.dryRunSpaceFolderHiding(null, current);
      setPlan(nextPlan);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!plugin?.applySpaceFolderHiding) {
      setError("Apply unavailable: plugin API not found.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await plugin.applySpaceFolderHiding(null, current);
      superstate.ui.notify(i18n.labels.saved ?? "Applied");
      await refreshDryRun();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const undo = async () => {
    if (!plugin?.undoSpaceFolderHiding) {
      setError("Undo unavailable: plugin API not found.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await plugin.undoSpaceFolderHiding(current);
      superstate.ui.notify(i18n.labels.saved ?? "Undo complete");
      await refreshDryRun();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDryRun();
  }, [current]);

  const applyLines = useMemo(() => {
    const lines: string[] = [];
    const willAdd = plan?.obsidian?.appJson?.userIgnoreFilters?.willAdd ?? [];
    const willRemove = plan?.obsidian?.appJson?.userIgnoreFilters?.willRemove ?? [];
    const willEnable = plan?.obsidian?.appearanceJson?.enabledCssSnippets?.willEnable ?? [];
    const snippetPath = plan?.obsidian?.snippet?.fileRelativePath ?? `.obsidian/snippets/${snippetName}.css`;

    if (willAdd.length > 0) lines.push(`Add ignore filter: ${willAdd.join(", ")}`);
    if (willRemove.length > 0) lines.push(`Remove ignore filter: ${willRemove.join(", ")}`);
    if (willEnable.length > 0) lines.push(`Enable CSS snippet: ${willEnable.join(", ")}`);
    if (plan?.obsidian?.snippet?.willWrite) lines.push(`Write CSS snippet file: ${snippetPath}`);
    if (plan?.makemd?.willReindex) lines.push("Reindex Make.md paths/spaces");
    return lines;
  }, [plan, snippetName]);

  const undoLines = useMemo(() => {
    return [
      `Remove ignore filter: ${pattern}`,
      `Disable CSS snippet: ${snippetName}`,
      `Delete CSS snippet file: .obsidian/snippets/${snippetName}.css`,
      "Reindex Make.md paths/spaces",
    ];
  }, [pattern, snippetName]);

  return (
    <div className="mk-modal-contents">
      <div className="mk-modal-heading">Space folder hiding</div>
      <div className="mk-modal-description" style={{ marginBottom: 12 }}>
        <div>
          <strong>Space Folder Name</strong>: <code>{current}</code>
        </div>
        <div>
          <strong>Obsidian ignore filter</strong>: <code>{pattern}</code>
        </div>
        <div>
          <strong>CSS snippet</strong>: <code>{snippetName}</code>
        </div>
      </div>

      {error && (
        <div className="mk-modal-message" style={{ color: "var(--text-error)", marginBottom: 10 }}>
          {error}
        </div>
      )}

      <div className="mk-modal-items" style={{ marginBottom: 12 }}>
        <div className="mk-modal-item">
          <div className="mk-modal-item-name">Dry-run (Apply)</div>
          <div className="mk-modal-item-description" style={{ opacity: 0.8 }}>
            Shows the changes that will be written to `.obsidian/app.json`, `.obsidian/appearance.json`, and the CSS snippet.
          </div>
        </div>
        <div className="mk-modal-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
          {loading ? (
            <div style={{ padding: 8, opacity: 0.7 }}>Loading...</div>
          ) : applyLines.length === 0 ? (
            <div style={{ padding: 8, opacity: 0.7 }}>No changes detected.</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {applyLines.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mk-modal-items" style={{ marginBottom: 12 }}>
        <div className="mk-modal-item">
          <div className="mk-modal-item-name">Dry-run (Undo)</div>
          <div className="mk-modal-item-description" style={{ opacity: 0.8 }}>
            Shows the changes Undo will attempt to revert.
          </div>
        </div>
        <div className="mk-modal-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {undoLines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mk-button-group">
        <button onClick={() => apply()} disabled={loading} className="mod-cta">
          Apply
        </button>
        <button onClick={() => undo()} disabled={loading} className="mod-warning">
          Undo
        </button>
        <button onClick={() => refreshDryRun()} disabled={loading}>
          Refresh
        </button>
        <button onClick={() => hide && hide()} disabled={loading}>
          {i18n.buttons.cancel}
        </button>
      </div>
    </div>
  );
};

