import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React from "react";
import { useDebouncedSave } from "./hooks";
import { SettingsProps } from "./types";

export const NavigatorSettings = ({ superstate }: SettingsProps) => {
  const { debouncedSave, immediateSave } = useDebouncedSave(superstate);
  
  return (
    <div className="mk-setting-section">
      <h2>{i18n.settings.sections.navigator}</h2>
      <div className="mk-setting-group">
        <h3>{i18n.settings.sections.appearance}</h3>
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.sidebarTabs.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.sidebarTabs.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.sidebarTabs}
              onChange={(e) => {
                superstate.settings.sidebarTabs = e.target.checked;
                immediateSave();
                document.body.classList.toggle(
                  "mk-hide-tabs",
                  !e.target.checked
                );
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.vaultSelector.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.vaultSelector.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.vaultSelector}
              onChange={(e) => {
                superstate.settings.vaultSelector = e.target.checked;
                immediateSave();
                document.body.classList.toggle(
                  "mk-hide-vault-selector",
                  !e.target.checked
                );
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.showRibbon.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.showRibbon.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.showRibbon}
              onChange={(e) => {
                superstate.settings.showRibbon = e.target.checked;
                immediateSave();
                document.body.classList.toggle(
                  "mk-hide-ribbon",
                  !e.target.checked
                );
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.spacesRightSplit.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.spacesRightSplit.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.spacesRightSplit}
              onChange={(e) => {
                superstate.settings.spacesRightSplit = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.spaceRowHeight.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.spaceRowHeight.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="number"
              min="20"
              max="40"
              value={superstate.settings.spaceRowHeight}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 20 && value <= 40) {
                  superstate.settings.spaceRowHeight = value;
                  immediateSave();
                }
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.mobileSpaceRowHeight.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.mobileSpaceRowHeight.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="number"
              min="30"
              max="50"
              value={superstate.settings.mobileSpaceRowHeight}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 30 && value <= 50) {
                  superstate.settings.mobileSpaceRowHeight = value;
                  immediateSave();
                }
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.folderIndentationLines.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.folderIndentationLines.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.folderIndentationLines}
              onChange={(e) => {
                superstate.settings.folderIndentationLines = e.target.checked;
                immediateSave();
                document.body.classList.toggle(
                  "mk-folder-lines",
                  e.target.checked
                );
              }}
            />
          </div>
        </div>

        <h3>{i18n.settings.sections.interaction}</h3>
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.openSpacesOnLaunch.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.openSpacesOnLaunch.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.openSpacesOnLaunch}
              onChange={(e) => {
                superstate.settings.openSpacesOnLaunch = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.editStickerInSidebar.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.editStickerInSidebar.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.editStickerInSidebar}
              onChange={(e) => {
                superstate.settings.editStickerInSidebar = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.overrideNativeMenu.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.overrideNativeMenu.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.overrideNativeMenu}
              onChange={(e) => {
                superstate.settings.overrideNativeMenu = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.expandFolderOnClick.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.expandFolderOnClick.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.expandFolderOnClick}
              onChange={(e) => {
                superstate.settings.expandFolderOnClick = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.filePreviewOnHover.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.filePreviewOnHover.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.filePreviewOnHover}
              onChange={(e) => {
                superstate.settings.filePreviewOnHover = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.revealActiveFile.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.revealActiveFile.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.revealActiveFile}
              onChange={(e) => {
                superstate.settings.revealActiveFile = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.deleteFileOption.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.deleteFileOption.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <select
              value={superstate.settings.deleteFileOption}
              onChange={(e) => {
                superstate.settings.deleteFileOption = e.target.value as any;
                immediateSave();
              }}
            >
              <option value="permanent">
                {i18n.settings.spacesDeleteOptions.permanent}
              </option>
              <option value="trash">
                {i18n.settings.spacesDeleteOptions.trash}
              </option>
              <option value="system-trash">
                {i18n.settings.spacesDeleteOptions["system-trash"]}
              </option>
            </select>
          </div>
        </div>

        <h3>{i18n.settings.sections.advanced}</h3>
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.spacesDisablePatch.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.spacesDisablePatch.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.spacesDisablePatch}
              onChange={(e) => {
                superstate.settings.spacesDisablePatch = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};