import { Superstate, i18n } from "makemd-core";

import { parseFieldValue } from "core/schemas/parseFieldValue";
import React, { useEffect, useMemo, useState } from "react";
import { Command } from "types/commands";
import { SpaceProperty } from "types/mdb";
import { windowFromDocument } from "utils/dom";
import { DataPropertyView } from "../../SpaceView/Contexts/DataTypeView/DataPropertyView";
import { CellEditMode } from "../../SpaceView/Contexts/TableView/TableView";
import { Dropdown } from "../../UI/Dropdown";
import { showNewPropertyMenu } from "../../UI/Menus/contexts/newSpacePropertyMenu";
import { showPropertyMenu } from "../../UI/Menus/contexts/spacePropertyMenu";
import { ActionEditor } from "./ActionEditor";
import { FormulaEditor } from "./FormulaEditor";
import { ScriptEditor } from "./ScriptEditor";

export const SpaceCommand = (props: {
  superstate: Superstate;
  action: string;
}) => {
  const [command, setCommand] = useState<Command>(null);
  const uri = useMemo(() => {
    return props.superstate.spaceManager.uriByString(props.action);
  }, [props.action]);
  const saveCommand = (command: Command) => {
    setCommand(command);
    if (uri.authority == "$actions") {
      props.superstate.spaceManager.saveSystemCommand(
        uri.path.split("/").pop(),
        command
      );
      return;
    }
    props.superstate.spaceManager.saveCommand(
      uri.path,
      command.schema.id,
      () => command
    );
  };

  useEffect(() => {
    setCommand(props.superstate.cli.commandForAction(props.action));
  }, [props.action]);

  useEffect(() => {
    const listener = (f: { path: string }) => {
      if (f.path == uri.basePath)
        setCommand(props.superstate.cli.commandForAction(props.action));
    };
    props.superstate.eventsDispatcher.addListener(
      "actionStateUpdated",
      listener
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "actionStateUpdated",
        listener
      );
    };
  });

  const saveField = (source: string, field: SpaceProperty) => {
    saveCommand({
      ...command,
      fields: [...command.fields, field],
    });return true;
  };

  const deleteProperty = (field: SpaceProperty) => {
    saveCommand({
      ...command,
      fields: command.fields.filter((f) => f.name != field.name),
    });
  };

  const updateField = (newField: SpaceProperty, oldField: SpaceProperty) => {
    saveCommand({
      ...command,
      fields: command.fields.map((f) => {
        if (f.name == oldField.name) {
          return newField;
        }
        return f;
      }),
    });
  };
  const newProperty = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showNewPropertyMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      {
        spaces: [],
        fields: [],
        saveField,
        schemaId: command.schema.id,
        fileMetadata: true,
        isSpace: true,
      }
    );
  };
  const menuItems = [
    { name: "Actions", value: "actions" },
    { name: "Script", value: "script" },
    { name: "Formula", value: "formula" },
  ];

  const defaultValueForField = (field: SpaceProperty) => {
    const parsedValue = parseFieldValue(field.value, field.type);
    if (parsedValue) {
      return parsedValue?.default;
    }
  };
  const saveDefaultValueForField = (field: SpaceProperty, value: any) => {
    const parsedValue = parseFieldValue(field.value, field.type) ?? {};
    parsedValue.default = value;

    updateField(
      {
        ...field,
        value: JSON.stringify(parsedValue),
      },
      field
    );
  };
  const defaultValues = useMemo(() => {
    return (
      command?.fields.reduce((p, c) => {
        return { ...p, [c.name]: defaultValueForField(c) };
      }, {}) ?? {}
    );
  }, [command?.fields]);
  return (
    <div className="mk-editor-actions">
      {command && (
        <>
          <div className="mk-props-contexts">
            <div className="mk-path-context-row">
              <div className="mk-path-context-field">Type</div>
              <div className="mk-path-context-value">
                <Dropdown
                  superstate={props.superstate}
                  options={menuItems}
                  value={command.schema.type}
                  selectValue={(value) =>
                    saveCommand({
                      ...command,
                      schema: {
                        ...command.schema,
                        type: value,
                      },
                    })
                  }
                ></Dropdown>
              </div>
            </div>
            <div className="mk-path-context-row">
              <div className="mk-path-context-field">Properties</div>
            </div>
            <div className="mk-cell-object">
              {command.fields.map((f) => {
                return (
                  <DataPropertyView
                    key={f.name}
                    superstate={props.superstate}
                    initialValue={defaultValueForField(f)}
                    column={f}
                    editMode={CellEditMode.EditModeAlways}
                    updateValue={(value) => {
                      saveDefaultValueForField(f, value);
                    }}
                    updateFieldValue={(fieldValue, value) => {
                      saveCommand({
                        ...command,
                        fields: command.fields.map((g) => {
                          if (f.name == g.name) {
                            return {
                              ...g,
                              value: fieldValue,
                            };
                          }
                          return g;
                        }),
                      });
                    }}
                    propertyMenu={(e) => {
                      const offset = (
                        e.target as HTMLElement
                      ).getBoundingClientRect();
                      showPropertyMenu({
                        superstate: props.superstate,
                        rect: offset,
                        win: windowFromDocument(e.view.document),
                        editable: true,
                        options: [],
                        field: f,
                        fields: command.fields,
                        contextPath: null,
                        saveField: (newField) => updateField(newField, f),
                        deleteColumn: deleteProperty,
                      });
                    }}
                  ></DataPropertyView>
                );
              })}
            </div>
            <button
              className="mk-inline-button"
              onClick={(e) => newProperty(e)}
            >
              <div
                className="mk-icon-xsmall"
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//plus"),
                }}
              ></div>
              {i18n.labels.newProperty}
            </button>
          </div>
          {command.schema.type == "script" ? (
            <ScriptEditor
              superstate={props.superstate}
              command={command}
              saveCommand={saveCommand}
              values={defaultValues}
              path={uri.path}
            ></ScriptEditor>
          ) : command.schema.type == "actions" ? (
            <ActionEditor
              superstate={props.superstate}
              formula={command.code}
              path={uri.path}
              saveOutputType={(outputType: string) => {
                saveCommand({
                  ...command,
                  codeType: outputType,
                });
              }}
              saveFormula={(formula: string) => {
                saveCommand({
                  ...command,
                  code: formula,
                });
              }}
              fields={command.fields}
              value={defaultValues}
            ></ActionEditor>
          ) : command.schema.type == "formula" ? (
            <FormulaEditor
              superstate={props.superstate}
              formula={command.code}
              saveFormula={(formula: string) => {
                saveCommand({
                  ...command,
                  code: formula,
                });
              }}
              fields={command.fields}
              value={defaultValues}
              path={uri.path}
            ></FormulaEditor>
          ) : (
            <div></div>
          )}
        </>
      )}
    </div>
  );
};
