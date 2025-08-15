import { Superstate } from "makemd-core";
import React from "react";
import { HiddenPaths } from "core/react/components/UI/Modals/HiddenFiles";
import { SettingsProps } from "./types";

export const HiddenFilesSettings = ({ superstate }: SettingsProps) => {
  return (
    <div className="mk-setting-section">
      <h2>Hidden Files</h2>
      <div className="mk-setting-group">
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">Manage Hidden Files</div>
            <div className="mk-setting-item-description">
              Configure which files and folders should be hidden from the
              navigator
            </div>
          </div>
        </div>
        <div className="mk-setting-content-full">
          <HiddenPaths superstate={superstate} />
        </div>
      </div>
    </div>
  );
};