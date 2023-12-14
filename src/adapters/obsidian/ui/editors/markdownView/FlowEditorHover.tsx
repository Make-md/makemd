import { EditorView } from "@codemirror/view";
import { createTable } from "adapters/obsidian/utils/createTable";
import { Superstate, i18n } from "makemd-core";
import React from "react";

export const FlowEditorHover = (props: {
  path: string;
  pos: { from: number; to: number };
  superstate: Superstate;
  view: EditorView;
  toggle: boolean;
  toggleState: boolean;
  dom?: HTMLElement;
}) => {
  const uri = props.superstate.spaceManager.uriByString(props.path);
  const pathState = props.superstate.pathsIndex.get(uri.path);
  const convertTable = () => {
    props.superstate.spaceManager
      .readTable(uri.fullPath, uri.ref)
      .then((mdbTable) => {
        const markdown = createTable(mdbTable.rows, mdbTable.cols);
        props.view.dispatch({
          changes: {
            from: props.pos.from - 4,
            to: props.pos.to + 2,
            insert: markdown,
          },
        });
      });
  };
  const cutTable = () => {
    navigator.clipboard.writeText(`![![${props.path}]]`);
    props.view.dispatch({
      changes: { from: props.pos.from - 4, to: props.pos.to + 2 },
    });
  };
  const deleteTable = () => {
    props.view.dispatch({
      changes: { from: props.pos.from - 4, to: props.pos.to + 2 },
    });
  };
  const toggleFlow = () => {
    const domPos = props.view.posAtDOM(props.dom);
    const line = props.view.state.doc.lineAt(domPos);
    const pos = line.from;
    if (props.toggleState) {
      props.view.dispatch({
        changes: { from: pos, to: pos + 1 },
      });
    } else {
      props.view.dispatch({
        changes: {
          from: pos,
          to: pos,
          insert: "!",
        },
      });
    }
  };
  const openLink = () => {
    props.superstate.ui.openPath(uri.path, false);
  };

  return (
    <>
      {pathState ? (
        <div className="mk-flowblock-menu">
          {pathState.type == "md" ? (
            <>
              {props.toggle && (
                <div
                  aria-label={i18n.buttons.toggleFlow}
                  onClick={toggleFlow}
                  className={`mk-hover-button ${
                    props.toggleState ? "mk-toggle-on" : ""
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: !props.toggleState
                      ? props.superstate.ui.getSticker("lucide//edit-3")
                      : props.superstate.ui.getSticker("lucide//book-open"),
                  }}
                ></div>
              )}
              <div
                aria-label={i18n.buttons.openLink}
                onClick={openLink}
                className="mk-hover-button"
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//mk-ui-open-link"),
                }}
              ></div>
            </>
          ) : (
            <>
              <div
                aria-label={i18n.buttons.convertTable}
                onClick={convertTable}
                className={"mk-icon-small mk-hover-button"}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//mk-ui-sync"),
                }}
              ></div>
              <div
                aria-label={i18n.buttons.cutTable}
                onClick={cutTable}
                className={"mk-icon-small mk-hover-button"}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//mk-ui-cut"),
                }}
              ></div>
              <div
                aria-label={i18n.buttons.deleteTable}
                onClick={deleteTable}
                className={"mk-icon-small mk-hover-button"}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
                }}
              ></div>
            </>
          )}{" "}
        </div>
      ) : (
        <></>
      )}
    </>
  );
};
