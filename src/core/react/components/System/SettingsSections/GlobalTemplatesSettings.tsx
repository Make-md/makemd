import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
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
            <div className="mk-setting-item-name">{i18n.settings.manageGlobalTemplates}</div>
            <div className="mk-setting-item-description">
              {i18n.descriptions.createAndEditGlobalTemplatesStoredInSpacetemplatesFolder}
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