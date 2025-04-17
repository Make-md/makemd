import { useDndMonitor, useDraggable } from "@dnd-kit/core";
import { CollapseToggleSmall } from "core/react/components/UI/Toggles/CollapseToggleSmall";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { WindowContext } from "core/react/context/WindowContext";
import { replaceFrameWithFrameRoot } from "core/utils/frames/frame";
import { nameForField } from "core/utils/frames/frames";
import { initiateString } from "core/utils/strings";
import { SelectOption, Superstate, i18n } from "makemd-core";
import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { stickerForField } from "schemas/mdb";
import { FrameEditorMode } from "shared/types/frameExec";
import { SpaceProperty } from "shared/types/mdb";
import { FrameSchema, MDBFrame } from "shared/types/mframe";
import { windowFromDocument } from "shared/utils/dom";
import { mdbSchemaToFrameSchema } from "shared/utils/makemd/schema";
import { ToggleSetter } from "../../Frames/Setters/ToggleSetter";
import { ContextListSections } from "./ContextListView";

export const ContextListEditSelector = (props: {
  superstate: Superstate;
  editSection: ContextListSections;
  setEditSection: (section: ContextListSections) => void;
  setEditMode: (mode: FrameEditorMode) => void;
}) => {
  const { pathState } = useContext(PathContext);
  const { spaceInfo } = useContext(SpaceContext);
  const { predicate, savePredicate, sortedColumns } =
    useContext(ContextEditorContext);
  const selectFrame = (frameRef: string, type: ContextListSections) => {
    savePredicate({
      view: "frame",
      [type]: frameRef,
    });
  };
  const { frameSchemas, saveSchema } = useContext(FramesMDBContext);
  const listItems = useMemo(() => {
    const items: SelectOption[] = [];
    if (frameSchemas) {
      items.push(
        ...frameSchemas
          .filter((f) => f.type == "frame" && f.def?.type == "listItem")
          .map((f) => ({
            name: f.name,
            value: `${spaceInfo.path}/#*${f.id}`,
          }))
      );
    }
    items.push(
      ...props.superstate.selectedKit.frames
        .filter((f) => mdbSchemaToFrameSchema(f.schema).def?.type == "listItem")
        .map((f) => ({
          name: f.schema.name,
          value: `spaces://$kit/#*${mdbSchemaToFrameSchema(f.schema).def.id}`,
        }))
    );
    return items;
  }, []);
  const selectFrameMenu = (e: React.MouseEvent, frame: ContextListSections) => {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: true,
        value: [],
        options: [
          ...frameSchemas
            .filter((f) => f.type == "frame" && f.def?.type == frame)
            .map((f) => ({
              name: f.name,
              value: `${spaceInfo.path}/#*${f.id}`,
            })),
          ...props.superstate.selectedKit.frames
            .filter((f) => mdbSchemaToFrameSchema(f.schema).def?.type == frame)
            .map((f) => ({
              name: f.schema.name,
              icon: "ui//package-plus",
              value: `spaces://$kit/#*${
                mdbSchemaToFrameSchema(f.schema).def.id
              }`,
            })),
        ],
        saveOptions: (_: string[], value: string[], isNew: boolean) => {
          selectFrame(value[0], frame);
        },
        placeholder: i18n.hintText.createListItem,
        detail: true,
        searchable: false,
        showAll: true,
      },
      windowFromDocument(e.view.document)
    );
  };
  const newSchema = async (schema: FrameSchema, type: ContextListSections) => {
    selectFrame(`${spaceInfo.path}/#*${schema.id}`, type);
    await saveSchema(schema);
    return schema;
  };

  const addListItemToKit = async () => {
    const path = props.superstate.spaceManager.uriByString(predicate.listItem);
    if (path.authority == "$kit") {
      props.superstate.ui.notify("Already in Kit");
      return;
    }
    const mdbFrame = (await props.superstate.spaceManager.readFrame(
      path.basePath,
      path.ref
    )) as MDBFrame;

    props.superstate.spaceManager.saveFrameKit(
      mdbFrame,
      props.superstate.settings.selectedKit
    );
  };
  const editItem = (type: ContextListSections) => {
    const listItem = initiateString(predicate[type], "spaces://$kit/#*" + type);
    const uri = props.superstate.spaceManager.uriByString(listItem);
    if (uri.authority == "$kit") {
      const kit = props.superstate.kit.find((g) => g.def.id == uri.ref);
      newSchema(
        { name: kit.def.id, type: "frame", id: kit.def.id, def: kit.def },
        type
      ).then(async (f) => {
        await replaceFrameWithFrameRoot(props.superstate, spaceInfo, f.id, kit);
        selectFrame(`./#*${f.id}`, type);
      });
    } else {
      selectFrame(listItem, type);
    }
    props.setEditSection(type);
  };
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    startTransition(() => {
      setLoaded(true);
    });
  }, []);
  return predicate ? (
    <div className="mk-editor-context-selector">
      <div className="mk-editor-context-groups">
        <div className="mk-editor-context-group">
          <ToggleSetter
            superstate={props.superstate}
            name={i18n.editor.rows}
            icon={"ui//rows"}
            value={predicate.listGroup}
            defaultValue={"spaces://$kit/#*listGroup"}
            onValue={"spaces://$kit/#*listGroup"}
            setValue={(value) => {
              savePredicate({
                view: "list",
                listView: "spaces://$kit/#*listView",
                listGroup: "spaces://$kit/#*listGroup",
              });
            }}
          ></ToggleSetter>
          <ToggleSetter
            superstate={props.superstate}
            name={i18n.editor.columns}
            icon={"ui//columns"}
            value={predicate.listGroup}
            defaultValue={"spaces://$kit/#*columnGroup"}
            onValue={"spaces://$kit/#*columnGroup"}
            setValue={(value) => {
              savePredicate({
                view: "list",
                listView: "spaces://$kit/#*columnView",
                listGroup: "spaces://$kit/#*columnGroup",
              });
            }}
          ></ToggleSetter>
          <ToggleSetter
            superstate={props.superstate}
            name={i18n.editor.catalog}
            icon={"ui//gallery-horizontal-end"}
            value={predicate.listGroup}
            defaultValue={"spaces://$kit/#*rowGroup"}
            onValue={"spaces://$kit/#*rowGroup"}
            setValue={(value) => {
              savePredicate({
                view: "list",
                listView: "spaces://$kit/#*listView",
                listGroup: "spaces://$kit/#*rowGroup",
              });
            }}
          ></ToggleSetter>
          <ToggleSetter
            superstate={props.superstate}
            name={i18n.editor.grid}
            icon={"ui//layout-grid"}
            value={predicate.listGroup}
            defaultValue={"spaces://$kit/#*gridGroup"}
            onValue={"spaces://$kit/#*gridGroup"}
            setValue={(value) => {
              savePredicate({
                view: "list",
                listView: "spaces://$kit/#*listView",
                listGroup: "spaces://$kit/#*gridGroup",
              });
            }}
          ></ToggleSetter>
          <button
            onClick={(e) => {
              editItem("listGroup");
            }}
            aria-label={i18n.buttons.customize}
            className="mk-icon-xsmall mk-button-new"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//brush"),
            }}
            style={{ height: "20px", padding: "8px" }}
          ></button>
        </div>
        <div className="mk-editor-context-group">
          <div
            className="mk-editor-context-group-select"
            onClick={(e) => {
              selectFrameMenu(e, "listItem");
              e.stopPropagation();
            }}
          >
            {listItems.find((f) => f.value == predicate.listItem)?.name ??
              i18n.labels.select}
            <CollapseToggleSmall
              superstate={props.superstate}
              collapsed={false}
              onToggle={(c, e) => {
                selectFrameMenu(e, "listItem");
                e.stopPropagation();
              }}
            ></CollapseToggleSmall>
          </div>
          <button
            onClick={(e) => {
              editItem("listItem");
            }}
            aria-label={i18n.buttons.customize}
            className="mk-icon-xsmall mk-button-new"
            style={{ height: "20px", padding: "8px" }}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//brush"),
            }}
          ></button>
          <button
            onClick={(e) => {
              addListItemToKit();
            }}
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//package-plus"),
            }}
            style={{ height: "20px", padding: "8px" }}
          ></button>
        </div>
        <span></span>
        <div
          className="mk-editor-frame-node-button-primary"
          onClick={(e) => {
            props.setEditMode(FrameEditorMode.Read);
            e.stopPropagation();
          }}
        >
          {i18n.labels.done}
        </div>
      </div>
      {props.editSection == "listItem" && (
        <div className="mk-editor-context-properties">
          <div style={{ display: "flex" }}>
            {i18n.labels.properties}
            <div
              aria-label={i18n.hintText.dragDropProperties}
              className={`mk-icon-xsmall`}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//help-circle"),
              }}
            ></div>
          </div>
          <div>
            {sortedColumns.map((f, i) => (
              <PropertyField
                contexts={[pathState.path]}
                path={pathState.path}
                key={i}
                superstate={props.superstate}
                property={f}
                draggable={true}
              ></PropertyField>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : null;
};
export const PropertyField = (props: {
  superstate: Superstate;
  property: SpaceProperty;
  path: string;
  contexts?: string[];
  onClick?: (e: React.MouseEvent) => void;
  draggable?: boolean;
}) => {
  const { uid } = useContext(PathContext);
  const primaryContext = props.contexts?.[0];
  const id = `${uid}_props_${primaryContext ?? ""}${props.property.name}`;
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
  } = useDraggable({
    id: id,
    data: {
      id: id,
      name: props.property.name,
      property: props.property,
      context: primaryContext ?? "",
      path: props.path,
      type: "property",
    },
    // disabled: !props.draggable,
  });
  const { setDragNode } = useContext(WindowContext);
  useDndMonitor({
    onDragStart: (e) => {
      if (e.active.data.current.id == id)
        setDragNode(
          <div
            className="mk-path-context-field"
            onClick={(e) => (props.onClick ? props.onClick(e) : null)}
          >
            <div
              className="mk-path-context-field-icon"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker(
                  stickerForField(props.property)
                ),
              }}
            ></div>
            <div className="mk-path-context-field-key">
              {nameForField(props.property)}
            </div>
          </div>
        );
    },
  });
  return (
    <div
      ref={setDraggableNodeRef}
      className="mk-path-context-field"
      onClick={(e) => (props.onClick ? props.onClick(e) : null)}
      {...attributes}
      {...listeners}
    >
      <div
        className="mk-path-context-field-icon"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker(
            stickerForField(props.property)
          ),
        }}
      ></div>
      {props.contexts?.length > 0 && (
        <div
          className="mk-path-context-field-space"
          dangerouslySetInnerHTML={{
            __html:
              props.contexts.length == 1
                ? props.superstate.ui.getSticker(
                    props.superstate.pathsIndex.get(props.contexts[0])?.label
                      ?.sticker
                  )
                : props.contexts.length,
          }}
        ></div>
      )}
      <div className="mk-path-context-field-key">
        {nameForField(props.property)}
      </div>
    </div>
  );
};
