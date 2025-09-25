import { DataPropertyView } from "core/react/components/SpaceView/Contexts/DataTypeView/DataPropertyView";
import { CellEditMode } from "core/react/components/SpaceView/Contexts/TableView/TableView";
import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { defaultValueForField } from "core/utils/contexts/fields/fields";
import { SelectOptionType, Superstate } from "makemd-core";
import React, { useEffect, useState } from "react";
import { Command, CommandWithPath } from "shared/types/commands";
import { FrameNodeState } from "shared/types/frameExec";
import { SpaceTableColumn } from "shared/types/mdb";
import { SelectOption } from "shared/types/menu";
import { FrameNode } from "shared/types/mframe";
import { windowFromDocument } from "shared/utils/dom";
import {
  parseJsonWithUnquoted,
  stringifyJsonWithUnquoted,
} from "shared/utils/jsonWithUnquoted";

interface ButtonSubmenuProps {
  superstate: Superstate;
  node: FrameNode;
  state: FrameNodeState;
  path: string;
  updateNode: (node: FrameNode, props: Partial<FrameNode>) => void;
  propName: string; // The prop to update (e.g., 'onClick', 'action', etc.)
  propLabel?: string; // Optional label for the UI
}

export const ButtonSubmenu: React.FC<ButtonSubmenuProps> = ({
  superstate,
  node,
  state,
  path,
  updateNode,
  propName,
  propLabel = "When triggered",
}) => {
  // Helper function to get initial value with fallback to default
  const getInitialValue = (value: any, column: SpaceTableColumn) => {
    if (!value || value === "") {
      return defaultValueForField(column, value, path) || "";
    }
    return value;
  };

  // Helper function to safely parse prop value
  const parsePropValue = (value: any) => {
    if (!value) {
      return { command: "", parameters: {} };
    }
    if (typeof value === "object") {
      return value;
    }
    if (typeof value === "string") {
      const trimmedValue = value.trim();
      // Only parse if it looks like a JSON object
      if (trimmedValue.startsWith("{") && trimmedValue.endsWith("}")) {
        // Use the new JSON parser that handles unquoted fields
        const { value: parsed } = parseJsonWithUnquoted(value);
        if (parsed && typeof parsed === "object") {
          // Handle both old format (action/params) and new format (command/parameters)
          if (parsed.command) {
            return parsed;
          } else if (parsed.action) {
            return { command: parsed.action, parameters: parsed.params || {} };
          }
        }
      } else {
        // If it's not a JSON object, treat it as a simple command string
        return { command: value, parameters: {} };
      }
      return { command: "", parameters: {} };
    }
    return { command: "", parameters: {} };
  };

  // Get initial value from node.actions (where the command object is stored)

  const initialActionValue = parsePropValue(node?.actions?.[propName]);

  const [selectedAction, setSelectedAction] = useState<string>(
    initialActionValue.command || ""
  );
  const [actionParams, setActionParams] = useState<any>(
    initialActionValue.parameters || {}
  );
  const [availableCommands, setAvailableCommands] = useState<CommandWithPath[]>(
    []
  );
  const [selectedCommand, setSelectedCommand] =
    useState<CommandWithPath | null>(null);
  const [parameterValues, setParameterValues] = useState<{
    [key: string]: string;
  }>({});
  const [selectedApiCommand, setSelectedApiCommand] = useState<Command | null>(
    null
  );

  // Load available commands
  useEffect(() => {
    if (superstate.cli) {
      const commands = superstate.cli.allCommands();
      setAvailableCommands(commands);
    }
  }, [superstate]);

  // Initialize selected command and parameters when action changes
  useEffect(() => {
    if (selectedAction && availableCommands.length > 0) {
      const cmd = availableCommands.find((c) => c.path === selectedAction);
      if (cmd) {
        setSelectedCommand(cmd);
        setSelectedApiCommand(null);
        // Initialize parameter values from existing actionParams
        const initialParams: { [key: string]: string } = {};
        cmd.fields?.forEach((field) => {
          initialParams[field.name] = actionParams[field.name] || "";
        });
        setParameterValues(initialParams);
      } else {
        // Try to get API command from superstate
        if (selectedAction.startsWith("spaces://$api/") && superstate.cli) {
          const apiCmd = superstate.cli.commandForAction(selectedAction);
          if (apiCmd) {
            setSelectedApiCommand(apiCmd);
            // Initialize parameter values from existing actionParams
            const initialParams: { [key: string]: string } = {};
            apiCmd.fields?.forEach((field: any) => {
              initialParams[field.name] = actionParams[field.name] || "";
            });
            setParameterValues(initialParams);
          }
        }
        // Handle space actions that may not be in allCommands
        setSelectedCommand(null);
        // Still initialize parameters from actionParams
        const initialParams: { [key: string]: string } = {};
        Object.keys(actionParams).forEach((key) => {
          initialParams[key] = actionParams[key] || "";
        });
        setParameterValues(initialParams);
      }
    }
  }, [selectedAction, availableCommands, actionParams, superstate.cli]);

  const updateAction = (action: string, params: any) => {
    setSelectedAction(action);
    setActionParams(params);

    // Create the command object for actions
    const commandObject = {
      command: action,
      parameters: params,
    };

    // Use the new JSON stringifier that handles unquoted fields
    const stringifiedCommand = stringifyJsonWithUnquoted(commandObject, {
      command: true,
      parameters: true,
    });

    // Update both interactions and actions
    updateNode(node, {
      interactions: {
        ...node.interactions,
        [propName]: propName, // Set interaction to the prop name (e.g., "onClick")
      },
      actions: {
        ...node.actions,
        [propName]: stringifiedCommand, // Set the action to the command object
      },
    });
  };

  const updateParameterValue = (paramName: string, value: string) => {
    const newParams = {
      ...parameterValues,
      [paramName]: value,
    };
    setParameterValues(newParams);

    // Update the action params
    const newActionParams = { ...actionParams, [paramName]: value };
    setActionParams(newActionParams);

    // Create the command object for actions
    const commandObject = {
      command: selectedAction,
      parameters: newActionParams,
    };

    // Use the new JSON stringifier that handles unquoted fields
    const stringifiedCommand = stringifyJsonWithUnquoted(commandObject, {
      command: true,
      parameters: true,
    });

    // Update both interactions and actions
    updateNode(node, {
      interactions: {
        ...node.interactions,
        [propName]: propName, // Keep interaction set to prop name
      },
      actions: {
        ...node.actions,
        [propName]: stringifiedCommand, // Update the action with new parameters
      },
    });
  };

  const showActionSelectMenu = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Filter out unnecessary system commands
    const filteredCommands = availableCommands.filter((cmd) => {
      const cmdId = cmd.schema.id.toLowerCase();
      const cmdPath = cmd.path.toLowerCase();

      // Exclude cache, channels, status, and other system commands
      const excludedPatterns = [
        "cache",
        "channel",
        "status",
        "system",
        "reload",
        "refresh",
        "index",
        "sync",
        "debug",
        "log",
        "console",
      ];

      // Check if command contains any excluded pattern
      const shouldExclude = excludedPatterns.some(
        (pattern) => cmdId.includes(pattern) || cmdPath.includes(pattern)
      );

      // Also exclude if it's already in the API commands we manually add
      const isApiCommand = cmdPath.startsWith("spaces://$api/path/#;");

      // Exclude only specific builtin actions like formula, filter, etc.
      const isBuiltinAction =
        cmdPath.startsWith("spaces://$actions/") ||
        cmdPath.includes("$builtin") ||
        cmd.schema.type === "builtin" ||
        cmd.schema.type === "formula" ||
        cmd.schema.type === "script" ||
        cmdId === "formula" ||
        cmdId === "filter" ||
        cmdId === "sort" ||
        cmdId === "search";

      return !shouldExclude && !isApiCommand && !isBuiltinAction;
    });

    const options: SelectOption[] = filteredCommands.map((cmd) => ({
      name: cmd.schema.name || cmd.schema.id,
      value: cmd.path,
      onClick: () => {
        setSelectedAction(cmd.path);
        setSelectedCommand(cmd);
        // Reset parameter values for new command
        const initialParams: { [key: string]: string } = {};
        cmd.fields?.forEach((field) => {
          initialParams[field.name] = "";
        });
        setParameterValues(initialParams);
        updateAction(cmd.path, {});
      },
    }));

    // Get space-specific actions and API commands
    const spaceActions: SelectOption[] = [];

    // Add API commands from SpacesCommandsAdapter
    // These use the format: spaces://$api/{namespace}/#;{method}
    spaceActions.push({
      name: "Open Path",
      value: "spaces://$api/path/#;open",
      onClick: () => {
        const action = "spaces://$api/path/#;open";
        setSelectedAction(action);
        setSelectedCommand(null);
        const initialValue = { path: "" };
        setParameterValues(initialValue);
        updateAction(action, initialValue);
      },
    });

    spaceActions.push({
      name: "Create Item in Space",
      value: "spaces://$api/path/#;create",
      onClick: () => {
        const action = "spaces://$api/path/#;create";
        setSelectedAction(action);
        setSelectedCommand(null);
        const initialValue = { name: "", space: "", content: "" };
        setParameterValues(initialValue);
        updateAction(action, initialValue);
      },
    });

    spaceActions.push({
      name: "New Item View",
      value: "spaces://$api/table/#;createModal",
      onClick: () => {
        const action = "spaces://$api/table/#;createModal";
        setSelectedAction(action);
        setSelectedCommand(null);
        const initialValue = { space: "", schema: "" };
        setParameterValues(initialValue);
        updateAction(action, initialValue);
      },
    });

    spaceActions.push({
      name: "Open Update Item View",
      value: "spaces://$api/path/#;setProperty",
      onClick: () => {
        const action = "spaces://$api/path/#;setProperty";
        setSelectedAction(action);
        setSelectedCommand(null);
        const initialValue = { path: "", property: "", value: "" };
        setParameterValues(initialValue);
        updateAction(action, initialValue);
      },
    });

    // Get actions for current space if path is available
    if (path && superstate.actions?.has(path)) {
      const pathActions = superstate.actions.get(path) || [];
      pathActions.forEach((action) => {
        spaceActions.push({
          name: action.schema.name || action.schema.id,
          value: `spaces://$api/${path}/#;${action.schema.id}`,
          icon: action.schema.def?.icon || "ui//command",
          onClick: () => {
            const actionPath = `spaces://$api/${path}/#;${action.schema.id}`;
            setSelectedAction(actionPath);
            setSelectedCommand({
              scheme: "spaces",
              path: actionPath,
              ...action,
            } as CommandWithPath);
            // Initialize parameter values for action
            const initialParams: { [key: string]: string } = {};
            action.fields?.forEach((field) => {
              initialParams[field.name] = "";
            });
            setParameterValues(initialParams);
            updateAction(actionPath, {});
          },
        });
      });
    }

    // Put space actions first, then other filtered commands
    const allOptions = [...spaceActions];

    // Add a separator between space actions and other commands if there are other commands
    if (options.length > 0) {
      allOptions.push({
        name: "---",
        type: SelectOptionType.Separator,
      });
      allOptions.push(...options);
    }

    if (allOptions.length === 0) {
      allOptions.push({
        name: "No actions available",
        type: SelectOptionType.Option,
        disabled: true,
      });
    }

    const menuProps = {
      ...defaultMenu(superstate.ui, allOptions),
      searchable: true,
    };

    superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      menuProps,
      windowFromDocument(e.view.document)
    );
  };

  return (
    <div
      className="mk-frame-editor-button-submenu"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      style={{ padding: "12px" }}
    >
      <div className="mk-frame-editor-button-config">
        <div className="mk-frame-editor-button-section">
          <div className="mk-frame-editor-button-label">{propLabel}</div>
          <div
            className="mk-cell-option-item"
            onClick={showActionSelectMenu}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {(() => {
              if (selectedAction) {
                // Try to find command name
                const cmd = availableCommands.find(
                  (c) => c.path === selectedAction
                );
                if (cmd) {
                  return cmd.schema.name || cmd.schema.id;
                }

                return selectedAction;
              }
              return "Select action...";
            })()}
            <div
              className="mk-cell-option-select mk-icon-xxsmall mk-icon-rotated"
              dangerouslySetInnerHTML={{
                __html: superstate.ui.getSticker("ui//collapse-solid"),
              }}
            />
          </div>
        </div>

        {/* Show parameter inputs based on selected command */}
        {selectedCommand &&
          selectedCommand.fields &&
          selectedCommand.fields.length > 0 && (
            <div className="mk-frame-editor-button-params">
              {selectedCommand.fields.map((field, index) => (
                <div key={index} className="mk-frame-editor-button-param">
                  <DataPropertyView
                    superstate={superstate}
                    initialValue={getInitialValue(parameterValues[field.name], {
                      name: field.name,
                      type: field.type || "text",
                      value: field.value || "",
                      hidden: "false",
                      primary: "false",
                    })}
                    column={{
                      name: field.name,
                      type: field.type || "text",
                      value: field.value || "",
                      hidden: "false",
                      primary: "false",
                    }}
                    editMode={CellEditMode.EditModeActive}
                    updateValue={(newValue) => {
                      updateParameterValue(field.name, newValue);
                    }}
                    compactMode={false}
                    source={path}
                  />
                </div>
              ))}
            </div>
          )}

        {/* Handle special space actions */}
        {selectedAction &&
          selectedAction.startsWith("spaces://$api/") &&
          !selectedCommand && (
            <>
              <div className="mk-frame-editor-button-params">
                {selectedAction === "spaces://$api/path/#;open" && (
                  <div className="mk-frame-editor-button-param">
                    <DataPropertyView
                      superstate={superstate}
                      initialValue={getInitialValue(
                        parameterValues.path || actionParams.path,
                        {
                          name: "Path",
                          type: "link",
                          value: "",
                          hidden: "false",
                          primary: "false",
                        }
                      )}
                      column={{
                        name: "Path",
                        type: "link",
                        value: "",
                        hidden: "false",
                        primary: "false",
                      }}
                      editMode={CellEditMode.EditModeActive}
                      updateValue={(newValue) => {
                        const newParams = { ...actionParams, path: newValue };
                        setParameterValues({
                          ...parameterValues,
                          path: newValue,
                        });
                        updateAction(selectedAction, newParams);
                      }}
                      compactMode={false}
                      source={path}
                    />
                  </div>
                )}
                {selectedAction === "spaces://$api/path/#;create" && (
                  <>
                    <div className="mk-frame-editor-button-param">
                      <DataPropertyView
                        superstate={superstate}
                        initialValue={getInitialValue(
                          parameterValues.name || actionParams.name,
                          {
                            name: "Name",
                            type: "text",
                            value: "",
                            hidden: "false",
                            primary: "false",
                          }
                        )}
                        column={{
                          name: "Name",
                          type: "text",
                          value: "",
                          hidden: "false",
                          primary: "false",
                        }}
                        editMode={CellEditMode.EditModeActive}
                        updateValue={(newValue) => {
                          const newParams = { ...actionParams, name: newValue };
                          setParameterValues({
                            ...parameterValues,
                            name: newValue,
                          });
                          updateAction(selectedAction, newParams);
                        }}
                        compactMode={false}
                        source={path}
                      />
                    </div>
                    <div className="mk-frame-editor-button-param">
                      <DataPropertyView
                        superstate={superstate}
                        initialValue={getInitialValue(
                          parameterValues.space || actionParams.space,
                          {
                            name: "Space",
                            type: "space",
                            value: "",
                            hidden: "false",
                            primary: "false",
                          }
                        )}
                        column={{
                          name: "Space",
                          type: "space",
                          value: "",
                          hidden: "false",
                          primary: "false",
                        }}
                        editMode={CellEditMode.EditModeActive}
                        updateValue={(newValue) => {
                          const newParams = {
                            ...actionParams,
                            space: newValue,
                          };
                          setParameterValues({
                            ...parameterValues,
                            space: newValue,
                          });
                          updateAction(selectedAction, newParams);
                        }}
                        compactMode={false}
                        source={path}
                      />
                    </div>
                    <div className="mk-frame-editor-button-param">
                      <DataPropertyView
                        superstate={superstate}
                        initialValue={getInitialValue(
                          parameterValues.content || actionParams.content,
                          {
                            name: "Content",
                            type: "text",
                            value: "",
                            hidden: "false",
                            primary: "false",
                          }
                        )}
                        column={{
                          name: "Content",
                          type: "text",
                          value: "",
                          hidden: "false",
                          primary: "false",
                        }}
                        editMode={CellEditMode.EditModeActive}
                        updateValue={(newValue) => {
                          const newParams = {
                            ...actionParams,
                            content: newValue,
                          };
                          setParameterValues({
                            ...parameterValues,
                            content: newValue,
                          });
                          updateAction(selectedAction, newParams);
                        }}
                        compactMode={false}
                        source={path}
                      />
                    </div>
                  </>
                )}
                {selectedAction === "spaces://$api/path/#;setProperty" && (
                  <>
                    <div className="mk-frame-editor-button-param">
                      <DataPropertyView
                        superstate={superstate}
                        initialValue={getInitialValue(
                          parameterValues.path || actionParams.path,
                          {
                            name: "Path",
                            type: "link",
                            value: "",
                            hidden: "false",
                            primary: "false",
                          }
                        )}
                        column={{
                          name: "Path",
                          type: "link",
                          value: "",
                          hidden: "false",
                          primary: "false",
                        }}
                        editMode={CellEditMode.EditModeActive}
                        updateValue={(newValue) => {
                          const newParams = { ...actionParams, path: newValue };
                          setParameterValues({
                            ...parameterValues,
                            path: newValue,
                          });
                          updateAction(selectedAction, newParams);
                        }}
                        compactMode={false}
                        source={path}
                      />
                    </div>
                    <div className="mk-frame-editor-button-param">
                      <DataPropertyView
                        superstate={superstate}
                        initialValue={getInitialValue(
                          parameterValues.property || actionParams.property,
                          {
                            name: "Property",
                            type: "option",
                            value: JSON.stringify({ source: "$properties" }),
                            hidden: "false",
                            primary: "false",
                          }
                        )}
                        column={{
                          name: "Property",
                          type: "option",
                          value: JSON.stringify({ source: "$properties" }),
                          hidden: "false",
                          primary: "false",
                        }}
                        editMode={CellEditMode.EditModeActive}
                        updateValue={(newValue) => {
                          const newParams = {
                            ...actionParams,
                            property: newValue,
                          };
                          setParameterValues({
                            ...parameterValues,
                            property: newValue,
                          });
                          updateAction(selectedAction, newParams);
                        }}
                        compactMode={false}
                        source={path}
                      />
                    </div>
                    <div className="mk-frame-editor-button-param">
                      <DataPropertyView
                        superstate={superstate}
                        initialValue={getInitialValue(
                          parameterValues.value || actionParams.value,
                          {
                            name: "Value",
                            type: "text",
                            value: "",
                            hidden: "false",
                            primary: "false",
                          }
                        )}
                        column={{
                          name: "Value",
                          type: "text",
                          value: "",
                          hidden: "false",
                          primary: "false",
                        }}
                        editMode={CellEditMode.EditModeActive}
                        updateValue={(newValue) => {
                          const newParams = {
                            ...actionParams,
                            value: newValue,
                          };
                          setParameterValues({
                            ...parameterValues,
                            value: newValue,
                          });
                          updateAction(selectedAction, newParams);
                        }}
                        compactMode={false}
                        source={path}
                      />
                    </div>
                  </>
                )}
                {selectedAction === "spaces://$api/table/#;createModal" && (
                  <>
                    <div className="mk-frame-editor-button-param">
                      <DataPropertyView
                        superstate={superstate}
                        initialValue={getInitialValue(
                          parameterValues.space ||
                            actionParams.space ||
                            "$space",
                          {
                            name: "Space",
                            type: "space",
                            value: "",
                            hidden: "false",
                            primary: "false",
                          }
                        )}
                        column={{
                          name: "Space",
                          type: "space",
                          value: "",
                          hidden: "false",
                          primary: "false",
                        }}
                        editMode={CellEditMode.EditModeActive}
                        updateValue={(newValue) => {
                          const newParams = {
                            ...actionParams,
                            space: newValue,
                          };
                          setParameterValues({
                            ...parameterValues,
                            space: newValue,
                          });
                          updateAction(selectedAction, newParams);
                        }}
                        compactMode={false}
                        source={path}
                      />
                    </div>
                    <div className="mk-frame-editor-button-param">
                      <DataPropertyView
                        superstate={superstate}
                        initialValue={getInitialValue(
                          parameterValues.schema || actionParams.schema,
                          {
                            name: "Table",
                            type: "option",
                            value: JSON.stringify({
                              source: "$lists",
                              sourceField: "path",
                            }),
                            hidden: "false",
                            primary: "false",
                          }
                        )}
                        column={{
                          name: "Table",
                          type: "option",
                          value: JSON.stringify({
                            source: "$lists",
                            sourceField: "path",
                          }),
                          hidden: "false",
                          primary: "false",
                        }}
                        editMode={CellEditMode.EditModeActive}
                        updateValue={(newValue) => {
                          const newParams = {
                            ...actionParams,
                            schema: newValue,
                          };
                          setParameterValues({
                            ...parameterValues,
                            schema: newValue,
                          });
                          updateAction(selectedAction, newParams);
                        }}
                        compactMode={false}
                        source={path}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
      </div>
    </div>
  );
};
