import i18n from "i18n";
import MakeMDPlugin from "main";
import { Modal, TAbstractFile } from "obsidian";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { loadTags, tagFromString } from "utils/contexts/contexts";
import {
  frontMatterForFile,
  frontMatterKeys
} from "utils/contexts/fm";
import { uniq, uniqCaseInsensitive } from "utils/tree";
import { showSelectMenu } from "../menus/menuItems";

export class SyncMetadataModal extends Modal {
  plugin: MakeMDPlugin;
  files: TAbstractFile[];
  syncColumns: (columns: string[], table: string) => void;

  constructor(
    plugin: MakeMDPlugin,
    files: TAbstractFile[],
    syncColumns: (columns: string[], table: string) => void
  ) {
    super(plugin.app);
    this.plugin = plugin;
    this.files = files;
    let closeButton = this.modalEl.querySelector(
      ".modal-close-button"
    ) as HTMLElement;
    closeButton.style.display = "none";
    this.syncColumns = syncColumns;
  }

  onOpen() {
    let { contentEl } = this;
    let myModal = this;

    // Header
    let headerText: string;

    const headerEl = contentEl.createEl("div", { text: headerText });
    headerEl.addClass("modal-title");
    headerEl.innerHTML = i18n.labels.syncMetadata;

    // Input El

    const root = createRoot(contentEl);
    root.render(
      <SyncMetadataComponent
        plugin={this.plugin}
        files={this.files}
        syncColumns={this.syncColumns}
        close={() => this.close()}
      ></SyncMetadataComponent>
    );
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}

export const SyncMetadataComponent = (props: {
  plugin: MakeMDPlugin;
  files: TAbstractFile[];
  syncColumns: (columns: string[], table: string) => void;
  close: () => void;
}) => {
  const { plugin } = props;
  const cols: string[] = props.files.reduce((p, c) => {
    const fm = frontMatterForFile(c);
    const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm));
    return uniq([...p, ...fmKeys]);
  }, [] as string[]);
  const [syncColumns, setSyncColumns] = useState(cols);
  const [table, setTable] = useState("");
  const toggleColumn = (column: string) => {
    if (syncColumns.find((f) => f == column)) {
      setSyncColumns((s) => s.filter((f) => f != column));
    } else {
      setSyncColumns((s) => [...s, column]);
    }
  };
  const saveContexts = (_: string[], value: string[]) => {
    setTable(tagFromString(value[0]));
  };
  const showContextMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const f = loadTags(props.plugin);
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        multi: false,
        editable: true,
        value: [],
        options: [
          { name: "Folder", value: "" },
          ...f.map((m) => ({ name: m, value: m })),
        ],
        saveOptions: saveContexts,
        placeholder: i18n.labels.tagItemSelectPlaceholder,
        searchable: true,
        showAll: true,
      }
    );
  };
  const sync = () => {
    props.syncColumns(syncColumns, table);
    props.close();
  };
  return (
    <div className="modal-content">
      <div className="setting-item setting-item-heading">{i18n.labels.syncProperties}</div>
      <div className="setting-item">
        {i18n.descriptions.syncProperties}
      </div>
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">{i18n.labels.selectContext}</div>
          <div className="setting-item-description">
            {i18n.descriptions.selectContext}
          </div>
        </div>
        <div className="setting-item-control">
          <button onClick={(e) => showContextMenu(e)}>
            {table == "" ? i18n.buttons.currentFolder : table}
          </button>
        </div>
      </div>
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">{i18n.labels.syncProperties}</div>
          <div className="setting-item-description">
            {i18n.descriptions.syncMetadata}
          </div>

          {cols.map((f, index) => (
            <div className="mobile-option-setting-item">
              <input
                type="checkbox"
                checked={syncColumns.some((g) => g == f)}
                onChange={() => toggleColumn(f)}
              />
              <span className="mobile-option-setting-item-name">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <button style={{ marginRight: 8 }} onClick={() => sync()}>
      {i18n.buttons.sync}
      </button>
      <button onClick={() => props.close()}>{i18n.buttons.cancel}</button>
    </div>
  );
};
