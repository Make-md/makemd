import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React from "react";
import { useDebouncedSave } from "./hooks";
import { SettingsProps } from "./types";

export const PerformanceSettings = ({ superstate }: SettingsProps) => {
  const { debouncedSave, immediateSave } = useDebouncedSave(superstate);
  
  return (
    <div className="mk-setting-section">
      <h2>{i18n.settings.sections.performance}</h2>
      <div className="mk-setting-group">
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.spacesPerformance.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.spacesPerformance.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.spacesPerformance}
              onChange={(e) => {
                superstate.settings.spacesPerformance = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.imageThumbnails.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.imageThumbnails.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.imageThumbnails}
              onChange={(e) => {
                superstate.settings.imageThumbnails = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>


        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.hiddenExtensions.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.hiddenExtensions.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="text"
              value={superstate.settings.hiddenExtensions.join(", ")}
              onChange={(e) => {
                superstate.settings.hiddenExtensions = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s);
                immediateSave();
              }}
              placeholder={i18n.hintText.hiddenExtensionsPlaceholder}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.cacheIndex.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.cacheIndex.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.cacheIndex}
              onChange={(e) => {
                superstate.settings.cacheIndex = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};