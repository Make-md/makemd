import { EditorView } from "@codemirror/view";
import MakeBasicsPlugin from "basics/basics";
import { i18n } from "makemd-core";
import { App } from "obsidian";
import React, { useMemo } from "react";
import { uiIconSet } from "shared/assets/icons";
import { SelectOption } from "shared/types/menu";
import { SpaceFragmentSchema } from "shared/types/spaceFragment";

export const FlowEditorHover = (props: {
  path: string;
  pos: { from: number; to: number };
  plugin: MakeBasicsPlugin;
  source?: string;
  app: App;
  view: EditorView;
  toggle: boolean;
  toggleState: boolean;
  dom?: HTMLElement;
}) => {
  const path = props.plugin.enactor.resolvePath(props.path, props.source);
  const [spaceFragment, setSpaceFragment] =
    React.useState<SpaceFragmentSchema>();
  useMemo(
    () =>
      props.plugin.enactor
        .spaceFragmentSchema(path)
        .then((f) => setSpaceFragment(f)),
    [path]
  );

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
    props.plugin.enactor.notify(i18n.notice.tableDeleted);
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

  const showTableMenu = (e: React.MouseEvent) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.buttons.convertTable,
      icon: "ui//sync",
      onClick: (e) => {
        props.plugin.enactor.convertSpaceFragmentToMarkdown(
          spaceFragment,
          (markdown) => {
            props.view.dispatch({
              changes: {
                from: props.pos.from - 4,
                to: props.pos.to + 2,
                insert: markdown,
              },
            });
          }
        );
      },
    });
    menuOptions.push({
      name: i18n.buttons.cutTable,
      icon: "ui//cut",
      onClick: (e) => {
        cutTable();
      },
    });
    menuOptions.push({
      name: i18n.buttons.deleteTable,
      icon: "ui//close",
      onClick: (e) => {
        deleteTable();
      },
    });

    props.plugin.enactor.openMenu(e, menuOptions);
  };

  return (
    <div className="mk-flowblock-menu">
      {!spaceFragment ? (
        <>
          {props.toggle && (
            <button
              aria-label={i18n.buttons.toggleFlow}
              onClick={toggleFlow}
              className={`mk-toolbar-button ${
                props.toggleState ? "mk-toggle-on" : ""
              }`}
              dangerouslySetInnerHTML={{
                __html: !props.toggleState
                  ? uiIconSet["edit-3"]
                  : uiIconSet["book-open"],
              }}
            ></button>
          )}
        </>
      ) : spaceFragment.type == "context" ||
        spaceFragment.frameType == "view" ? (
        <button
          className={"mk-toolbar-button"}
          dangerouslySetInnerHTML={{
            __html: uiIconSet["options"],
          }}
          onClick={(e) => {
            showTableMenu(e);
          }}
        ></button>
      ) : (
        <></>
      )}
    </div>
  );
};
