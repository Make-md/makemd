import classNames from "classnames";
import { NavigatorContext } from "core/react/context/SidebarContext";
import { createSpace } from "core/superstate/utils/spaces";
import { i18n, Superstate } from "makemd-core";
import React, { useContext, useEffect, useState } from "react";
import { Focus } from "shared/types/focus";
import { windowFromDocument } from "shared/utils/dom";
import StickerModal from "../../../../../shared/components/StickerModal";
import { BlinkMode } from "../../../../../shared/types/blink";
export const FocusEditor = (props: {
  superstate: Superstate;
  focus: Focus;
  saveFocus: (focus: Focus) => void;
}) => {
  const {
    saveActiveSpace,
    editFocus: editFocus,
    activeFocus: activeFocus,
    setFocuses: setFocuses,
    focuses: focuses,
    setEditFocus: setEditFocus,
  } = useContext(NavigatorContext);
  const [focus, setFocus] = useState<Focus>(props.focus);
  useEffect(() => {
    setFocus(props.focus);
  }, [props.focus]);
  return focus && props.focus ? (
    props.focus.name?.length == 0 || editFocus ? (
      <div className="mk-path-tree-focus">
        <div
          className={classNames("mk-focuses-item")}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker(focus.sticker),
          }}
          onClick={(e) =>
            props.superstate.ui.openPalette(
              <StickerModal
                ui={props.superstate.ui}
                selectedSticker={(emoji) => {
                  setFocus({ ...focus, sticker: emoji });
                }}
              />,
              windowFromDocument(e.view.document)
            )
          }
        ></div>
        <input
          value={focus.name}
          onChange={(e) => setFocus({ ...focus, name: e.target.value })}
        ></input>
        <div className="mk-button-group">
          <button onClick={() => props.saveFocus(focus)}>
            {i18n.buttons.save}
          </button>
          <button
            onClick={() => {
              if (props.focus.name.length == 0) {
                setFocuses(focuses.filter((f, i) => i != activeFocus));
                props.superstate.saveSettings();
              } else {
                setEditFocus(false);
              }
            }}
          >
            {i18n.buttons.cancel}
          </button>
        </div>
      </div>
    ) : (
      <div className="mk-path-tree-empty">
        <div className="mk-empty-state-title">Open a Space</div>
        <div className="mk-empty-state-description">
          Open an existing folders and tags as a space or create a new one
        </div>
        <button
          onClick={(e) => {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            props.superstate.ui.quickOpen(
              BlinkMode.Open,
              rect,
              windowFromDocument(e.view.document),
              (link) => {
                const isNew = !props.superstate.pathsIndex.has(link);
                if (isNew) {
                  createSpace(props.superstate, link, {}).then((f) => {
                    saveActiveSpace(link);
                    props.superstate.ui.openPath(link, false);
                  });
                  return;
                }
                saveActiveSpace(link);
              }
            );
          }}
        >
          Open a Space
        </button>
      </div>
    )
  ) : (
    <></>
  );
};
