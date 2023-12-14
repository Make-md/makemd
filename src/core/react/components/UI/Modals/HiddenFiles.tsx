import i18n from "core/i18n";
import { Superstate } from "core/superstate/superstate";
import React, { useEffect, useRef, useState } from "react";
import { pathNameToString } from "utils/path";

export const HiddenPaths = (props: {
  superstate: Superstate;
  close: () => void;
}) => {
  const { superstate } = props;
  const ref = useRef(null);
  const [hiddenPaths, setHiddenPaths] = useState(
    superstate.settings.hiddenFiles
  );
  const [hiddenExtensions, setHiddenExtensions] = useState(
    superstate.settings.hiddenExtensions
  );

  const saveExtension = (value: string) => {
    superstate.settings.hiddenExtensions = [
      ...superstate.settings.hiddenExtensions,
      value,
    ];
    superstate.saveSettings();
    superstate.initializePaths();
  };

  const saveFile = (_: string[], value: string[]) => {
    superstate.settings.hiddenFiles = [
      ...superstate.settings.hiddenFiles,
      ...value,
    ];
    superstate.saveSettings();
    superstate.initializePaths();
  };

  const removeExtension = (index: number) => {
    superstate.settings.hiddenExtensions =
      superstate.settings.hiddenExtensions.filter((f, i) => i != index);
    superstate.saveSettings();
    superstate.initializePaths();
  };

  const removeItem = (index: number) => {
    superstate.settings.hiddenFiles = superstate.settings.hiddenFiles.filter(
      (f, i) => i != index
    );
    superstate.saveSettings();
    superstate.initializePaths();
  };

  const addExtension = () => {
    if (ref?.current.value.length > 0) {
      saveExtension(ref.current.value);
      ref.current.empty();
    }
  };

  const settingsChanged = () => {
    setHiddenPaths(superstate.settings.hiddenFiles);
    setHiddenExtensions(superstate.settings.hiddenExtensions);
  };

  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "settingsChanged",
      settingsChanged
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "settingsChanged",
        settingsChanged
      );
    };
  }, []);

  const addMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    const options = props.superstate.spaceManager.allPaths().map((f) => ({
      name: pathNameToString(f),
      value: f,
    }));
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
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
      <div className="setting-item setting-item-heading">
        {i18n.labels.hiddenFilePattern}
      </div>
      <div className="setting-item-description">
        {i18n.descriptions.hiddenFileOptions}
      </div>
      <div>
        {hiddenExtensions.map((f, index) => (
          <div key={index} className="mobile-option-setting-item">
            <span className="mobile-option-setting-item-name">{f}</span>
            <div
              className="clickable-icon mobile-option-setting-item-option-icon"
              aria-label={i18n.buttons.delete}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
              }}
              onClick={() => removeExtension(index)}
            ></div>
          </div>
        ))}
      </div>
      <div className="setting-item">
        <input
          placeholder={i18n.labels.addExtension}
          type="text"
          ref={ref}
        ></input>
        <button onClick={(e) => addExtension()}>+ Add</button>
      </div>

      <div className="setting-item setting-item-heading">Files and Folders</div>
      <div className="setting-item-description">
        {i18n.labels.hiddenFileSpecific}
      </div>
      <div>
        {hiddenPaths.map((f, index) => (
          <div key={index} className="mobile-option-setting-item">
            <span className="mobile-option-setting-item-name">{f}</span>
            <div
              className="clickable-icon mobile-option-setting-item-option-icon"
              aria-label={i18n.buttons.delete}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
              }}
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
