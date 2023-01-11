import i18n from "i18n";
import MakeMDPlugin from "main";
import { Modal } from "obsidian";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { eventTypes, SectionTree } from "types/types";
import { getAllAbstractFilesInVault } from "utils/file";
import { uiIconSet } from "utils/icons";
import { fileNameToString } from "utils/tree";
import { showSelectMenu } from "../menus/menuItems";

export class HiddenItemsModal extends Modal {
  plugin: MakeMDPlugin;

  constructor(plugin: MakeMDPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onOpen() {
    let { contentEl } = this;
    let myModal = this;

    // Header
    let headerText: string;

    const headerEl = contentEl.createEl("div", { text: headerText });
    headerEl.addClass("modal-title");
    headerEl.innerHTML = i18n.labels.hiddenFiles;

    // Input El

    const listEl = contentEl.createEl("div");
    const root = createRoot(listEl);
    root.render(<HiddenFiles plugin={this.plugin}></HiddenFiles>);

    // Buttons
    const cancelButton = contentEl.createEl("button", {
      text: i18n.buttons.cancel,
    });
    cancelButton.style.cssText = "float: right;";
    cancelButton.addEventListener("click", () => {
      myModal.close();
    });

    const onClickAction = async () => {
      myModal.close();
    };

    // Event Listener
  }

  onClose() {
    let { contentEl } = this;
    let event = new CustomEvent(eventTypes.vaultChange);
    window.dispatchEvent(event);
    contentEl.empty();
  }
}

export const HiddenFiles = (props: { plugin: MakeMDPlugin }) => {
  const { plugin } = props;
  const ref = useRef(null);
  const [hiddenFiles, setHiddenFiles] = useState(plugin.settings.hiddenFiles);
  const [hiddenExtensions, setHiddenExtensions] = useState(
    plugin.settings.hiddenExtensions
  );

  const saveExtension = (value: string) => {
    plugin.settings.hiddenExtensions = [
      ...plugin.settings.hiddenExtensions,
      value,
    ];
    plugin.saveSettings();
  };

  const saveFile = (_: string[], value: string[]) => {
    plugin.settings.hiddenFiles = [...plugin.settings.hiddenFiles, ...value];
    plugin.saveSettings();
  };

  const removeExtension = (index: number) => {
    plugin.settings.hiddenExtensions = plugin.settings.hiddenExtensions.filter(
      (f, i) => i != index
    );
    plugin.saveSettings();
  };

  const removeItem = (index: number) => {
    plugin.settings.hiddenFiles = plugin.settings.hiddenFiles.filter(
      (f, i) => i != index
    );
    plugin.saveSettings();
  };

  const addExtension = () => {
    if (ref?.current.value.length > 0) {
      saveExtension(ref.current.value);
      ref.current.empty();
    }
  };

  const settingsChanged = () => {
    setHiddenFiles(plugin.settings.hiddenFiles);
    setHiddenExtensions(plugin.settings.hiddenExtensions);
  };

  useEffect(() => {
    window.addEventListener(eventTypes.settingsChanged, settingsChanged);
    return () => {
      window.removeEventListener(eventTypes.settingsChanged, settingsChanged);
    };
  }, []);

  const addMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    const options = getAllAbstractFilesInVault(props.plugin, app).map((f) => ({
      name: fileNameToString(f.name),
      value: f.path,
    }));
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        multi: false,
        editable: false,
        value: [],
        options,
        saveOptions: saveFile,
        placeholder: i18n.labels.linkItemSelectPlaceholder,
        detail: true,
        searchable: true,
      }
    );
  };
  return (
    <div className="modal-content">
      <div className="setting-item setting-item-heading">Extensions</div>
      <div>
        {hiddenExtensions.map((f, index) => (
          <div className="mobile-option-setting-item">
            <span className="mobile-option-setting-item-name">{f}</span>
            <div
              className="clickable-icon mobile-option-setting-item-option-icon"
              aria-label={i18n.buttons.delete}
              dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
              onClick={() => removeExtension(index)}
            ></div>
          </div>
        ))}
      </div>
      <div className="setting-item">
        <input placeholder={i18n.labels.addExtension} type="text" ref={ref}></input>
        <button onClick={(e) => addExtension()}>+ Add</button>
      </div>

      <div className="setting-item setting-item-heading">Files</div>
      <div>
        {hiddenFiles.map((f, index) => (
          <div className="mobile-option-setting-item">
            <span className="mobile-option-setting-item-name">{f}</span>
            <div
              className="clickable-icon mobile-option-setting-item-option-icon"
              aria-label={i18n.buttons.delete}
              dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
              onClick={() => removeItem(index)}
            ></div>
          </div>
        ))}
      </div>
      <div className="setting-item">
        <button onClick={(e) => addMenu(e)}>+ {i18n.buttons.addFile}</button>
      </div>
    </div>
  );
};
