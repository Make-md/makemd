import i18n from "core/i18n";
import { Superstate } from "core/superstate/superstate";
import React, { useEffect, useRef, useState } from "react";
import { windowFromDocument } from "utils/dom";
import { pathNameToString } from "utils/path";

export const HiddenPaths = (props: {
  superstate: Superstate;
  hide?: () => void;
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
      ref.current.innerHTML = "";
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
    e.stopPropagation();
    props.superstate.ui.openMenu(
      offset,
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
      },
      windowFromDocument(e.view.document)
    );
  };
  return (
    <div className="mk-modal-contents">
      <div className="mk-modal-heading">{i18n.labels.hiddenFilePattern}</div>
      <div className="mk-modal-description">
        {i18n.descriptions.hiddenFileOptions}
      </div>
      <div className="mk-modal-items">
        {hiddenExtensions.map((f, index) => (
          <div key={index} className="mk-modal-item">
            <span>{f}</span>
            <div
              className="mk-modal-item-button"
              aria-label={i18n.buttons.delete}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//close"),
              }}
              onClick={() => removeExtension(index)}
            ></div>
          </div>
        ))}
      </div>
      <div className="mk-modal-item">
        <input
          placeholder={i18n.labels.addExtension}
          type="text"
          ref={ref}
        ></input>
        <button onClick={(e) => addExtension()}>{i18n.buttons.add}</button>
      </div>

      <div className="mk-modal-heading">{i18n.subViews.filesAndFolders}</div>
      <div className="mk-modal-description">
        {i18n.labels.hiddenFileSpecific}
      </div>
      <div className="mk-modal-items">
        {hiddenPaths.map((f, index) => (
          <div key={index} className="mk-modal-item">
            <span className="mk-modal-item-name">{f}</span>
            <div
              className="mk-modal-item-button"
              aria-label={i18n.buttons.delete}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//close"),
              }}
              onClick={() => removeItem(index)}
            ></div>
          </div>
        ))}
      </div>
      <div className="mk-modal-item">
        <button onClick={(e) => addMenu(e)}>+ {i18n.buttons.addFile}</button>
      </div>
    </div>
  );
};
