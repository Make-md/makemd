import { menuSection } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { newPathInSpace } from "core/superstate/utils/spaces";
import { createInlineTable } from "core/utils/contexts/inlineTable";
import { relinkProps } from "core/utils/frames/linker";
import { wrapQuotes } from "core/utils/strings";
import Fuse from "fuse.js";
import { SelectOption, i18n } from "makemd-core";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  contextNode,
  flowNode,
  groupNode,
  iconNode,
  imageNode,
  textNode,
} from "schemas/kits/base";
import {
  buttonNode,
  callout,
  circularProgressNode,
  dividerNode,
  progressNode,
  ratingNode,
  tabsNode,
  toggleNode,
} from "schemas/kits/ui";
import { Suggester } from "../SpaceCommand/Suggester";
import { FrameNodeViewProps } from "../ViewNodes/FrameView";
export const NewNodeView = (props: FrameNodeViewProps) => {
  const ref = React.createRef<HTMLInputElement>();
  const { spaceState } = useContext(SpaceContext);
  const {
    updateNode,
    nodes,
    deleteNode,
    addNode,
    saveNodes,
    lastCreatedId,
    setLastCreatedId,
  } = useContext(FramesEditorRootContext);
  const { selection, select } = useContext(FrameSelectionContext);
  const [type, setType] = useState("label");
  const { instance } = useContext(FrameInstanceContext);
  const spaces = [...props.superstate.allSpaces(true)]
    .filter((f) => f.type != "default")
    .map<SelectOption>((f) => ({
      name: f.name,
      value: f.path,
      icon: props.superstate.pathsIndex.get(f.path)?.label?.sticker,
      description:
        f.type == "tag" ? f.name : f.type == "folder" ? f.path : f.name,
    }));
  const paths = [...props.superstate.pathsIndex.values()]
    .filter((f) => !f.hidden)
    .filter((f) => f.type == "space" || f.subtype == "md")
    .map((f) => ({
      name: f.label.name,
      value: f.path,
      description: f.path,
      section: "flow",
      icon: f.label?.sticker,
    }));

  const fuseOptions = {
    minMatchCharLength: 1,
    threshold: 0,
    keys: ["name", "value"],
  };
  const [query, setQuery] = useState("");
  const suggestions: SelectOption[] = useMemo(() => {
    const menuOptions: SelectOption[] = [];

    const label = {
      name: i18n.frames.label.label,
      description: query,
      icon: "ui//baseline",
      section: "label",
      value: "",
    };
    menuOptions.push(label);
    const note = {
      name: i18n.frames.note.label,
      description: query,
      icon: "ui//file-text",
      value: "",
      section: "flow",
    };

    menuOptions.push(note);

    const kit: SelectOption[] = [
      {
        name: i18n.frames.table.label,
        description: i18n.frames.table.description,
        icon: "ui//table",
        section: "list",
        value: "",
      },
      ...[contextNode, dividerNode, iconNode, imageNode, groupNode].map(
        (f) => ({
          name: f.node.name,
          value: f,
          icon: f.def?.icon,
          section: "base",
          description: f.def?.description,
        })
      ),
      ...[
        buttonNode,
        ratingNode,
        callout,
        toggleNode,
        progressNode,
        circularProgressNode,
        tabsNode,
      ].map((f) => ({
        name: f.node.name,
        value: f,
        icon: f.def?.icon,
        section: "kit",
        description: f.def?.description,
      })),
    ];
    const fuse = new Fuse(kit, fuseOptions);
    const kitOptions =
      query.length == 0
        ? kit
        : fuse
            .search(query)
            .map((result) => result.item)
            .slice(0, 10);
    if (kitOptions.length > 0) {
      menuOptions.push(menuSection("Kit"));
    }
    menuOptions.push(...kitOptions);

    if (query.length > 0) {
      const fuse = new Fuse([...paths], fuseOptions);
      const options =
        query.length == 0
          ? []
          : fuse
              .search(query)
              .map((result) => result.item)
              .slice(0, 10);
      if (options.length > 0) menuOptions.push(menuSection("Paths"));
      menuOptions.push(...options);
    }

    return menuOptions;
  }, [query, type]);

  const selectOption = (option: SelectOption) => {
    if (!props.treeNode) {
      clear();
    }
    if (option.section == "kit" || option.section == "base") {
      if (props.treeNode) {
        let node = relinkProps(
          "$root",
          props.treeNode.node.schemaId,
          option.value.node,
          props.treeNode.node.schemaId
        );
        node = relinkProps(
          node.id,
          props.treeNode.node.id,
          node,
          props.treeNode.node.schemaId
        );

        saveNodes([
          {
            ...node,
            type: option.section == "base" ? node.type : "frame",
            styles: option.value.node.styles,
            ref:
              option.section == "base"
                ? ""
                : "spaces://$kit/#*" + option.value.def.id,
            parentId: props.treeNode.node.parentId,
            schemaId: props.treeNode.node.schemaId,
            id: props.treeNode.node.id,
            rank: props.treeNode.node.rank,
          },
        ]).then((f) => select(props.treeNode.id));
      } else {
        addNode(
          option.section == "base"
            ? option.value.node
            : {
                ...option.value.node,
                type: "frame",
                styles: option.value.node.styles,
                ref: "spaces://$kit/#*" + option.value.def.id,
              },
          instance.exec.node,
          true
        ).then((f) => select(f.id));
      }
    } else if (option.section == "label") {
      if (props.treeNode) {
        saveNodes([
          {
            ...props.treeNode.node,
            type: "text",
            name: textNode.node.name,
            props: {
              ...props.treeNode.node.props,
              value: wrapQuotes(query),
            },
            styles: textNode.node.styles,
          },
        ]).then((f) => select(props.treeNode.id));
      } else {
        addNode(
          {
            ...textNode.node,
            props: {
              value: wrapQuotes(query),
            },
          },
          instance.exec.node,
          true
        ).then((f) => select(f.id));
      }
    } else if (option.section == "flow") {
      if (option.value.length > 0) {
        if (props.treeNode) {
          saveNodes([
            {
              ...props.treeNode.node,
              type: "flow",
              name: flowNode.node.name,
              props: {
                ...props.treeNode.node.props,
                value: wrapQuotes(option.value),
              },
              styles: flowNode.node.styles,
            },
          ]);
        } else {
          addNode(
            {
              ...flowNode.node,
              props: {
                value: wrapQuotes(option.value),
              },
            },
            instance.exec.node,
            true
          );
        }
      } else {
        newPathInSpace(props.superstate, spaceState, "md", query, true).then(
          (f) => {
            if (props.treeNode) {
              saveNodes([
                {
                  ...props.treeNode.node,
                  name: flowNode.node.name,
                  type: "flow",
                  props: {
                    value: wrapQuotes(f),
                  },
                  styles: {
                    ...flowNode.node.styles,
                  },
                },
              ]);
            } else {
              addNode(
                {
                  ...flowNode.node,
                  props: {
                    value: wrapQuotes(f),
                  },
                },
                instance.exec.node,
                true
              );
            }
          }
        );
      }
    } else if (option.section == "list") {
      createInlineTable(props.superstate, spaceState.path).then((f) => {
        if (props.treeNode) {
          saveNodes([
            {
              ...props.treeNode.node,
              name: contextNode.node.name,
              type: "space",
              props: { value: wrapQuotes(`${spaceState.path}/#*${f}`) },
              styles: {
                ...contextNode.node.styles,
              },
            },
          ]);
        } else {
          addNode(
            {
              ...textNode.node,
              name: contextNode.node.name,
              type: "space",
              props: { value: wrapQuotes(`${spaceState.path}/#^${f}`) },
            },
            instance.exec.node,
            true
          );
        }
      });
    }
  };
  const clear = () => {
    setQuery("");
    ref.current.blur();
    ref.current.innerHTML = "";
  };
  useEffect(() => {
    if (
      ref.current &&
      lastCreatedId &&
      lastCreatedId == props.treeNode?.node.id
    ) {
      ref.current.focus();
      setLastCreatedId(null);
    }
  }, [ref, selection, props.treeNode]);
  return (
    <div className="mk-node-new">
      <Suggester
        superstate={props.superstate}
        placeholder={i18n.hintText.newFrame}
        suggestions={suggestions}
        onChange={(query) => setQuery(query)}
        onSelect={(option) => {
          selectOption(option);
        }}
        onFocus={() => {
          select(null);
        }}
        ref={ref}
        onDelete={() =>
          props.treeNode ? deleteNode(props.treeNode?.node) : clear()
        }
        onSelectSection={(option) => setType(option)}
      ></Suggester>
    </div>
  );
};
