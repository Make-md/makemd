import { Superstate, i18n } from "makemd-core";
import React, { useState, useEffect } from "react";
import { useDebouncedSave } from "./hooks";
import { SettingsProps } from "./types";

export const AdvancedSettings = ({ superstate }: SettingsProps) => {
  const { debouncedSave, immediateSave } = useDebouncedSave(superstate);
  const [defaultDateFormat, setDefaultDateFormat] = useState(superstate.settings.defaultDateFormat);
  const [defaultTimeFormat, setDefaultTimeFormat] = useState(superstate.settings.defaultTimeFormat);
  const [spaceSubFolder, setSpaceSubFolder] = useState(superstate.settings.spaceSubFolder);
  const [spacesFolder, setSpacesFolder] = useState(superstate.settings.spacesFolder);
  
  // Sync state with superstate.settings when component mounts or settings change
  useEffect(() => {
    setDefaultDateFormat(superstate.settings.defaultDateFormat);
    setDefaultTimeFormat(superstate.settings.defaultTimeFormat);
    setSpaceSubFolder(superstate.settings.spaceSubFolder);
    setSpacesFolder(superstate.settings.spacesFolder);
  }, [superstate.settings]);
  return (
    <div className="mk-setting-section">
      <h2>{i18n.settings.sections.advanced}</h2>
      <div className="mk-setting-group">
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.experimental.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.experimental.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.experimental}
              onChange={(e) => {
                superstate.settings.experimental = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.defaultDateFormat.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.defaultDateFormat.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="text"
              value={defaultDateFormat}
              onChange={(e) => {
                setDefaultDateFormat(e.target.value);
                superstate.settings.defaultDateFormat = e.target.value;
                debouncedSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.datePickerTime.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.datePickerTime.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.datePickerTime}
              onChange={(e) => {
                superstate.settings.datePickerTime = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.defaultTimeFormat.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.defaultTimeFormat.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="text"
              value={defaultTimeFormat}
              onChange={(e) => {
                setDefaultTimeFormat(e.target.value);
                superstate.settings.defaultTimeFormat = e.target.value;
                debouncedSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.spaceSubFolder.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.spaceSubFolder.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="text"
              value={spaceSubFolder}
              onChange={(e) => {
                setSpaceSubFolder(e.target.value);
                superstate.settings.spaceSubFolder = e.target.value;
                debouncedSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.spacesFolder.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.spacesFolder.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="text"
              value={spacesFolder}
              onChange={(e) => {
                setSpacesFolder(e.target.value);
                superstate.settings.spacesFolder = e.target.value;
                debouncedSave();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};