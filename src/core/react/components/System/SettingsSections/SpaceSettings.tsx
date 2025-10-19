import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useState, useEffect } from "react";
import { useDebouncedSave } from "./hooks";
import { SettingsProps } from "./types";

export const SpaceSettings = ({ superstate }: SettingsProps) => {
  const { debouncedSave, immediateSave } = useDebouncedSave(superstate);
  const [defaultSpaceTemplate, setDefaultSpaceTemplate] = useState(superstate.settings.defaultSpaceTemplate);
  
  // Sync state with superstate.settings when component mounts or settings change
  useEffect(() => {
    setDefaultSpaceTemplate(superstate.settings.defaultSpaceTemplate);
  }, [superstate.settings]);
  return (
    <div className="mk-setting-section">
      <h2>{i18n.settings.sections.space}</h2>
      <div className="mk-setting-group">
        <h3>{i18n.settings.sections.appearance}</h3>
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.defaultSpaceTemplate.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.defaultSpaceTemplate.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="text"
              value={defaultSpaceTemplate}
              onChange={(e) => {
                setDefaultSpaceTemplate(e.target.value);
                superstate.settings.defaultSpaceTemplate = e.target.value;
                debouncedSave();
              }}
            />
          </div>
        </div>

        <h3>{i18n.settings.sections.context}</h3>
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.contextEnabled.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.contextEnabled.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.contextEnabled}
              onChange={(e) => {
                superstate.settings.contextEnabled = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.contextPagination.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.contextPagination.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="number"
              value={superstate.settings.contextPagination}
              onChange={(e) => {
                superstate.settings.contextPagination =
                  parseInt(e.target.value) || 10;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.autoOpenFileContext.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.autoOpenFileContext.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.autoOpenFileContext}
              onChange={(e) => {
                superstate.settings.autoOpenFileContext = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.saveAllContextToFrontmatter.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.saveAllContextToFrontmatter.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.saveAllContextToFrontmatter}
              onChange={(e) => {
                superstate.settings.saveAllContextToFrontmatter =
                  e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.syncFormulaToFrontmatter.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.syncFormulaToFrontmatter.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.syncFormulaToFrontmatter}
              onChange={(e) => {
                superstate.settings.syncFormulaToFrontmatter = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.hideFrontmatter.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.hideFrontmatter.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.hideFrontmatter}
              onChange={(e) => {
                superstate.settings.hideFrontmatter = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};