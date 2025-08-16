import React, { useContext, useMemo, useState } from "react";

import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "makemd-core";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { filterFnTypes } from "core/utils/contexts/predicate/filterFns/filterFnTypes";
import { ensureArray, tagSpacePathFromTag } from "core/utils/strings";
import { SelectOption } from "makemd-core";
import { defaultContextSchemaID } from "shared/schemas/context";
import { FrameEditorMode } from "shared/types/frameExec";
import { DBRow } from "shared/types/mdb";
import { ActionProp, FrameTreeProp } from "shared/types/mframe";
import { URI } from "shared/types/path";
import { Pos, Rect } from "shared/types/Pos";
import { uniq } from "shared/utils/array";
import { ContextInfiniteScroll } from "./ContextInfiniteScroll";
import { ContextListInstance } from "./ContextListInstance";
import { FrameContainerView } from "./FrameContainerView";
export const PLACEHOLDER_ID = "_placeholder";
type Items = Record<string, DBRow[]>;
export type ContextListSections = "listItem" | "listGroup" | "listView";
export const ContextListView = (props: {
  superstate: Superstate;
  containerRef: React.RefObject<HTMLDivElement>;
  editSection: ContextListSections;
  selectedIndexes: string[];
  setSelectedIndexes: (index: string[]) => void;
  groupURI: URI;
  itemURI: URI;
  flattenedItems: React.MutableRefObject<Record<string, [string, DBRow, Pos]>>;
}) => {
  const {
    editSection,
    selectedIndexes,
    setSelectedIndexes,
    groupURI,
    itemURI,
    flattenedItems,
  } = props;
  const { readMode } = useContext(PathContext);
  const { spaceInfo, spaceState } = useContext(SpaceContext);
  const {
    predicate,
    filteredData: data,
    editMode,
    sortedColumns,
    contextTable,
    cols,
    dbSchema,
    source,
  } = useContext(ContextEditorContext);

  const [pageId, setPageId] = useState(1);
  const pageLength = 25;
  const { instance } = useContext(FrameInstanceContext);

  const groupBy =
    predicate?.groupBy?.length > 0
      ? cols.find((f) => f.name + f.table == predicate.groupBy[0])
      : null;

  const groupByOptions = useMemo(() => {
    const groupByOptions =
      instance?.state[instance?.root?.id].props?.groupOptions;
    if (groupByOptions) return ensureArray(groupByOptions);
    if (!groupBy) return [""];
    const options: string[] = uniq([
      "",
      ...(parseFieldValue(groupBy.value, groupBy.type)?.options ?? []).map(
        (f: SelectOption) => f.value
      ),
      ...data.reduce(
        (p, c) => [...p, c[groupBy.name + groupBy.table] ?? ""],
        []
      ),
    ]) as string[];
    return options;
  }, [groupBy, data, instance]);

  const groupByFilter = useMemo(() => {
    const filter = instance?.state[instance?.root?.id].props?.groupFilter;
    return filterFnTypes[filter] ?? filterFnTypes.is;
  }, [instance]);

  const items: Items = useMemo(() => {
    return groupByOptions.reduce(
      (p, c) => {
        const [acc, count] = p;
        if (!groupBy) {
          return [
            c == ""
              ? {
                  ...acc,
                  [c]: data.map((f, i) => ({ ...f, _pageId: count + i })) ?? [],
                }
              : {
                  ...acc,
                  [c]: [],
                },
            count + data.length,
          ];
        }
        const newItems = data.filter((r) => {
          // if (groupBy.type == "file") {
          //   return groupByFilter.fn(
          //     pathToString(r[groupBy.name + groupBy.table]),
          //     c
          //   );
          // }
          return groupByFilter.fn(r[groupBy.name + groupBy.table], c);
        });
        return [
          newItems.length > 0
            ? {
                ...acc,
                [c]: newItems.map((f, i) => ({
                  ...f,
                  _pageId: count + i,
                })),
              }
            : {
                ...acc,
                [c]: [],
              },
          count + newItems.length,
        ];
      },
      [{}, 0]
    )[0];
  }, [data, groupByOptions, groupByFilter, groupBy]);

  const primaryKey = useMemo(() => {
    return cols.find((f) => f.primary == "true")?.name;
  }, [cols]);
  const visibleCols = useMemo(() => {
    return sortedColumns.filter((f) => !predicate?.colsHidden.includes(f.name));
  }, [predicate, sortedColumns]);
  const context = {
    _path: source,
    _schema: dbSchema?.id,
    _isContext: dbSchema?.id == defaultContextSchemaID,
    _key: primaryKey,
    _properties: visibleCols,
  };

  const listItemActions: ActionProp = {
    select: (e, value, state, saveState, api) => {
      setSelectedIndexes([state.$contexts?.$context["_index"]]);
    },
    open: (e, value, state, saveState, api) => {
      api.table.open(
        state.$contexts?.$context["_path"],
        state.$contexts?.$context["_schema"],
        state.$contexts?.$context["_index"],
        false
      );
    },
    contextMenu: (e, value, state, saveState, api) => {
      e.preventDefault?.();
      api.table.contextMenu(
        e,
        state.$contexts?.$context["_path"],
        state.$contexts?.$context["_schema"],
        state.$contexts?.$context["_index"]
      );
    },
  };

  const contextMap: { [key: string]: FrameTreeProp } = useMemo(() => {
    if (!dbSchema) return {};
    return dbSchema?.primary == "true"
      ? data.reduce<{ [key: string]: FrameTreeProp }>((p, c) => {
          return {
            ...p,
            [c["_index"]]: {
              $context: {
                _index: c["_index"],
                _keyValue: c[primaryKey],
                _schema: dbSchema.id,
                _name: props.superstate.pathsIndex.get(c[primaryKey])?.name,
                _values: c,
                ...context,
              },
              $properties: cols,
              [source]: cols.reduce((a, b) => {
                return {
                  ...a,
                  [b.name]: c[b.name],
                };
              }, {}),
              ...Object.keys(contextTable)
                .filter((f) =>
                  spaceState.contexts.some((g) => tagSpacePathFromTag(g) == f)
                )
                .reduce<FrameTreeProp>((d, e) => {
                  return {
                    ...d,
                    [e]: contextTable[e].cols.reduce((a, b) => {
                      return {
                        ...a,
                        [b.name]: c[b.name + e],
                      };
                    }, {}),
                  };
                }, {}),
            },
          };
        }, {})
      : data.reduce<{ [key: string]: FrameTreeProp }>((p, c) => {
          return {
            ...p,
            [c["_index"]]: {
              $context: {
                _index: c["_index"],
                _keyValue: c[primaryKey],
                _schema: dbSchema.id,
                _name: c[primaryKey],
                _values: c,
                ...context,
              },

              $properties: cols,
              [source]: cols.reduce((a, b) => {
                return {
                  ...a,
                  [b.name]: c[b.name],
                };
              }, {}),
            },
          };
        }, {});
  }, [data, cols, source, contextTable, spaceState]);

  return (
    <FrameContainerView
      superstate={props.superstate}
      uri={groupURI}
      editMode={editSection == "listGroup" ? editMode : FrameEditorMode.Read}
      cols={[]}
    >
      <SortableContext
        items={Object.keys(items).map(
          (f, i) => spaceInfo.path + "listGroup" + i
        )}
        strategy={rectSortingStrategy}
      >
        {
          // groupBy ?
          Object.keys(items).map((c, i) => (
            <ContextListInstance
              key={"listGroup" + i}
              id={spaceInfo.path + "listGroup" + i}
              type="listGroup"
              superstate={props.superstate}
              uri={groupURI}
              props={{
                _selectedIndexes: selectedIndexes,
                _groupValue: c,
                _groupField: groupBy?.name,
                _groupType: groupBy?.type,
                _readMode: readMode,
                ...predicate.listGroupProps,
              }}
              propSetters={null}
              editMode={
                editSection == "listGroup" ? editMode : FrameEditorMode.Read
              }
              cols={[]}
              containerRef={props.containerRef}
              contexts={{ $context: context }}
            >
              <FrameContainerView
                uri={itemURI}
                superstate={props.superstate}
                cols={[]}
                editMode={
                  editSection == "listItem" ? editMode : FrameEditorMode.Read
                }
              >
                <SortableContext
                  items={items[c].flatMap(
                    (f, k) => spaceInfo.path + "listGroup" + i + "_listItem" + k
                  )}
                  strategy={rectSortingStrategy}
                >
                  {items[c]
                    .filter(
                      (f) => parseInt(f["_pageId"]) <= pageId * pageLength
                    )
                    .map((f, j) => {
                      if (parseInt(f["_pageId"]) == pageId * pageLength)
                        return (
                          <ContextInfiniteScroll
                            key={j}
                            onScroll={() => setPageId((p) => p + 1)}
                          ></ContextInfiniteScroll>
                        );
                      const id =
                        spaceInfo.path + "listGroup" + i + "_listItem" + j;
                      return (
                        <ContextListInstance
                          key={"listGroup" + i + "_listItem" + j}
                          id={id}
                          type="listItem"
                          uri={itemURI}
                          superstate={props.superstate}
                          propSetters={{}}
                          cols={[]}
                          props={{
                            _selectedIndexes: selectedIndexes,
                            _groupValue: c,
                            _groupField: groupBy?.name,
                            _readMode: readMode,
                            ...predicate.listItemProps,
                          }}
                          actions={listItemActions}
                          onLayout={(rect: Rect) => {
                            flattenedItems.current[f["_index"]] = [
                              f["_index"],
                              f,
                              {
                                x: rect.x,
                                y: rect.y,
                              },
                            ];
                          }}
                          containerRef={props.containerRef}
                          editMode={
                            editSection == "listItem"
                              ? editMode
                              : FrameEditorMode.Read
                          }
                          contexts={contextMap[f["_index"]]}
                        ></ContextListInstance>
                      );
                    })}
                </SortableContext>
              </FrameContainerView>
            </ContextListInstance>
          ))
        }
      </SortableContext>
    </FrameContainerView>
  );
};
