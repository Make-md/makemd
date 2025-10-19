import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useState, useEffect } from "react";
import { useDebouncedSave } from "./hooks";
import { SettingsProps } from "./types";

export const GeneralSettings = ({ superstate }: SettingsProps) => {
  const { debouncedSave, immediateSave } = useDebouncedSave(superstate);
  const [systemName, setSystemName] = useState(superstate.settings.systemName || "");
  const [navigatorEnabled, setNavigatorEnabled] = useState(Boolean(superstate.settings.navigatorEnabled));
  const [spaceViewEnabled, setSpaceViewEnabled] = useState(Boolean(superstate.settings.spaceViewEnabled));
  const [blinkEnabled, setBlinkEnabled] = useState(Boolean(superstate.settings.blinkEnabled));
  const [spacesUseAlias, setSpacesUseAlias] = useState(Boolean(superstate.settings.spacesUseAlias));
  const [enableDefaultSpaces, setEnableDefaultSpaces] = useState(Boolean(superstate.settings.enableDefaultSpaces));
  const [autoAddContextsToSubtags, setAutoAddContextsToSubtags] = useState(Boolean(superstate.settings.autoAddContextsToSubtags));
  
  // Sync state with superstate.settings when component mounts or settings change
  useEffect(() => {
    setSystemName(superstate.settings.systemName || "");
    setNavigatorEnabled(Boolean(superstate.settings.navigatorEnabled));
    setSpaceViewEnabled(Boolean(superstate.settings.spaceViewEnabled));
    setBlinkEnabled(Boolean(superstate.settings.blinkEnabled));
    setSpacesUseAlias(Boolean(superstate.settings.spacesUseAlias));
    setEnableDefaultSpaces(Boolean(superstate.settings.enableDefaultSpaces));
    setAutoAddContextsToSubtags(Boolean(superstate.settings.autoAddContextsToSubtags));
  }, [superstate.settings]);
  
  return (
    <div className="mk-setting-section">
      <h2>{i18n.settings.sections.general}</h2>
      <div className="mk-setting-group">
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">System Name</div>
            <div className="mk-setting-item-description">
              {i18n.settings.nameOfYourSystem}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="text"
              value={systemName}
              onChange={(e) => {
                setSystemName(e.target.value);
                superstate.settings.systemName = e.target.value;
                debouncedSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.navigatorEnabled.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.navigatorEnabled.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={navigatorEnabled}
              onChange={(e) => {
                setNavigatorEnabled(e.target.checked);
                superstate.settings.navigatorEnabled = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.spaceViewEnabled.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.spaceViewEnabled.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={spaceViewEnabled}
              onChange={(e) => {
                setSpaceViewEnabled(e.target.checked);
                superstate.settings.spaceViewEnabled = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.blinkEnabled.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.blinkEnabled.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={blinkEnabled}
              onChange={(e) => {
                setBlinkEnabled(e.target.checked);
                superstate.settings.blinkEnabled = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <h3>{i18n.settings.sections.label}</h3>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.spacesUseAlias.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.spacesUseAlias.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={spacesUseAlias}
              onChange={(e) => {
                setSpacesUseAlias(e.target.checked);
                superstate.settings.spacesUseAlias = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <h3>{i18n.settings.sections.tags}</h3>
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.enableDefaultSpaces.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.enableDefaultSpaces.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={enableDefaultSpaces}
              onChange={(e) => {
                setEnableDefaultSpaces(e.target.checked);
                superstate.settings.enableDefaultSpaces = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.autoAddContextsToSubtags.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.autoAddContextsToSubtags.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={autoAddContextsToSubtags}
              onChange={(e) => {
                setAutoAddContextsToSubtags(e.target.checked);
                superstate.settings.autoAddContextsToSubtags = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};