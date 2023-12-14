import React, { useEffect, useMemo, useState } from "react";

import i18n from "core/i18n";

import { PathView } from "core/react/components/PathView/PathView";
import { Superstate } from "core/superstate/superstate";
import { FMSpaceKeys } from "core/superstate/utils/spaces";
import { FMMetadataKeys } from "core/types/space";
import { defaultContextSchemaID } from "schemas/mdb";
import { URI } from "../../../../types/path";
import { ContextPropertiesView } from "./ContextPropertiesView";
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

const childrenForNode = (
  superstate: Superstate,
  node: ExplorerTreeNode,

  index: number,
  depth: number
): ExplorerTreeNode[] => {
  let i = index;
  const items: ExplorerTreeNode[] = [];
  if (node.type == "path") {
    const metadataTypes: ExplorerTreeNodeSubtypesMeta[] = [];
    metadataTypes.push({
      type: "properties",
      label: i18n.labels.properties,
      sticker: "ui//mk-ui-note",
    });
    if (depth != 0) {
      metadataTypes.push({
        type: "flow",
        label: i18n.labels.content,
        sticker: "ui//mk-ui-note",
      });
    }
    metadataTypes.push(
      ...([
        {
          type: "spaces",
          label: i18n.labels.spaces,
          sticker: "ui//mk-ui-note",
        },
        {
          type: "inlinks",
          label: i18n.labels.backlinks,
          sticker: "lucide//links-coming-in",
        },
        {
          type: "outlinks",
          label: i18n.labels.outgoingLinks,
          sticker: "lucide//links-going-out",
        },
      ] as ExplorerTreeNodeSubtypesMeta[])
    );
    // if (isSpace) {
    //   metadataTypes.push({
    //     type: "tables",
    //     label: "Tables",
    //     sticker: "lucide//table",
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
      items.push(
        ...[
          ...(superstate.contextsIndex.get(node.path)?.schemas ?? []).filter(
            (f) => f.name != defaultContextSchemaID
          ),
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
const flattenTree = (
  superstate: Superstate,
  node: ExplorerTreeNode,
  openNodes: string[],
  depth: number,
  index: number
): ExplorerTreeNode[] => {
  const items: ExplorerTreeNode[] = [];
  let i = index;
  const leafNode = isLeafNode(node);
  if (!leafNode) {
    const children = childrenForNode(superstate, node, i, depth);
    const newItems: ExplorerTreeNode[] = [];
    if (openNodes.some((f) => f == node.id)) {
      children.forEach((f) => {
        i = i + 1;
        newItems.push(...flattenTree(superstate, f, openNodes, depth + 1, i));
      });
    }
    if (node.type != "metadata" || children.length != 0)
      items.push({ ...node, children: children.length, isLeafNode: leafNode });

    items.push(...newItems);
  } else {
    items.push({ ...node, isLeafNode: leafNode });
  }
  return items;
};

export const PathContextView = (props: { superstate: Superstate }) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedRoot, setSelectedRoot] = useState<URI | null>(null);
  const [openNodes, setOpenNodes] = useState<string[]>([]);
  const [filters, setFilters] = useState<string[]>([]);
  const rootCache = useMemo(
    () => props.superstate.pathsIndex.get(selectedPath),
    [selectedRoot]
  );
  const flattenedTree = useMemo(
    () =>
      rootCache
        ? flattenTree(
            props.superstate,
            {
              id: rootCache.path,
              parentId: null,
              type: "path",
              path: rootCache.path,
              index: 0,
              depth: 0,
              sticker: rootCache.label.sticker,
              label: rootCache.name,
              value: rootCache.path,
            },
            openNodes,
            0,
            0
          )
        : [],
    [rootCache, openNodes]
  );
  useEffect(() => {
    rootCache && setOpenNodes([rootCache.path]);
  }, [rootCache]);
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

  return (
    <div className="mk-path-context">
      {rootCache ? (
        <>
          {flattenedTree.map((f, i) => (
            <div
              key={f.id}
              className="mk-tree-wrapper"
              style={{ marginLeft: f.depth * 8 }}
            >
              {!f.isLeafNode ? (
                <button
                  className={`mk-collapse mk-inline-button mk-icon-xsmall ${
                    !openNodes.some((g) => g == f.id) ? "mk-collapsed" : ""
                  }`}
                  dangerouslySetInnerHTML={{
                    __html:
                      props.superstate.ui.getSticker("ui//mk-ui-collapse"),
                  }}
                  onClick={() =>
                    setOpenNodes((p) =>
                      p.some((g) => g == f.id)
                        ? p.filter((o) => o != f.id)
                        : [...p, f.id]
                    )
                  }
                ></button>
              ) : (
                <div
                  className={`mk-collapse mk-inline-button mk-icon-xsmall`}
                ></div>
              )}
              {f.type == "metadata" ? (
                f.subType == "flow" ? (
                  <ExplorerFlowRow
                    path={f.path}
                    source={f.parentPath}
                    superstate={props.superstate}
                  ></ExplorerFlowRow>
                ) : f.subType == "properties" ? (
                  <ExplorerContextRow
                    superstate={props.superstate}
                    node={f}
                  ></ExplorerContextRow>
                ) : (
                  <div className="mk-path-context-row">
                    <div className="mk-path-context-field">
                      <div
                        className="mk-path-context-field-icon"
                        dangerouslySetInnerHTML={{
                          __html: props.superstate.ui.getSticker(f.sticker),
                        }}
                      ></div>
                      <div className="mk-path-context-field-key">{f.label}</div>
                    </div>
                  </div>
                )
              ) : (
                <div className="mk-path-context-row">
                  <div className="mk-path-context-field">
                    <div
                      className="mk-path-context-field-icon"
                      dangerouslySetInnerHTML={{
                        __html: props.superstate.ui.getSticker(f.sticker),
                      }}
                    ></div>
                    <div className="mk-path-context-field-key">{f.label}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      ) : (
        <></>
      )}
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
    if (spaceCache) return spaceCache.space.defPath;
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
        <PathView
          superstate={props.superstate}
          load={true}
          path={path}
          properties={{
            from: block[0]?.line,
            to: block[1] ? block[1].line + 1 : null,
          }}
          classname="mk-path-context-flow"
        ></PathView>
      </div>
    </>
  );
};

export const ExplorerContextRow = (props: {
  superstate: Superstate;
  node: ExplorerTreeNode;
}) => {
  const { node, superstate } = props;
  const [spaceCache, setSpaceCache] = useState(
    superstate.spacesIndex.get(node.path)
  );
  const spaces = [...superstate.spacesMap.get(node.path)];

  return (
    <ContextPropertiesView
      superstate={props.superstate}
      spacePaths={spaces}
      path={node.path}
      showMetadata={true}
      hiddenFields={[
        ...FMMetadataKeys(superstate.settings),
        ...FMSpaceKeys(superstate.settings),
      ]}
      editable={true}
    />
  );
};
