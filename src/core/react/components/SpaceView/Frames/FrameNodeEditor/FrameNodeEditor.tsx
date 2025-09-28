import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { showNewFrameMenu } from "core/react/components/UI/Menus/frames/newFrameMenu";
import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { useSpaceManager } from "core/react/context/SpaceManagerContext";
import { newPathInSpace } from "core/superstate/utils/spaces";
import { removeQuotes, wrapQuotes } from "core/utils/strings";
import {
  createNewVisualizationFrame as createNewVisFrame,
  parseVisualizationData,
} from "core/utils/visualization/visualizationUtils";
import { SelectOption, Superstate, i18n } from "makemd-core";
import { flowNode } from "schemas/kits/base";
import {
  FrameEditorMode,
  FrameNodeState,
  FrameRunInstance,
} from "shared/types/frameExec";
import { SpaceProperty } from "shared/types/mdb";
import { MenuObject } from "shared/types/menu";
import { FrameNode, MDBFrame } from "shared/types/mframe";
import { windowFromDocument } from "shared/utils/dom";
import { mdbSchemaToFrameSchema } from "shared/utils/makemd/schema";
import { ColorSetter } from "../Setters/ColorSetter";
import { ToggleSetter } from "../Setters/ToggleSetter";
import { HoverSubmenuProps } from "./Submenus/HoverSubmenuProps";
import { InteractionSubmenu } from "./Submenus/InteractionSubmenu";
import { LayoutSubmenu } from "./Submenus/LayoutSubmenu";
import { ModeSubmenu } from "./Submenus/ModeSubmenu";
import { PropertiesSubmenu } from "./Submenus/PropertiesSubmenu";
import { SizingSubmenu } from "./Submenus/SizingSubmenu";
import { StyleSubmenu } from "./Submenus/StyleSubmenu";
import { TabsSubmenu } from "./Submenus/TabsSubmenu";
import { TextSubmenu } from "./Submenus/TextSubmenu";

export enum FrameNodeEditMode {
  EditModeNone,
  EditModeDefault,
  EditModeContent,
  EditModeText,
  EditModeLayout,
  EditModeStyle,
  EditModeSizing,
  EditModeInteraction,
  EditModeVisualization,
}

export enum HoverEditMode {
  EditModeDefault,
  EditModeContent,
  EditModeText,
  EditModeShadow,
  EditModeOutline,
}

export const FrameNodeEditor = (props: {
  superstate: Superstate;
  state: FrameNodeState;
  fields: SpaceProperty[];
  node: FrameNode;
  instance: FrameRunInstance;
  editLayout: (state: boolean) => void;
  deleteFrame?: () => void;
  duplicateFrame?: () => void;
}) => {
  const { pathState } = useContext(PathContext);
  const { deleteFrame, duplicateFrame } = props;
  const { spaceInfo } = useContext(SpaceContext);
  const spaceManager = useSpaceManager() || props.superstate.spaceManager;
  const {
    addNode,
    ungroupNode,
    updateNode,
    saveNodes,
    frameProperties,
    nodes,
  } = useContext(FramesEditorRootContext);
  const { selectionMode, select } = useContext(FrameSelectionContext);
  const { instance } = useContext(FrameInstanceContext);
  const [visualizationConfig, setVisualizationConfig] = useState<any>(null);
  const [visualizationFrame, setVisualizationFrame] = useState<MDBFrame | null>(
    null
  );
  const [needsNewVisualization, setNeedsNewVisualization] = useState(false);
  const [availableTables, setAvailableTables] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedTableColumns, setSelectedTableColumns] = useState<string[]>(
    []
  );
  const node = useMemo(() => {
    return nodes.find((f) => f.id == props.node.id);
  }, [nodes, props.node]);
  const fields = useMemo(() => {
    if (!node || !node.types) return [];
    return Object.keys(node.types).map((f) => ({
      type: node.types[f],
      name: f,
      attrs: node.propsAttrs?.[f],
      schemaId: node.schemaId,
      value: node.propsValue?.[f],
    }));
  }, [node]);
  const saveNodeValue = useCallback(
    (values: { [key: string]: string }, node: FrameNode) => {
      updateNode(node, {
        props: {
          ...values,
        },
      });
    },
    [updateNode]
  );
  const saveStyleValue = (prop: string, value: string) => {
    updateNode(node, {
      styles: {
        [prop]: value,
      },
    });
  };
  const [editMode, setEditMode] = useState(FrameNodeEditMode.EditModeNone);
  const [frameProps, setFrameProps] = useState(node?.props || {});
  const [visualizationInSubmenu, setVisualizationInSubmenu] = useState(false);

  useEffect(() => {
    if (node) {
      setFrameProps(node.props || {});
    }
  }, [node]);

  // Load visualization frame data
  const loadVisualizationData = useCallback(async () => {
    if (node?.type === "visualization" && props.state?.props?.value) {
      try {
        const frameId = removeQuotes(props.state.props.value);
        const sourcePath = pathState?.path || spaceInfo?.path || "";

        if (frameId && sourcePath && spaceManager) {
          try {
            const frame = await spaceManager.readFrame(sourcePath, frameId);

            if (frame && frame.schema?.id === frameId) {
              setVisualizationFrame(frame);
              setNeedsNewVisualization(false);

              // Parse visualization data using utility function
              const config = parseVisualizationData(frame);
              setVisualizationConfig(config);
            } else {
              // Frame doesn't exist - need to create new visualization
              setNeedsNewVisualization(true);
              setVisualizationFrame(null);
              setVisualizationConfig(null);
            }
          } catch (error) {
            // Assume frame doesn't exist
            setNeedsNewVisualization(true);
            setVisualizationFrame(null);
            setVisualizationConfig(null);
          }
        }
      } catch (error) {
        setNeedsNewVisualization(true);
        setVisualizationFrame(null);
        setVisualizationConfig(null);
      }
    } else {
      setVisualizationConfig(null);
      setVisualizationFrame(null);
      setNeedsNewVisualization(false);
    }
  }, [
    node?.type,
    props.state?.props?.value,
    pathState?.path,
    spaceInfo?.path,
    props.superstate,
    setVisualizationConfig,
    setVisualizationFrame,
    setNeedsNewVisualization,
  ]);

  useEffect(() => {
    loadVisualizationData();
  }, [loadVisualizationData]);

  // Load available tables from the space
  useEffect(() => {
    const loadAvailableTables = async () => {
      const sourcePath = pathState?.path || spaceInfo?.path || "";

      if (sourcePath && spaceManager) {
        try {
          // Use tablesForSpace to get available tables
          const tables = await spaceManager.tablesForSpace(sourcePath);

          if (tables) {
            // Map to the expected format
            const formattedTables = tables.map((table) => ({
              id: table.id,
              name: table.name || table.id,
            }));

            setAvailableTables(formattedTables);
          }
        } catch (error) {}
      }
    };

    if (node?.type === "visualization") {
      loadAvailableTables();
    }
  }, [node?.type, pathState?.path, spaceInfo?.path, props.superstate]);

  // Load columns for the selected table
  useEffect(() => {
    const loadTableColumns = async () => {
      // Get listId from config or schema
      const frameSchema = visualizationFrame
        ? mdbSchemaToFrameSchema(visualizationFrame.schema)
        : null;
      const listId = visualizationConfig?.data?.listId || frameSchema?.def?.db;

      if (listId && spaceManager) {
        const sourcePath = pathState?.path || spaceInfo?.path || "";
        try {
          const table = await spaceManager.readTable(sourcePath, listId);
          if (table && table.cols) {
            const columns = table.cols.map((col) => col.name || col.type);
            setSelectedTableColumns(columns);
          } else {
            setSelectedTableColumns([]);
          }
        } catch (error) {
          setSelectedTableColumns([]);
        }
      } else {
        setSelectedTableColumns([]);
      }
    };

    loadTableColumns();
  }, [
    visualizationConfig?.data?.listId,
    visualizationFrame,
    pathState?.path,
    spaceInfo?.path,
    props.superstate,
  ]);

  const savePropValue = useCallback(
    (prop: string, value: string) => {
      setFrameProps((p) => ({ ...p, [prop]: value }));
      saveNodeValue({ [prop]: value }, node);
    },
    [setFrameProps, saveNodeValue, node]
  );

  // Create new visualization frame
  const createNewVisualizationFrame = useCallback(async () => {
    if (!props.superstate.spaceManager) {
      return;
    }

    try {
      const sourcePath = pathState?.path || spaceInfo?.path || "";
      const frameId = removeQuotes(props.state?.props?.value || "");

      if (!frameId || !sourcePath) {
        return;
      }

      // Create new visualization frame using utility function
      const newFrame = createNewVisFrame(frameId);
      const defaultConfig = parseVisualizationData(newFrame);

      // First save the frame schema
      await spaceManager.saveFrameSchema(sourcePath, frameId, () => ({
        id: frameId,
        name: "vis",
        type: "frame",
        def: JSON.stringify({
          type: "view",
          id: "main",
          db: "",
        }),
      }));

      // Then save the frame data
      await spaceManager.saveFrame(sourcePath, newFrame);

      // Update the node's value to reference the new frame
      const wrappedFrameId = wrapQuotes(frameId);
      saveNodeValue({ value: wrappedFrameId }, node);

      // Update state
      setVisualizationFrame(newFrame);
      setVisualizationConfig(defaultConfig);
      setNeedsNewVisualization(false);

      // Force reload the visualization data after a delay to ensure indexing is complete
      setTimeout(() => {
        loadVisualizationData();
      }, 500);
    } catch (error) {}
  }, [
    props.state?.props?.value,
    pathState?.path,
    spaceInfo?.path,
    props.superstate,
    saveNodeValue,
    node,
    loadVisualizationData,
  ]);

  const typographyOptions = [
    {
      type: "h1",
      name: i18n.commands.h1,
      icon: "ui//heading-1",
      sem: "h1",
    },
    {
      type: "h2",
      name: i18n.commands.h2,
      icon: "ui//heading-2",
      sem: "h2",
    },
    {
      type: "h3",
      name: i18n.commands.h3,
      icon: "ui//heading-3",
      sem: "h3",
    },
    {
      type: "h4",
      name: i18n.commands.h4,
      icon: "ui//heading-4",
      sem: "h4",
    },
    {
      type: "h5",
      name: i18n.commands.h5,
      icon: "ui//heading-5",
      sem: "h5",
    },
    {
      type: "h6",
      name: i18n.commands.h6,
      icon: "ui//heading-6",
      sem: "h6",
    },
    {
      type: "p",
      name: i18n.commands.paragraph,
      icon: "ui//type",
      sem: "p",
    },
    {
      type: "a",
      name: i18n.labels.link,
      icon: "ui//link",
      sem: "a",
    },
    {
      type: "caption",
      name: i18n.labels.caption,
      icon: "ui//subtitles",
      sem: "caption",
    },
  ];
  const showTypographyMenu = (e: React.MouseEvent) => {
    const menuOptions: SelectOption[] = [];
    typographyOptions.forEach((f) => {
      menuOptions.push({
        name: f.name,
        icon: f.icon,
        onClick: () => {
          saveStyleValue("sem", `'${f.sem}'`);
        },
      });
    });

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };

  const showGroupStyleMenu = (e: React.MouseEvent) => {
    const styleOptions: SelectOption[] = [
      {
        name: "None",
        icon: "lucide//square",
        onClick: () => {
          saveStyleValue("sem", "");
        },
      },
      {
        name: "Card",
        icon: "lucide//credit-card",
        onClick: () => {
          saveStyleValue("sem", "'card'");
        },
      },
      {
        name: "Button",
        icon: "ui//mouse-pointer-click",
        onClick: () => {
          saveStyleValue("sem", "'button'");
        },
      },
    ];

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, styleOptions),
      windowFromDocument(e.view.document)
    );
  };

  const propertiesRef = useRef<MenuObject>(null);
  const tabsRef = useRef<MenuObject>(null);

  const submenuProps: HoverSubmenuProps = {
    superstate: props.superstate,
    exitMenu: (e) => {
      e.stopPropagation();
      props.editLayout(false);
      setEditMode(FrameNodeEditMode.EditModeNone);
    },
    saveStyleValue: saveStyleValue,
    savePropValue: savePropValue,
    frameProps: frameProps,
    selectedNode: node,
    setHoverMenu: setEditMode,
    fields: fields,
    state: props.state,
    updateNode: updateNode,
    instance: instance,
    pathState: pathState,
  };

  const propertiesProps = {
    ...submenuProps,
    pathState: pathState,
    frameProperties: frameProperties,
    instance: instance,
  };

  useEffect(() => {
    if (propertiesRef.current) {
      propertiesRef.current.update(propertiesProps);
    }
  }, [instance, fields, props.state, node, frameProps]);
  const ref = useRef<HTMLDivElement>(null);

  if (!node) {
    return null;
  }

  return (
    <div
      className="mk-editor-frame-node-selector"
      style={{ pointerEvents: "auto" }}
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
      }}
    >
      {node.type == "new" && (
        <>
          <div
            className="mk-editor-frame-node-button"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
            onClick={(e) => {
              showNewFrameMenu(
                (e.target as HTMLElement).getBoundingClientRect(),
                windowFromDocument(e.view.document),
                props.superstate,
                spaceInfo,
                (newNode: FrameNode) =>
                  saveNodes([
                    {
                      ...newNode,
                      id: node.id,
                      parentId: node.parentId,
                      schemaId: node.schemaId,
                      rank: node.rank,
                      props: {
                        ...newNode.props,
                        value: node.props?.value,
                      },
                    },
                  ])
              );
              e.stopPropagation();
            }}
          ></div>
          <div
            className="mk-editor-frame-node-button"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
            onClick={(e) => {
              const _space = props.superstate.spacesIndex.get(spaceInfo.path);

              if (_space) {
                newPathInSpace(
                  props.superstate,
                  _space,
                  "md",
                  props.state?.props?.value,
                  true
                ).then((newPath) =>
                  saveNodes([
                    {
                      ...node,
                      type: flowNode.node.type,
                      props: {
                        ...node.props,
                        value: wrapQuotes(newPath),
                      },
                    },
                  ])
                );
              }
              e.stopPropagation();
            }}
          ></div>
        </>
      )}
      {editMode == FrameNodeEditMode.EditModeNone ? (
        <>
          {node.type == "group" || node.type == "content" ? (
            <>
              <div
                aria-label="Add Frame"
                className="mk-editor-frame-node-button"
                onClick={(e) => {
                  showNewFrameMenu(
                    (e.target as HTMLElement).getBoundingClientRect(),
                    windowFromDocument(e.view.document),
                    props.superstate,
                    spaceInfo,
                    (newNode: FrameNode) =>
                      addNode(newNode, node, true).then((f) =>
                        selectionMode == FrameEditorMode.Page
                          ? {}
                          : select(f.id)
                      )
                  );
                  e.stopPropagation();
                }}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//plus"),
                }}
              ></div>
              <div
                aria-label={i18n.labels.layout}
                className="mk-editor-frame-node-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditMode(FrameNodeEditMode.EditModeLayout);
                }}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//layout"),
                }}
              ></div>
              {node.type == "group" && (
                <>
                  <div className="mk-divider"></div>
                  <div
                    className="mk-editor-frame-node-button"
                    aria-label="Group Style"
                    onClick={(e) => showGroupStyleMenu(e)}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: props.superstate.ui.getSticker(
                          removeQuotes(node.styles?.["sem"]) === "card"
                            ? "lucide//credit-card"
                            : removeQuotes(node.styles?.["sem"]) === "button"
                            ? "ui//mouse-pointer-click"
                            : "lucide//square"
                        ),
                      }}
                    ></div>
                    <span>
                      {removeQuotes(node.styles?.["sem"]) === "card"
                        ? "Card"
                        : removeQuotes(node.styles?.["sem"]) === "button"
                        ? "Button"
                        : "None"}
                    </span>
                  </div>
                </>
              )}
            </>
          ) : node.ref == "spaces://$kit/#*tabs" ? (
            <div
              aria-label="Manage Tabs"
              className="mk-editor-frame-node-button"
              onClick={(e) => {
                if (tabsRef.current) {
                  tabsRef.current.hide();
                  tabsRef.current = null;
                  return;
                }
                e.preventDefault();
                tabsRef.current = props.superstate.ui.openCustomMenu(
                  ref.current.getBoundingClientRect(),
                  <TabsSubmenu
                    superstate={props.superstate}
                    node={node}
                    state={props.state}
                    path={pathState.path}
                    updateNode={updateNode}
                  ></TabsSubmenu>,
                  {
                    superstate: props.superstate,
                    node: node,
                    state: props.state,
                    path: pathState.path,
                    updateNode,
                  },
                  windowFromDocument(e.view.document),
                  "bottom"
                );
              }}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//tabs"),
              }}
            ></div>
          ) : node.type == "visualization" && props.state?.props?.value ? (
            needsNewVisualization ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 8px",
                }}
              >
                <span>No visualization found</span>
                <div
                  className="mk-editor-frame-node-button"
                  onClick={createNewVisualizationFrame}
                  aria-label="Create Visualization"
                >
                  <span>Create New</span>
                </div>
              </div>
            ) : (
              <></>
            )
          ) : (
            fields.length > 0 &&
            node.type !== "visualization" && (
              <div
                aria-label={i18n.labels.properties}
                className="mk-editor-frame-node-button"
                onClick={(e) => {
                  if (propertiesRef.current) {
                    propertiesRef.current.hide();
                    propertiesRef.current = null;
                    return;
                  }
                  e.preventDefault();
                  propertiesRef.current = props.superstate.ui.openCustomMenu(
                    ref.current.getBoundingClientRect(),
                    <PropertiesSubmenu
                      {...propertiesProps}
                    ></PropertiesSubmenu>,
                    propertiesProps,
                    windowFromDocument(e.view.document),
                    "bottom"
                  );
                }}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//list"),
                }}
              ></div>
            )
          )}
          {!visualizationInSubmenu && (
            <>
              {node.type == "text" && (
                <>
                  <div
                    className="mk-editor-frame-node-button"
                    onClick={(e) => showTypographyMenu(e)}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: props.superstate.ui.getSticker(
                          typographyOptions.find(
                            (f) => f.sem == removeQuotes(node.styles?.["sem"])
                          )?.icon ?? "ui//type"
                        ),
                      }}
                    ></div>
                    {typographyOptions.find(
                      (f) => f.sem == removeQuotes(node.styles?.["sem"])
                    )?.name ?? "Paragraph"}
                  </div>
                  <div className="mk-divider"></div>
                </>
              )}
              {node.type == "icon" && (
                <ColorSetter
                  superstate={props.superstate}
                  value={removeQuotes(node.styles?.["color"])}
                  setValue={(value) => saveStyleValue("color", `'${value}'`)}
                ></ColorSetter>
              )}
              <div className="mk-divider"></div>
              <div
                aria-label="Sizing"
                className="mk-editor-frame-node-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  props.editLayout(true);
                  setEditMode(FrameNodeEditMode.EditModeSizing);
                }}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//scaling"),
                }}
              ></div>
              <div
                aria-label={i18n.labels.style}
                className={`mk-editor-frame-node-button`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditMode(FrameNodeEditMode.EditModeStyle);
                }}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//paintbrush"),
                }}
              ></div>
              {(node.type === "group" || node.type === "text") && (
                <div
                  aria-label="Interactions"
                  className={`mk-editor-frame-node-button`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditMode(FrameNodeEditMode.EditModeInteraction);
                  }}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//zap"),
                  }}
                ></div>
              )}
              {(node.type == "flow" ||
                node.type == "space" ||
                node.type == "vis") && (
                <ModeSubmenu {...submenuProps}></ModeSubmenu>
              )}

              {node.type !== "visualization" && (
                <div
                  aria-label={i18n.labels.textStyle}
                  className={`mk-editor-frame-node-button`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditMode(FrameNodeEditMode.EditModeText);
                  }}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//type"),
                  }}
                ></div>
              )}

              {selectionMode == FrameEditorMode.Page && (
                <>
                  <div className="mk-divider"></div>
                  <ToggleSetter
                    superstate={props.superstate}
                    name={"Page Width"}
                    setValue={(value: string) => {
                      // Check if parent is a column type node
                      const parentNode = nodes?.find(
                        (n) => n.id === node.parentId
                      );

                      if (parentNode && parentNode.type === "column") {
                        // Find the container parent of the column
                        const containerNode = nodes?.find(
                          (n) =>
                            n.id === parentNode.parentId &&
                            n.type === "container"
                        );

                        if (containerNode) {
                          // Apply style to the container node instead
                          updateNode(containerNode, {
                            styles: {
                              ["--max-width"]: value,
                            },
                          });
                          return;
                        }
                      }
                      // Default behavior - apply to current node
                      saveStyleValue("--max-width", value);
                    }}
                    defaultValue={""}
                    onValue={wrapQuotes("100%")}
                    value={(() => {
                      // Check if we should show the container's value instead
                      const parentNode = nodes?.find(
                        (n) => n.id === node.parentId
                      );
                      if (parentNode && parentNode.type === "column") {
                        const containerNode = nodes?.find(
                          (n) =>
                            n.id === parentNode.parentId &&
                            n.type === "container"
                        );
                        if (containerNode) {
                          return containerNode.styles?.["--max-width"];
                        }
                      }
                      return node.styles?.["--max-width"];
                    })()}
                    icon={"ui//full-width"}
                  ></ToggleSetter>
                </>
              )}

              <div className="mk-divider"></div>

              {/* {(
            props.duplicateFrame && (
              <div
                className="mk-editor-frame-node-button"
                aria-label={i18n.labels.duplicate}
                onClick={() => duplicateFrame()}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//copy"),
                }}
              ></div>
            )
          )} */}

              <div
                className="mk-editor-frame-node-button"
                aria-label={i18n.labels.delete}
                onClick={() => deleteFrame()}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//trash"),
                }}
              ></div>
            </>
          )}
        </>
      ) : (
        <>
          {editMode == FrameNodeEditMode.EditModeText ? (
            <TextSubmenu {...(submenuProps as any)}></TextSubmenu>
          ) : editMode == FrameNodeEditMode.EditModeLayout ? (
            <LayoutSubmenu {...submenuProps}></LayoutSubmenu>
          ) : editMode == FrameNodeEditMode.EditModeSizing ? (
            <SizingSubmenu {...submenuProps}></SizingSubmenu>
          ) : editMode == FrameNodeEditMode.EditModeStyle ? (
            <StyleSubmenu {...submenuProps}></StyleSubmenu>
          ) : editMode == FrameNodeEditMode.EditModeInteraction ? (
            <InteractionSubmenu {...submenuProps}></InteractionSubmenu>
          ) : (
            <></>
          )}
        </>
      )}
    </div>
  );
};
