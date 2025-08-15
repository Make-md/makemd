import { Superstate } from "makemd-core";
import React from "react";
import { GlobalTemplateEditor } from "../GlobalTemplateEditor";
import { SettingsProps } from "./types";

export const GlobalTemplatesSettings = ({ superstate }: SettingsProps) => {
  return (
    <div className="mk-setting-section">
      <h2>Global Templates</h2>
      <div className="mk-setting-group">
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">Manage Global Templates</div>
            <div className="mk-setting-item-description">
              Create and edit global templates stored in .space/templates folder
            </div>
          </div>
        </div>
        <div className="mk-setting-content-full">
          <GlobalTemplateEditor superstate={superstate} />
        </div>
      </div>
    </div>
  );
};