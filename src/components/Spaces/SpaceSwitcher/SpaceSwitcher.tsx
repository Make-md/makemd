import classNames from "classnames";
import { triggerSectionMenu } from "components/ui/menus/fileMenu";
import { EditSpaceModal } from "components/ui/modals/editSpaceModal";
import "css/NewNote.css";
import i18n from "i18n";
import t from "i18n";
import MakeMDPlugin from "main";
import { TFolder } from "obsidian";
import React, { useMemo } from "react";
import { useRecoilState } from "recoil";
import * as recoilState from "recoil/pluginState";
import { unifiedToNative } from "utils/emoji";
import { createNewMarkdownFile, defaultNoteFolder } from "utils/file";
import { uiIconSet } from "utils/icons";
import { MainMenu } from "../MainMenu";
export const SpaceSwitcher = (props: { plugin: MakeMDPlugin }) => {
  const [activeView, setActiveView] = useRecoilState(recoilState.activeView);
  const [spaces, setSpaces] = useRecoilState(recoilState.spaces);
  const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);
  const folder: TFolder = defaultNoteFolder(props.plugin, activeFile);
  const { plugin } = props;
  const newFile = async () => {
    await createNewMarkdownFile(props.plugin, folder, "", "");
  };
  const pinnedSpaces = useMemo(
    () => spaces.filter((f) => f.pinned == "true"),
    [spaces]
  );
  const [activeViewSpace, setActiveViewSpace] = useRecoilState(
    recoilState.activeViewSpace
  );
  const newSection = () => {
    let vaultChangeModal = new EditSpaceModal(props.plugin, "", "create");
    vaultChangeModal.open();
  };
  return props.plugin.settings.spacesCompactMode ? (
    <div className="mk-flow-bar-compact">
      <MainMenu plugin={props.plugin}></MainMenu>
      <button
        aria-label={t.buttons.newNote}
        className="mk-inline-button"
        onClick={() => newFile()}
      >
        <div
          className="mk-icon-small"
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-new-note"] }}
        ></div>
      </button>
      <button
        aria-label={"Blink"}
        className="mk-inline-button"
        onClick={() => props.plugin.quickOpen()}
      >
        <div
          className="mk-icon-small"
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-blink"] }}
        ></div>
      </button>
    </div>
  ) : (
    <>
      <div className="mk-flow-bar">
        <button
          aria-label={t.buttons.newNote}
          className="mk-new-note"
          onClick={() => newFile()}
        >
          <div
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-new-note"] }}
          ></div>
          <p>{t.buttons.newNote}</p>
        </button>
        <button
          aria-label={i18n.buttons.blink}
          className="mk-button-blink"
          onClick={() => props.plugin.quickOpen()}
        >
          <div
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-blink"] }}
          ></div>
        </button>
      </div>
      <div className="mk-sidebar-switcher">
        <div
          className={classNames(
            "mk-sidebar-item",
            pinnedSpaces.length == 0 && "mk-sidebar-expanded",
            activeView == "root" && "mk-sidebar-item-active"
          )}
          onClick={() => setActiveView("root")}
        >
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-spaces"] }}
          >
            {" "}
          </div>
          {pinnedSpaces.length == 0 && <div>Spaces</div>}
        </div>
        <div
          className={classNames(
            "mk-sidebar-item",
            pinnedSpaces.length == 0 && "mk-sidebar-expanded",
            activeView == "tags" && "mk-sidebar-item-active"
          )}
          onClick={() => setActiveView("tags")}
        >
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-tags"] }}
          >
            {" "}
          </div>{" "}
          {pinnedSpaces.length == 0 && <div>Contexts</div>}
        </div>
        <div className="mk-sidebar-spaces">
          {pinnedSpaces.map((pin) => {
            return (
              <div
                onContextMenu={(e) =>
                  triggerSectionMenu(props.plugin, pin.name, spaces, e)
                }
                className={classNames(
                  "mk-sidebar-item mk-sidebar-space",
                  activeView == "space" &&
                    activeViewSpace == pin.name &&
                    "mk-sidebar-item-active"
                )}
                onClick={() => (
                  setActiveView("space"), setActiveViewSpace(pin.name)
                )}
                dangerouslySetInnerHTML={
                  pin.sticker?.length > 0
                    ? { __html: unifiedToNative(pin.sticker) }
                    : null
                }
              >
                {pin.name.substring(0, 1)}
              </div>
            );
          })}
        </div>
        <div
          className={classNames("mk-sidebar-item")}
          onClick={() => newSection()}
        >
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-new-space"] }}
          >
            {" "}
          </div>
        </div>
      </div>
    </>
  );
};
