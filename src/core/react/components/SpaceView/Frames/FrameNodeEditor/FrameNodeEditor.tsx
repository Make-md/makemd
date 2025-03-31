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
import { newPathInSpace } from "core/superstate/utils/spaces";
import { removeQuotes, wrapQuotes } from "core/utils/strings";
import { SelectOption, Superstate, i18n } from "makemd-core";
import { flowNode } from "schemas/kits/base";
import { FrameEditorMode, FrameNodeState } from "shared/types/frameExec";
import { SpaceProperty } from "shared/types/mdb";
import { MenuObject } from "shared/types/menu";
import { FrameNode } from "shared/types/mframe";
import { windowFromDocument } from "shared/utils/dom";
import { ColorSetter } from "../Setters/ColorSetter";
import { ToggleSetter } from "../Setters/ToggleSetter";
import { ContentSubmenu } from "./Submenus/ContentSubmenu";
import { HoverSubmenuProps } from "./Submenus/HoverSubmenuProps";
import { LayoutSubmenu } from "./Submenus/LayoutSubmenu";
import { ModeSubmenu } from "./Submenus/ModeSubmenu";
import { PropertiesSubmenu } from "./Submenus/PropertiesSubmenu";
import { StyleSubmenu } from "./Submenus/StyleSubmenu";
import { TextSubmenu } from "./Submenus/TextSubmenu";

export enum FrameNodeEditMode {
  EditModeNone,
  EditModeDefault,
  EditModeContent,
  EditModeText,
  EditModeLayout,
  EditModeStyle,
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
  editLayout: (state: boolean) => void;
  deleteFrame?: () => void;
  duplicateFrame?: () => void;
}) => {
  const { pathState } = useContext(PathContext);
  const { deleteFrame, duplicateFrame } = props;
  const { spaceInfo } = useContext(SpaceContext);
  const { addNode, ungroupNode, updateNode, saveNodes, frameProperties } =
    useContext(FramesEditorRootContext);
  const { selectionMode } = useContext(FrameSelectionContext);
  const { instance } = useContext(FrameInstanceContext);
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
    updateNode(props.node, {
      styles: {
        [prop]: value,
      },
    });
  };
  const [editMode, setEditMode] = useState(FrameNodeEditMode.EditModeNone);
  const [frameProps, setFrameProps] = useState(props.node.props);

  const fields = useMemo(() => {
    return Object.keys(props.node.types).map((f) => ({
      type: props.node.types[f],
      name: f,
      attrs: props.node.propsAttrs?.[f],
      schemaId: props.node.schemaId,
      value: props.node.propsValue?.[f],
    }));
  }, [props.node]);

  useEffect(() => {
    setFrameProps(props.node.props);
  }, [props.node]);

  const savePropValue = useCallback(
    (prop: string, value: string) => {
      setFrameProps((p) => ({ ...p, [prop]: value }));
      saveNodeValue({ [prop]: value }, props.node);
    },
    [setFrameProps, saveNodeValue, props.node]
  );

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

  const propertiesRef = useRef<MenuObject>(null);

  const submenuProps: HoverSubmenuProps = {
    superstate: props.superstate,
    exitMenu: () => setEditMode(0),
    saveStyleValue: saveStyleValue,
    savePropValue: savePropValue,
    frameProps: frameProps,
    selectedNode: props.node,
    setHoverMenu: setEditMode,
    fields: fields,
    state: props.state,
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
  }, [instance, fields, props.state, props.node, frameProps]);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      className="mk-editor-frame-node-selector"
      style={{ pointerEvents: "auto" }}
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
      }}
    >
      {props.node.type == "new" && (
        <>
          <div
            className="mk-editor-frame-node-button-primary"
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
                      id: props.node.id,
                      parentId: props.node.parentId,
                      schemaId: props.node.schemaId,
                      rank: props.node.rank,
                      props: {
                        ...newNode.props,
                        value: props.node.props?.value,
                      },
                    },
                  ])
              );
              e.stopPropagation();
            }}
          ></div>
          <div
            className="mk-editor-frame-node-button-primary"
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
                      ...props.node,
                      type: flowNode.node.type,
                      props: {
                        ...props.node.props,
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
          {props.node.type == "group" || props.node.type == "content" ? (
            <ContentSubmenu {...submenuProps}></ContentSubmenu>
          ) : (
            fields.length > 0 && (
              <div
                aria-label="Properties"
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
          {props.node.type == "text" && (
            <>
              <div
                className="mk-editor-frame-node-button"
                onClick={(e) => showTypographyMenu(e)}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(
                      typographyOptions.find(
                        (f) => f.sem == removeQuotes(props.node.styles?.["sem"])
                      )?.icon ?? "ui//type"
                    ),
                  }}
                ></div>
                {typographyOptions.find(
                  (f) => f.sem == removeQuotes(props.node.styles?.["sem"])
                )?.name ?? "Paragraph"}
              </div>
              <div className="mk-divider"></div>
            </>
          )}
          {props.node.type == "icon" && (
            <ColorSetter
              superstate={props.superstate}
              value={removeQuotes(props.node.styles?.["color"])}
              setValue={(value) => saveStyleValue("color", `'${value}'`)}
            ></ColorSetter>
          )}
          <div
            aria-label="Layout"
            className="mk-editor-frame-node-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.editLayout(true);
              setEditMode(FrameNodeEditMode.EditModeLayout);
            }}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//scaling"),
            }}
          ></div>
          <div
            aria-label="Style"
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
          {(props.node.type == "flow" || props.node.type == "space") && (
            <ModeSubmenu {...submenuProps}></ModeSubmenu>
          )}

          <div
            aria-label="Text Style"
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

          {selectionMode == FrameEditorMode.Page && (
            <>
              <div className="mk-divider"></div>
              <ToggleSetter
                superstate={props.superstate}
                name={"Page Width"}
                setValue={(value: string) => {
                  saveStyleValue("--max-width", value);
                }}
                defaultValue={""}
                onValue={wrapQuotes("100%")}
                value={props.node.styles?.["--max-width"]}
                icon={"ui//full-width"}
              ></ToggleSetter>
            </>
          )}

          <div className="mk-divider"></div>
          {props.node.type == "group" || props.node.type == "container" ? (
            <div
              aria-label="Ungroup"
              className="mk-editor-frame-node-button"
              onClick={() => ungroupNode(props.node)}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//copy-x"),
              }}
            ></div>
          ) : (
            <></>
          )}

          {/* {(
            props.duplicateFrame && (
              <div
                className="mk-editor-frame-node-button"
                aria-label="Duplicate"
                onClick={() => duplicateFrame()}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//copy"),
                }}
              ></div>
            )
          )} */}

          <div
            className="mk-editor-frame-node-button"
            aria-label="Delete"
            onClick={() => deleteFrame()}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//trash"),
            }}
          ></div>
        </>
      ) : (
        <>
          <div
            className="mk-editor-frame-node-button"
            onMouseDown={(e) => {
              e.stopPropagation();
              props.editLayout(false);
              setEditMode(FrameNodeEditMode.EditModeNone);
            }}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//close"),
            }}
          ></div>
          <div className="mk-editor-frame-node-divider"></div>
          {editMode == FrameNodeEditMode.EditModeText ? (
            <TextSubmenu {...submenuProps}></TextSubmenu>
          ) : editMode == FrameNodeEditMode.EditModeLayout ? (
            <LayoutSubmenu {...submenuProps}></LayoutSubmenu>
          ) : editMode == FrameNodeEditMode.EditModeStyle ? (
            <StyleSubmenu {...submenuProps}></StyleSubmenu>
          ) : (
            <></>
          )}
        </>
      )}
    </div>
  );
};
