import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useState, useEffect } from "react";
import { useDebouncedSave } from "./hooks";
import { SettingsProps } from "./types";

export const AdvancedSettings = ({ superstate }: SettingsProps) => {
  const { debouncedSave, immediateSave } = useDebouncedSave(superstate);
  const plugin = (superstate.ui as any)?.mainFrame?.plugin as any;
  
  const [defaultDateFormat, setDefaultDateFormat] = useState(superstate.settings.defaultDateFormat);
  const [defaultTimeFormat, setDefaultTimeFormat] = useState(superstate.settings.defaultTimeFormat);
  const [spaceSubFolder, setSpaceSubFolder] = useState(superstate.settings.spaceSubFolder);
  const [spacesFolder, setSpacesFolder] = useState(superstate.settings.spacesFolder);
  const [hideSpaceFolders, setHideSpaceFolders] = useState(false);
  const [hidingStatus, setHidingStatus] = useState<string>('');
  
  // Sync state with superstate.settings when component mounts or settings change
  useEffect(() => {
    setDefaultDateFormat(superstate.settings.defaultDateFormat);
    setDefaultTimeFormat(superstate.settings.defaultTimeFormat);
    setSpaceSubFolder(superstate.settings.spaceSubFolder);
    setSpacesFolder(superstate.settings.spacesFolder);
    
    // Update hiding status
    if (plugin?.hidingManager) {
      const isEnabled = plugin.hidingManager.isEnabled();
      const currentPattern = plugin.hidingManager.getCurrentPattern();
      setHideSpaceFolders(isEnabled);
      
      if (isEnabled && currentPattern) {
        setHidingStatus(`Active (hiding: ${currentPattern})`);
      } else {
        setHidingStatus('Disabled');
      }
    }
  }, [superstate.settings, plugin]);
  
  const toggleHiding = async () => {
    if (!plugin?.hidingManager) return;
    
    try {
      if (hideSpaceFolders) {
        await plugin.hidingManager.disable();
        setHideSpaceFolders(false);
        setHidingStatus('Disabled');
        superstate.ui.notify('Space folder hiding disabled');
      } else {
        await plugin.hidingManager.enable(superstate.settings.spaceSubFolder);
        setHideSpaceFolders(true);
        setHidingStatus(`Active (hiding: ${superstate.settings.spaceSubFolder})`);
        superstate.ui.notify('Space folder hiding enabled');
      }
    } catch (error) {
      console.error('Failed to toggle hiding:', error);
      superstate.ui.error(error);
    }
  };
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
              Hide space folders from UI
            </div>
            <div className="mk-setting-item-description">
              Hides space folders from File Explorer, Search, and Quick Switcher.
              Uses dynamic CSS (works only when plugin is enabled).
              <br />
              <strong>Status:</strong> {hidingStatus}
              <br />
              <em>Note: Graph View requires manual configuration. See documentation.</em>
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={hideSpaceFolders}
              onChange={toggleHiding}
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