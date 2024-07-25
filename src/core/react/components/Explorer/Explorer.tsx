import React, { useContext, useEffect, useMemo, useState } from "react";

import i18n from "core/i18n";

import { PathContext, PathProvider } from "core/react/context/PathContext";
import { SpaceProvider } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { Backlinks } from "makemd-core";
import { defaultContextSchemaID } from "schemas/mdb";
import { NoteView } from "../PathView/NoteView";
import { HeaderPropertiesView } from "../SpaceView/Contexts/SpaceEditor/HeaderPropertiesView";

export interface Loc {
  /**
   * @public
   */
  line: number;
  /**
   * @public
   */
  col: number;
  /**
   * @public
   */
  offset: number;
}

type ExplorerTreeNodeTypes =
  | "path"
  | "metadata"
  | "context"
  | "property"
  | "schema";
type ExplorerTreeNodeSubtypes =
  | "outlinks"
  | "inlinks"
  | "spaces"
  | "properties"
  | "flow"
  | "tables";
type ExplorerTreeNodeSubtypesMeta = {
  type: ExplorerTreeNodeSubtypes;
  label: string;
  sticker: string;
};

type ExplorerTreeNode = {
  id: string;
  parentId: string;
  parentPath?: string;
  type: ExplorerTreeNodeTypes;
  subType?: ExplorerTreeNodeSubtypes;
  path: string;
  index: number;
  label: string;
  depth: number;
  sticker: string;
  value: string;
  ctx?: any;
  children?: number;
  isLeafNode?: boolean;
};

const isLeafNode = (node: ExplorerTreeNode) => {
  if (
    node.type == "metadata" &&
    (node.subType == "properties" || node.subType == "flow")
  )
    return true;
  return false;
};

const childrenForNode = async (
  superstate: Superstate,
  node: ExplorerTreeNode,

  index: number,
  depth: number
): Promise<ExplorerTreeNode[]> => {
  let i = index;
  const items: ExplorerTreeNode[] = [];
  if (node.type == "path") {
    const metadataTypes: ExplorerTreeNodeSubtypesMeta[] = [];
    metadataTypes.push({
      type: "properties",
      label: i18n.labels.properties,
      sticker: "ui//note",
    });
    if (depth != 0) {
      metadataTypes.push({
        type: "flow",
        label: i18n.labels.content,
        sticker: "ui//note",
      });
    }
    metadataTypes.push(
      ...([
        {
          type: "spaces",
          label: i18n.labels.spaces,
          sticker: "ui//note",
        },
        {
          type: "inlinks",
          label: i18n.labels.backlinks,
          sticker: "ui//links-coming-in",
        },
        {
          type: "outlinks",
          label: i18n.labels.outgoingLinks,
          sticker: "ui//links-going-out",
        },
      ] as ExplorerTreeNodeSubtypesMeta[])
    );
    // if (isSpace) {
    //   metadataTypes.push({
    //     type: "tables",
    //     label: "Tables",
    //     sticker: "ui//table",
    //   });
    // }
    items.push(
      ...metadataTypes.map<ExplorerTreeNode>((f, k) => ({
        id: node.id + "/" + f.type,
        parentId: node.id,
        type: "metadata",
        subType: f.type,
        index: i + k,
        path: node.path,
        label: f.label,
        sticker: f.sticker,
        value: f.type,
        depth: depth,
        parentPath: node.parentPath,
      }))
    );
  } else if (node.type == "metadata") {
    if (node.subType == "tables") {
      const lists = await superstate.spaceManager
        .readAllTables(node.path)
        .then((f) => (f ? Object.values(f).map((g) => g.schema) : []));
      items.push(
        ...[
          ...lists.filter((f) => f.name != defaultContextSchemaID),
        ].map<ExplorerTreeNode>((f, k) => ({
          id: node.id + "/" + f.id,
          parentId: node.id,
          type: "schema",
          path: node.path,
          index: i + k,
          sticker: "",
          label: f.name,
          value: f.id,
          depth: depth,
          parentPath: node.path,
        }))
      );
    }

    let paths: string[] = [];
    if (node.subType == "inlinks") {
      paths = [...superstate.linksMap.getInverse(node.path)];
    } else if (node.subType == "outlinks") {
      paths = [...superstate.linksMap.get(node.path)];
    }
    items.push(
      ...paths
        .map((f) => superstate.pathsIndex.get(f))
        .filter((f) => f)
        .map<ExplorerTreeNode>((f, k) => ({
          id: node.id + "/" + node.value,
          parentId: node.id,
          type: "path",
          path: f.path,
          index: i + k,
          sticker: f.label.sticker,
          label: f.name,
          value: f.path,
          depth: depth,
          parentPath: node.path,
        }))
    );
  }
  i += items.length;

  return items;
};
const flattenTree = async (
  superstate: Superstate,
  node: ExplorerTreeNode,
  openNodes: string[],
  depth: number,
  index: number
): Promise<ExplorerTreeNode[]> => {
  const items: ExplorerTreeNode[] = [];
  let i = index;
  const leafNode = isLeafNode(node);
  if (!leafNode) {
    const children = await childrenForNode(superstate, node, i, depth);
    const newItems: ExplorerTreeNode[] = [];
    if (openNodes.some((f) => f == node.id)) {
      for (const f of children) {
        i = i + 1;
        const children = await flattenTree(
          superstate,
          f,
          openNodes,
          depth + 1,
          i
        );
        newItems.push(...children);
      }
    }
    if (node.type != "metadata" || children.length != 0)
      items.push({ ...node, children: children.length, isLeafNode: leafNode });

    items.push(...newItems);
  } else {
    items.push({ ...node, isLeafNode: leafNode });
  }
  return items;
};

export const Explorer = (props: { superstate: Superstate }) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const changeSelectedPath = (path: string) => {
    setSelectedPath(path);
  };
  useEffect(() => {
    props.superstate.ui.eventsDispatch.addListener(
      "activePathChanged",
      changeSelectedPath
    );

    return () => {
      props.superstate.ui.eventsDispatch.removeListener(
        "activePathChanged",
        changeSelectedPath
      );
    };
  }, []);
  const isSpace = props.superstate.spacesIndex.has(selectedPath);
  return (
    <PathProvider
      superstate={props.superstate}
      path={selectedPath}
      readMode={false}
    >
      {isSpace ? (
        <SpaceProvider superstate={props.superstate}>
          <ExplorerPathView superstate={props.superstate}></ExplorerPathView>
        </SpaceProvider>
      ) : (
        <ExplorerPathView superstate={props.superstate}></ExplorerPathView>
      )}
    </PathProvider>
  );
};

export const ExplorerPathView = (props: { superstate: Superstate }) => {
  const [openNodes, setOpenNodes] = useState<string[]>([]);
  const { pathState } = useContext(PathContext);
  useEffect(() => {
    pathState && setOpenNodes([pathState.path]);
  }, [pathState]);

  return (
    <div className="mk-path-explorer">
      <div className="mk-path-context-properties">
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="mk-path-context-title"
        >
          <div
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//list"),
            }}
          ></div>
          {i18n.labels.properties}
        </div>
        <HeaderPropertiesView
          superstate={props.superstate}
          collapseSpaces={false}
        ></HeaderPropertiesView>
      </div>
      <Backlinks
        superstate={props.superstate}
        path={pathState.path}
      ></Backlinks>
    </div>
  );
};

export const ExplorerFlowRow = (props: {
  path: string;
  superstate: Superstate;
  source: string;
}) => {
  const path = useMemo(() => {
    const spaceCache = props.superstate.spacesIndex.get(props.path);
    if (spaceCache) return spaceCache.space.notePath;
    return props.path;
  }, [props.path]);

  const [block, setBlock] = useState<[Loc, Loc]>([null, null]);
  const refreshBlock = (path: string) => {
    const fCache = props.superstate.pathsIndex.get(path);
    const link = [
      ...(fCache?.metadata.links ?? []),
      ...(fCache?.metadata.embeds ?? []),
    ].find((f) => props.source && props.source.includes(f.displayText));
    if (link) {
      const block = fCache.metadata.sections.find(
        (f: any) =>
          f.position.start.offset <= link.position.start.offset &&
          f.position.end.offset >= link.position.end.offset
      );
      if (!block) setBlock([null, null]);
      setBlock([block.position.start, block.position.end]);
    } else {
      if (fCache.metadata.frontmatterPosition) {
        setBlock([
          fCache.metadata.frontmatterPosition.end,
          fCache.metadata.sections.last().position.end,
        ]);
      } else {
        setBlock([
          fCache.metadata.sections.first().position.start,
          fCache.metadata.sections.last().position.end,
        ]);
      }
    }
  };

  useEffect(() => {
    refreshBlock(path);
  }, []);
  useEffect(() => {
    refreshBlock(path);
  }, [path]);

  return (
    <>
      <div className="mk-path-context-backlink">
        <NoteView
          load={true}
          superstate={props.superstate}
          path={path}
          properties={{
            from: block[0]?.line,
            to: block[1] ? block[1].line + 1 : null,
          }}
          classname="mk-path-context-flow"
        ></NoteView>
      </div>
    </>
  );
};
