import classNames from "classnames";
import {
  triggerSectionAddMenu,
  triggerSectionMenu,
} from "components/ui/menus/fileMenu";
import "css/NewNote.css";
import { default as i18n, default as t } from "i18n";
import MakeMDPlugin from "main";
import { TFolder } from "obsidian";
import { useEffect } from "preact/hooks";
import React, { useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import * as recoilState from "recoil/pluginState";
import { eventTypes } from "types/types";
import { createNewMarkdownFile, defaultNoteFolder } from "utils/file";
import { uiIconSet } from "utils/icons";
import { stickerFromString } from "utils/sticker";
export const SpaceSwitcher = (props: { plugin: MakeMDPlugin }) => {
  const [activeView, setActiveView] = useRecoilState(recoilState.activeView);
  const [spaces, setSpaces] = useState([]);
  const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);
  const folder: TFolder = defaultNoteFolder(props.plugin, activeFile);
  const { plugin } = props;

  const newFile = async () => {
    await createNewMarkdownFile(props.plugin, folder, "", "");
  };
  const pinnedSpaces = useMemo(
    () => spaces.filter((f) => f.pinned == "true" || f.pinned == "pinned"),
    [spaces]
  );
  const [activeViewSpace, setActiveViewSpace] = useRecoilState(
    recoilState.activeViewSpace
  );

  useEffect(() => {
    loadCachedSpaces();
  }, []);

  const loadCachedSpaces = () => {
    setSpaces([...plugin.index.allSpaces()]);
    setActiveView(plugin.settings.activeView);
    setActiveViewSpace(plugin.settings.activeSpace);
  };
  useEffect(() => {
    window.addEventListener(eventTypes.spacesChange, loadCachedSpaces);
    return () => {
      window.removeEventListener(eventTypes.spacesChange, loadCachedSpaces);
    };
  }, [loadCachedSpaces]);

  useEffect(() => {
    plugin.settings.activeSpace = activeViewSpace;
    plugin.settings.activeView = activeView;
    plugin.saveSettings();
  }, [activeView, activeViewSpace]);

  return (
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
        {props.plugin.settings.blinkEnabled && (
          <button
            aria-label={i18n.buttons.blink}
            className="mk-button-blink"
            onClick={() => props.plugin.quickOpen()}
          >
            <div
              dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-blink"] }}
            ></div>
          </button>
        )}
      </div>
      <div className="mk-sidebar-switcher">
        <div
          className={classNames(
            "mk-sidebar-item",
            activeView == "root" && "mk-sidebar-item-active"
          )}
          onClick={() => setActiveView("root")}
        >
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-home"] }}
          ></div>
        </div>
        <div
          className={classNames(
            "mk-sidebar-item",
            activeView == "tags" && "mk-sidebar-item-active"
          )}
          onClick={() => setActiveView("tags")}
        >
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-tags"] }}
          ></div>
        </div>
        <div
          className={classNames(
            "mk-sidebar-item",
            activeView == "all" && "mk-sidebar-item-active"
          )}
          onClick={() => setActiveView("all")}
        >
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-spaces"] }}
          ></div>
        </div>
        <div className="mk-sidebar-spaces">
          {pinnedSpaces.map((pin, i) => {
            return (
              <div
                key={i}
                onContextMenu={(e) =>
                  triggerSectionMenu(props.plugin, pin, spaces, e, activeFile)
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
                    ? { __html: stickerFromString(pin.sticker, props.plugin) }
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
          onClick={(e) => triggerSectionAddMenu(plugin, e)}
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
