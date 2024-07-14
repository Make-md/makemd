import React, { useContext, useMemo, useState } from "react";

import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "core/superstate/superstate";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { filterFnTypes } from "core/utils/contexts/predicate/filterFns/filterFnTypes";
import { ensureArray } from "core/utils/strings";
import { SelectOption } from "makemd-core";
import { DBRow } from "types/mdb";
import { FrameEditorMode, FrameTreeProp } from "types/mframe";
import { URI } from "types/path";
import { uniq } from "utils/array";
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
  selectedIndex: string;
  setSelectedIndex: (index: string) => void;
  groupURI: URI;
  itemURI: URI;
}) => {
  const { editSection, selectedIndex, setSelectedIndex, groupURI, itemURI } =
    props;
  const { readMode } = useContext(PathContext);
  const { spaceInfo } = useContext(SpaceContext);
  const {
    predicate,
    filteredData: data,
    editMode,
    sortedColumns,
    contextTable,
    cols,
    dbSchema,
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
      ...(
        parseFieldValue(groupBy.value, groupBy.type, props.superstate)
          ?.options ?? []
      ).map((f: SelectOption) => f.value),
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
    _path: spaceInfo?.path,
    _schema: dbSchema?.id,
    _key: primaryKey,
    _properties: visibleCols,
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
                ...context,
              },
              $properties: cols,
              [spaceInfo.path]: cols.reduce((a, b) => {
                return {
                  ...a,
                  [b.name]: c[b.name],
                };
              }, {}),
              ...Object.keys(contextTable).reduce<FrameTreeProp>((d, e) => {
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
                ...context,
              },

              $properties: cols,
              [spaceInfo.path]: cols.reduce((a, b) => {
                return {
                  ...a,
                  [b.name]: c[b.name],
                };
              }, {}),
            },
          };
        }, {});
  }, [data, cols, contextTable]);

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
                _selectedIndex: selectedIndex,
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
                      return (
                        <ContextListInstance
                          key={"listGroup" + i + "_listItem" + j}
                          id={
                            spaceInfo.path + "listGroup" + i + "_listItem" + j
                          }
                          type="listItem"
                          uri={itemURI}
                          superstate={props.superstate}
                          cols={[]}
                          props={{
                            _selectedIndex: selectedIndex,
                            _groupValue: c,
                            _groupField: groupBy?.name,
                            _readMode: readMode,
                            ...predicate.listItemProps,
                          }}
                          propSetters={{
                            _selectedIndex: setSelectedIndex,
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
