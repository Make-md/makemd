import { MakeBasicsSettings } from "basics/types/settings";
import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useState, useEffect } from "react";
import { useDebouncedSave } from "./hooks";
import { SettingsProps } from "./types";

export const NotesSettings = ({ superstate }: SettingsProps) => {
  const { debouncedSave, immediateSave } = useDebouncedSave(superstate);
  const [newNotePlaceholder, setNewNotePlaceholder] = useState(superstate.settings.newNotePlaceholder);
  const [folderNoteName, setFolderNoteName] = useState(superstate.settings.folderNoteName);
  
  // Basics settings state
  const basicsSettings = superstate.settings.basicsSettings || ({} as MakeBasicsSettings);
  const [menuTriggerChar, setMenuTriggerChar] = useState(basicsSettings.menuTriggerChar || "/");
  const [editorFlow, setEditorFlow] = useState(Boolean(basicsSettings.editorFlow));
  const [internalLinkClickFlow, setInternalLinkClickFlow] = useState(Boolean(basicsSettings.internalLinkClickFlow));
  const [internalLinkSticker, setInternalLinkSticker] = useState(Boolean(basicsSettings.internalLinkSticker));
  const [flowMenuEnabled, setFlowMenuEnabled] = useState(Boolean(basicsSettings.flowMenuEnabled));
  const [makeMenuPlaceholder, setMakeMenuPlaceholder] = useState(Boolean(basicsSettings.makeMenuPlaceholder));
  const [inlineStyler, setInlineStyler] = useState(Boolean(basicsSettings.inlineStyler));
  const [inlineStickerMenu, setInlineStickerMenu] = useState(Boolean(basicsSettings.inlineStickerMenu));
  const [inlineStylerColors, setInlineStylerColors] = useState(Boolean(basicsSettings.inlineStylerColors));
  const [mobileMakeBar, setMobileMakeBar] = useState(Boolean(basicsSettings.mobileMakeBar));
  
  // Sync state with superstate.settings when component mounts or settings change
  useEffect(() => {
    setNewNotePlaceholder(superstate.settings.newNotePlaceholder);
    setFolderNoteName(superstate.settings.folderNoteName);
    
    const updatedBasicsSettings = superstate.settings.basicsSettings || ({} as MakeBasicsSettings);
    setMenuTriggerChar(updatedBasicsSettings.menuTriggerChar || "/");
    setEditorFlow(Boolean(updatedBasicsSettings.editorFlow));
    setInternalLinkClickFlow(Boolean(updatedBasicsSettings.internalLinkClickFlow));
    setInternalLinkSticker(Boolean(updatedBasicsSettings.internalLinkSticker));
    setFlowMenuEnabled(Boolean(updatedBasicsSettings.flowMenuEnabled));
    setMakeMenuPlaceholder(Boolean(updatedBasicsSettings.makeMenuPlaceholder));
    setInlineStyler(Boolean(updatedBasicsSettings.inlineStyler));
    setInlineStickerMenu(Boolean(updatedBasicsSettings.inlineStickerMenu));
    setInlineStylerColors(Boolean(updatedBasicsSettings.inlineStylerColors));
    setMobileMakeBar(Boolean(updatedBasicsSettings.mobileMakeBar));
  }, [superstate.settings]);
  return (
    <div className="mk-setting-section">
      <h2>{i18n.settings.sections.notes}</h2>
      <div className="mk-setting-group">
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.basics.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.basics.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.basics}
              onChange={(e) => {
                superstate.settings.basics = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.newNotePlaceholder.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.newNotePlaceholder.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="text"
              value={newNotePlaceholder}
              onChange={(e) => {
                setNewNotePlaceholder(e.target.value);
                superstate.settings.newNotePlaceholder = e.target.value;
                debouncedSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.notesPreview.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.notesPreview.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.notesPreview}
              onChange={(e) => {
                superstate.settings.notesPreview = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.inlineContext.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.inlineContext.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.inlineContext}
              onChange={(e) => {
                superstate.settings.inlineContext = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.contextCreateUseModal?.name || "Use Modal for Context Item Creation"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.contextCreateUseModal?.desc || "Open a modal form when creating new context items instead of using the dropdown menu"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.contextCreateUseModal}
              onChange={(e) => {
                superstate.settings.contextCreateUseModal = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <h3>{i18n.settings.sections.appearance}</h3>
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.inlineContextProperties.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.inlineContextProperties.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.inlineContextProperties}
              onChange={(e) => {
                superstate.settings.inlineContextProperties = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.inlineContextExpanded.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.inlineContextExpanded.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.inlineContextExpanded}
              onChange={(e) => {
                superstate.settings.inlineContextExpanded = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.inlineContextNameLayout.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.inlineContextNameLayout.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <select
              value={superstate.settings.inlineContextNameLayout}
              onChange={(e) => {
                superstate.settings.inlineContextNameLayout = e.target
                  .value as any;
                immediateSave();
              }}
            >
              <option value="vertical">{i18n.settings.layoutVertical}</option>
              <option value="horizontal">
                {i18n.settings.layoutHorizontal}
              </option>
            </select>
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.noteThumbnails.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.noteThumbnails.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.noteThumbnails}
              onChange={(e) => {
                superstate.settings.noteThumbnails = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <h3>{i18n.settings.sections.folderNote}</h3>
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.enableFolderNote.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.enableFolderNote.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={superstate.settings.enableFolderNote}
              onChange={(e) => {
                superstate.settings.enableFolderNote = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.folderNoteName.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.folderNoteName.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="text"
              value={folderNoteName}
              onChange={(e) => {
                setFolderNoteName(e.target.value);
                superstate.settings.folderNoteName = e.target.value;
                debouncedSave();
              }}
            />
          </div>
        </div>

        <h3>{i18n.settings.sectionFlow || i18n.settings.flow}</h3>
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.editorFlowReplace?.name || "Replace Selection in Flow"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.editorFlowReplace?.desc || "Replace selection with flow block"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={editorFlow}
              onChange={(e) => {
                setEditorFlow(e.target.checked);
                superstate.settings.basicsSettings = {
                  ...basicsSettings,
                  editorFlow: e.target.checked,
                };
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.internalLinkFlowEditor?.name || "Open Links in Flow"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.internalLinkFlowEditor?.desc || "Open internal links with Flow Editor"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={internalLinkClickFlow}
              onChange={(e) => {
                setInternalLinkClickFlow(e.target.checked);
                superstate.settings.basicsSettings = {
                  ...basicsSettings,
                  internalLinkClickFlow: e.target.checked,
                };
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.internalLinkSticker?.name || "Show Link Stickers"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.internalLinkSticker?.desc || "Show stickers for internal links"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={internalLinkSticker}
              onChange={(e) => {
                setInternalLinkSticker(e.target.checked);
                superstate.settings.basicsSettings = {
                  ...basicsSettings,
                  internalLinkSticker: e.target.checked,
                };
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.editorFlowStyle?.name || "Flow Style"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.editorFlowStyle?.desc || "Choose the default style for flow blocks"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <select
              value={basicsSettings.editorFlowStyle || "seamless"}
              onChange={(e) => {
                superstate.settings.basicsSettings = {
                  ...basicsSettings,
                  editorFlowStyle: e.target.value,
                };
                immediateSave();
                document.body.classList.toggle("mk-flow-minimal", false);
                document.body.classList.toggle("mk-flow-seamless", false);
                if (e.target.value === "seamless")
                  document.body.classList.toggle("mk-flow-seamless", true);
                if (
                  e.target.value === "classic" ||
                  e.target.value === "minimal"
                )
                  document.body.classList.toggle("mk-flow-minimal", true);
              }}
            >
              <option value="seamless">
                {i18n.settings.editorFlowStyle?.seamless || "Seamless"}
              </option>
              <option value="minimal">
                {i18n.settings.editorFlowStyle?.minimal || "Minimal"}
              </option>
            </select>
          </div>
        </div>

        <h3>{i18n.settings.sectionFlowMenu || "Flow Menu"}</h3>
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.editorMakeMenu?.name || "Show Make Menu"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.editorMakeMenu?.desc || "Show the Make menu in the editor"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={flowMenuEnabled}
              onChange={(e) => {
                setFlowMenuEnabled(e.target.checked);
                superstate.settings.basicsSettings = {
                  ...basicsSettings,
                  flowMenuEnabled: e.target.checked,
                };
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.makeChar?.name || "Make Character"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.makeChar?.desc || "Character to trigger the Make menu"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="text"
              value={menuTriggerChar}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length >= 1) {
                  setMenuTriggerChar(value[0]);
                  superstate.settings.basicsSettings = {
                    ...basicsSettings,
                    menuTriggerChar: value[0],
                  };
                  debouncedSave();
                }
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.editorMakePlaceholder?.name || "Make Menu Placeholder"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.editorMakePlaceholder?.desc || "Show placeholder when Make menu appears"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={makeMenuPlaceholder}
              onChange={(e) => {
                setMakeMenuPlaceholder(e.target.checked);
                superstate.settings.basicsSettings = {
                  ...basicsSettings,
                  makeMenuPlaceholder: e.target.checked,
                };
                immediateSave();
              }}
            />
          </div>
        </div>

        <h3>{i18n.settings.sectionFlowStyler || "Flow Styler"}</h3>
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.inlineStyler?.name || "Inline Styler"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.inlineStyler?.desc || "Enable inline text styling options"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={inlineStyler}
              onChange={(e) => {
                setInlineStyler(e.target.checked);
                superstate.settings.basicsSettings = {
                  ...basicsSettings,
                  inlineStyler: e.target.checked,
                };
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.inlineStickerMenu?.name || "Inline Sticker Menu"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.inlineStickerMenu?.desc || "Show sticker menu for inline elements"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={inlineStickerMenu}
              onChange={(e) => {
                setInlineStickerMenu(e.target.checked);
                superstate.settings.basicsSettings = {
                  ...basicsSettings,
                  inlineStickerMenu: e.target.checked,
                };
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.inlineStylerColor?.name || "Inline Color Styling"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.inlineStylerColor?.desc || "Enable color options in inline styler"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={inlineStylerColors}
              onChange={(e) => {
                setInlineStylerColors(e.target.checked);
                superstate.settings.basicsSettings = {
                  ...basicsSettings,
                  inlineStylerColors: e.target.checked,
                };
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.mobileMakeBar?.name || "Mobile Make Bar"}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.mobileMakeBar?.desc || "Show Make bar on mobile devices"}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={mobileMakeBar}
              onChange={(e) => {
                setMobileMakeBar(e.target.checked);
                superstate.settings.basicsSettings = {
                  ...basicsSettings,
                  mobileMakeBar: e.target.checked,
                };
                immediateSave();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};