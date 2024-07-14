import {
  defaultMenu,
  menuInput,
} from "core/react/components/UI/Menus/menu/SelectionMenu";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { removeQuotes, wrapQuotes } from "core/utils/strings";
import { SelectOption, Superstate, i18n } from "makemd-core";
import React, { useContext, useEffect, useState } from "react";
import { slideNode, slidesNode } from "schemas/kits/slides";
import { SpaceProperty } from "types/mdb";
import { FrameNode } from "types/mframe";
import { uniqueNameFromString } from "utils/array";
import { windowFromDocument } from "utils/dom";
export const FrameSlidesEditor = (props: {
  superstate: Superstate;
  node: FrameNode;

  saveNodeValue: (values: { [key: string]: string }, node: FrameNode) => void;
  fields: SpaceProperty[];
}) => {
  const {
    nodes,
    setSelectedSlide,
    selectedSlide,
    root,
    addNode,

    frameProperties,
  } = useContext(FramesEditorRootContext);

  const [selectedProperty, setSelectedProperty] = useState<SpaceProperty>(null);
  const selectedSlideNode = nodes.find((f) => f.id == selectedSlide);
  const selectedSlideParent = selectedProperty
    ? nodes.find(
        (f) =>
          f.type == "slides" &&
          f.parentId == props.node.schemaId &&
          selectedProperty.name == removeQuotes(f.props?.value)
      )
    : nodes.find((f) => f.id == selectedSlideNode?.parentId);
  const selectedNode =
    selectedSlideParent?.parentId == props.node.schemaId
      ? nodes.find((f) => f.id == selectedSlideParent?.parentId)
      : null;

  useEffect(() => {
    if (!selectedNode || !selectedSlideParent) return null;
    const f = removeQuotes(selectedSlideParent.props?.value);
    setSelectedProperty((p) =>
      !p
        ? {
            type: selectedNode.types[f],
            name: f,
            attrs: selectedNode.propsAttrs?.[f],
            schemaId: selectedNode.schemaId,
            value: selectedNode.propsValue?.[f],
          }
        : p
    );
  }, [selectedNode, selectedSlideParent]);
  const showPropsMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const menuOptions: SelectOption[] = [];

    frameProperties
      // .filter((f) => f.type == field.type)
      .forEach((f) => {
        menuOptions.push({
          name: f.name,
          icon: "ui//type",
          onClick: () => {
            setSelectedProperty(f);
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

  return (
    <div
      className="mk-frame-slides-editor"
      style={{ pointerEvents: "auto" }}
      onClick={(e) => e.stopPropagation()}
    >
      {selectedProperty ? (
        <FrameSlideGroup
          superstate={props.superstate}
          node={root.node}
          showPropsMenu={showPropsMenu}
          property={selectedProperty}
          nodes={nodes.filter((f) => f.parentId == selectedSlideParent?.id)}
          slideGroup={selectedSlideParent}
          addNode={addNode}
          saveNodeValue={props.saveNodeValue}
          setSelectedSlide={setSelectedSlide}
        ></FrameSlideGroup>
      ) : (
        <div onClick={(e) => showPropsMenu(e)}>Select</div>
      )}
    </div>
  );
};

export const FrameSlideGroup = (props: {
  superstate: Superstate;
  nodes: FrameNode[];
  node: FrameNode;
  property: SpaceProperty;
  slideGroup: FrameNode;
  saveNodeValue: (values: { [key: string]: string }, node: FrameNode) => void;
  showPropsMenu: (e: React.MouseEvent) => void;
  addNode: (
    node: FrameNode,
    parent: FrameNode,
    before: boolean
  ) => Promise<FrameNode>;
  setSelectedSlide: (id: string) => void;
}) => {
  const { selectedSlide, deleteNode, saveNodes, nodes } = useContext(
    FramesEditorRootContext
  );
  const savePropValue = (key: string, value: string) =>
    props.saveNodeValue({ [key]: value }, props.node);
  const saveSlide = async (value: string) => {
    const newNodes = [];
    let slideGroupId = props.slideGroup?.id;
    if (!props.slideGroup) {
      slideGroupId = uniqueNameFromString(
        slidesNode.node.name,
        nodes.map((f) => f.id)
      );
      const newSlideGroup = {
        ...slidesNode.node,
        id: slideGroupId,
        schemaId: props.node.schemaId,
        parentId: props.node.id,
        props: {
          value: wrapQuotes(props.property.name),
        },
      };
      newNodes.push(newSlideGroup);
    }
    const slideId = uniqueNameFromString(
      slideNode.node.name,
      nodes.map((f) => f.id)
    );
    newNodes.push({
      ...slideNode.node,
      id: slideId,
      schemaId: props.node.schemaId,
      parentId: slideGroupId,
      props: {
        value: wrapQuotes(value),
      },
    });
    await saveNodes(newNodes);
    props.setSelectedSlide(slideId);
  };
  return (
    <div className="mk-frame-slides">
      {/* <div
        className="mk-mark-option"
        onClick={(e) => showPropsMenu(e, props.property)}
      >
        <div
          aria-label={"Select Property"}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//props"),
          }}
        ></div>
      </div> */}
      <div onClick={(e) => props.showPropsMenu(e)}>{props.property.name}</div>
      {props.nodes.map((g, i) => (
        <FrameSlide
          key={i}
          superstate={props.superstate}
          slideNode={g}
          active={selectedSlide == g.id}
          setSelectedSlide={props.setSelectedSlide}
        />
      ))}
      <button
        className="mk-frame-slide-add"
        onClick={async (e) => {
          const menuOptions: SelectOption[] = [];
          menuOptions.push(menuInput("", (value) => saveSlide(value)));

          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            offset,
            defaultMenu(props.superstate.ui, menuOptions),
            windowFromDocument(e.view.document)
          );
          e.stopPropagation();
        }}
      >
        +
      </button>
    </div>
  );
};

export const FrameSlide = (props: {
  superstate: Superstate;
  slideNode: FrameNode;
  active: boolean;
  setSelectedSlide: (id: string) => void;
}) => {
  const { deleteNode } = useContext(FramesEditorRootContext);
  return (
    <div
      onContextMenu={(e) => {
        const menuOptions: SelectOption[] = [];

        menuOptions.push({
          name: i18n.menu.delete,
          icon: "ui//close",
          onClick: (e) => {
            deleteNode(props.slideNode);
          },
        });
        const offset = (e.target as HTMLElement).getBoundingClientRect();
        props.superstate.ui.openMenu(
          offset,
          defaultMenu(props.superstate.ui, menuOptions),
          windowFromDocument(e.view.document)
        );
      }}
      onClick={(e) =>
        props.active
          ? props.setSelectedSlide(null)
          : props.setSelectedSlide(props.slideNode.id)
      }
      className={props.active ? "mk-frame-slide-active" : "mk-frame-slide"}
    >
      <span>{props.slideNode?.name}</span>
      <span></span>
    </div>
  );
};
