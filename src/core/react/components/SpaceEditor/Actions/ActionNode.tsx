import { allActions } from "core/schemas/parseFieldValue";
import { Superstate } from "makemd-core";
import React, { useEffect, useMemo } from "react";
import { stickerForSchema } from "schemas/mdb";
import { SpaceProperty } from "shared/types/mdb";
import { windowFromDocument } from "shared/utils/dom";
import { ActionTree } from "../../../../../shared/types/actions";
import { DataPropertyView } from "../../SpaceView/Contexts/DataTypeView/DataPropertyView";
import { CellEditMode } from "../../SpaceView/Contexts/TableView/TableView";
import { BuiltinPropertyEditor } from "./BuiltinPropertyEditor";

export const ActionNode = (props: {
  superstate: Superstate;
  path: string;
  hasSiblings: boolean;
  prevField: SpaceProperty;
  fields: SpaceProperty[];
  actionTree: ActionTree;
  saveTree: (tree: ActionTree) => void;
  deleteTree?: () => void;
  values: { [key: string]: any };
}) => {
  const [action, setAction] = React.useState(props.actionTree?.action);
  const command = useMemo(
    () => props.superstate.cli.commandForAction(action),
    [action]
  );
  useEffect(() => {
    setAction(props.actionTree?.action);
  }, [props.actionTree]);
  const selectAction = (e: React.MouseEvent, add?: boolean) => {
    const options = [...allActions(props.superstate, props.path)];
    const sections = [...new Set(options.map((f) => f.section))].map((f) => ({
      name: f,
      value: f,
    }));
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        editable: true,
        value: [action],
        options,
        sections,
        showSections: true,
        saveOptions: (options, value) => {
          if (add) {
            props.saveTree({
              ...props.actionTree,
              children: [
                ...props.actionTree.children,
                { action: value[0], props: {}, propsValue: {}, children: [] },
              ],
            });
            return;
          }
          props.saveTree({ ...props.actionTree, action: value[0] });
        },
      },
      windowFromDocument(e.view.document)
    );
  };

  const selectLinkedProp = (e: React.MouseEvent, prop: string) => {
    const options = props.fields.map((f) => ({ name: f.name, value: f.name }));
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        editable: true,
        value: [],
        options,
        saveOptions: (options, value) => {
          props.saveTree({
            ...props.actionTree,
            linked: { ...props.actionTree.linked, [prop]: value[0] },
          });
        },
      },
      windowFromDocument(e.view.document)
    );
  };

  return (
    <div className="mk-editor-actions-node">
      <div className="mk-editor-actions-body">
        <div className="mk-editor-actions-name">
          <div
            className="mk-path-icon"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker(
                command ? stickerForSchema(command.schema) : "ui//plus"
              ),
            }}
          ></div>
          <div
            onClick={(e) => !command && selectAction(e)}
            className="mk-editor-actions-selector"
          >
            {command?.schema.name ?? "Select"}
          </div>
          <span></span>
          {props.deleteTree && (
            <div
              className="mk-icon-small"
              onClick={(e) => props.deleteTree()}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//close"),
              }}
            ></div>
          )}
        </div>
        {command && (
          <div className="mk-editor-actions-fields">
            {command.schema.type == "builtin" ? (
              <BuiltinPropertyEditor
                superstate={props.superstate}
                command={command}
                actionTree={props.actionTree}
                saveTree={props.saveTree}
                fields={[...props.fields, props.prevField].filter((f) => f)}
                values={props.values}
                path={props.path}
              ></BuiltinPropertyEditor>
            ) : (
              command?.fields.map((f, i) => {
                return (
                  <DataPropertyView
                    key={i}
                    superstate={props.superstate}
                    column={f}
                    columns={props.fields}
                    initialValue={props.actionTree.props[f.name]}
                    updateValue={(value) => {
                      const newTree = { ...props.actionTree };
                      newTree.props[f.name] = value;
                      props.saveTree(newTree);
                    }}
                    updateFieldValue={(fieldValue, value) => {
                      const newTree = { ...props.actionTree };
                      newTree.props[f.name] = value;
                      newTree.propsValue[f.name] = fieldValue;
                      props.saveTree(newTree);
                    }}
                    editMode={CellEditMode.EditModeAlways}
                    linkProp={(e) => selectLinkedProp(e, f.name)}
                  ></DataPropertyView>
                );
              })
            )}
          </div>
        )}
      </div>
      <div className={props.hasSiblings ? "mk-editor-actions-children" : ""}>
        {props.actionTree.children.map((child, i) => (
          <ActionNode
            key={i}
            hasSiblings={props.actionTree.children.length > 1}
            prevField={command?.fields[i]}
            superstate={props.superstate}
            path={props.path}
            fields={props.fields}
            actionTree={child}
            saveTree={(tree) => {
              const newTree = { ...props.actionTree };
              newTree.children[i] = tree;
              props.saveTree(newTree);
            }}
            values={props.values}
            deleteTree={() => {
              const newTree = { ...props.actionTree };
              newTree.children.splice(i, 1);
              props.saveTree(newTree);
            }}
          ></ActionNode>
        ))}
        {props.actionTree.children.length == 0 && (
          <button
            onClick={(e) => selectAction(e, true)}
            className="mk-inline-button"
          >
            <div
              className="mk-icon-xsmall"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//plus"),
              }}
            ></div>
            Add Step
          </button>
        )}
      </div>
    </div>
  );
};
