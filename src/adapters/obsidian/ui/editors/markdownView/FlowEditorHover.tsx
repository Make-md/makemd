import { EditorView } from "@codemirror/view";
import { createTable } from "adapters/obsidian/utils/createTable";
import { PathCrumb } from "core/react/components/UI/Crumbs/PathCrumb";
import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import {
  SpaceFragmentSchema,
  uriToSpaceFragmentSchema,
} from "core/superstate/utils/spaces";
import { mdbSchemaToFrameSchema } from "core/utils/frames/nodes";
import { SelectOption, Superstate, i18n } from "makemd-core";
import { App } from "obsidian";
import React, { useMemo } from "react";
import { windowFromDocument } from "utils/dom";

export const FlowEditorHover = (props: {
  path: string;
  pos: { from: number; to: number };
  superstate: Superstate;
  source?: string;
  app: App;
  view: EditorView;
  toggle: boolean;
  toggleState: boolean;
  dom?: HTMLElement;
}) => {
  const path = props.superstate.spaceManager.resolvePath(
    props.path,
    props.source
  );
  const [spaceFragment, setSpaceFragment] =
    React.useState<SpaceFragmentSchema>();
  useMemo(
    () =>
      uriToSpaceFragmentSchema(props.superstate, path).then((f) =>
        setSpaceFragment(f)
      ),
    [path]
  );
  const convertTable = async () => {
    if (spaceFragment.type == "frame") {
      const schema = await props.superstate.spaceManager
        .readFrame(spaceFragment.path, spaceFragment.id)
        .then((f) => f?.schema);

      if (schema) {
        const mdbSchema = mdbSchemaToFrameSchema(schema);
        props.superstate.spaceManager
          .readTable(spaceFragment.path, mdbSchema.def.db)
          .then((mdbTable) => {
            if (!mdbTable) return;
            const markdown = createTable(mdbTable.rows, mdbTable.cols);
            props.view.dispatch({
              changes: {
                from: props.pos.from - 4,
                to: props.pos.to + 2,
                insert: markdown,
              },
            });
          });
      }
    } else {
      props.superstate.spaceManager
        .readTable(spaceFragment.path, spaceFragment.id)
        .then((mdbTable) => {
          if (!mdbTable) return;
          const markdown = createTable(mdbTable.rows, mdbTable.cols);
          props.view.dispatch({
            changes: {
              from: props.pos.from - 4,
              to: props.pos.to + 2,
              insert: markdown,
            },
          });
        });
    }
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
    props.superstate.ui.notify(i18n.notice.tableDeleted);
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
        convertTable();
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
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };

  return (
    <div className="mk-flowblock-menu">
      {!spaceFragment ? (
        <>
          <PathCrumb superstate={props.superstate} path={path}></PathCrumb>
          {props.toggle && (
            <button
              aria-label={i18n.buttons.toggleFlow}
              onClick={toggleFlow}
              className={`mk-toolbar-button ${
                props.toggleState ? "mk-toggle-on" : ""
              }`}
              dangerouslySetInnerHTML={{
                __html: !props.toggleState
                  ? props.superstate.ui.getSticker("ui//edit-3")
                  : props.superstate.ui.getSticker("ui//book-open"),
              }}
            ></button>
          )}
        </>
      ) : spaceFragment.type == "context" ||
        spaceFragment.frameType == "view" ? (
        <button
          className={"mk-toolbar-button"}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//options"),
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
