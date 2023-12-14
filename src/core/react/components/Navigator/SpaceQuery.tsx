import i18n from "core/i18n";
import { showDatePickerMenu } from "core/react/components/UI/Menus/properties/datePickerMenu";
import { Superstate } from "core/superstate/superstate";
import { pathCacheMetadata, pathProperties } from "core/types/metadata";
import { SpaceDefFilter, SpaceDefGroup, SpaceDefType } from "core/types/space";
import { filterFnLabels } from "core/utils/contexts/predicate/filterFns/filterFnLabels";
import { filterFnTypes } from "core/utils/contexts/predicate/filterFns/filterFnTypes";
import { predicateFnsForType } from "core/utils/contexts/predicate/predicate";
import { allPropertiesForPaths } from "core/utils/properties/allProperties";
import { format } from "date-fns";
import React, { PropsWithChildren } from "react";
import { parseMultiString } from "utils/parsers";
import { pathNameToString } from "utils/path";
import { serializeMultiString } from "utils/serializers";
import { FilterValueSpan } from "../SpaceView/Contexts/FilterBar/FilterBar";
import { SelectOption, defaultMenu, menuInput } from "../UI/Menus/menu";

export const SpaceQuery = (props: {
  superstate: Superstate;
  filters: SpaceDefGroup[];
  setFilters: React.Dispatch<React.SetStateAction<SpaceDefGroup[]>>;
}) => {
  const { filters, setFilters } = props;
  const selectFilterValue = (
    e: React.MouseEvent,
    filter: SpaceDefFilter,
    i: number,
    k: number
  ) => {
    const saveFilterValue = (value: string) => {
      setDefFilterValue(value, i, k);
    };
    switch (filterFnTypes[filter.fn]?.valueType) {
      case "text":
      case "number":
        {
          const menuOptions: SelectOption[] = [];
          menuOptions.push(menuInput(filter.value, saveFilterValue));

          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            { x: offset.left, y: offset.top + 30 },
            defaultMenu(props.superstate.ui, menuOptions)
          );
        }
        break;
      case "date": {
        const saveValue = (date: Date) => {
          saveFilterValue(format(date, "yyyy-MM-dd"));
        };
        const offset = (e.target as HTMLElement).getBoundingClientRect();
        const date = new Date(filter.value);
        showDatePickerMenu(
          props.superstate.ui,
          { x: offset.left, y: offset.top + 30 },
          date.getTime() ? date : null,
          saveValue
        );
        break;
      }
      case "list":
        {
          const fieldType = filter.fType;
          const saveOptions = (options: string[], values: string[]) => {
            saveFilterValue(serializeMultiString(values));
          };
          let options: {
            name: string;
            value: string;
          }[] = [];
          if (fieldType.startsWith("option")) {
            options = parseMultiString(filter.value).map((f) => ({
              name: f,
              value: f,
            }));
          } else if (fieldType.startsWith("tags")) {
            options = props.superstate.spaceManager.readTags().map((f) => ({
              value: f,
              name: f,
            }));
          } else if (fieldType.startsWith("links")) {
            options = props.superstate.spaceManager.allPaths().map((f) => ({
              name: pathNameToString(f),
              value: f,
              description: f,
            }));
          }
          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            { x: offset.left, y: offset.top + 30 },
            {
              ui: props.superstate.ui,
              multi: true,
              editable: true,
              value: parseMultiString(filter.value),
              options: options,
              saveOptions,
              placeholder: i18n.labels.optionItemSelectPlaceholder,
              searchable: false,
              showAll: true,
            }
          );
        }
        break;
    }
  };
  const addDefGroup = () => {
    setFilters((p) => [
      ...p,
      {
        type: "any",
        trueFalse: true,
        filters: [],
      },
    ]);
  };
  const removeDefGroup = (groupIndex: number) => {
    setFilters(filters.filter((f, i) => (i == groupIndex ? false : true)));
  };

  const typeForField = (type: SpaceDefType, field: string) => {
    if (type == "frontmatter") {
      return "text";
    }
    if (type == "filemeta") {
      return pathCacheMetadata[field].vType;
    }
    if (type == "fileprop") {
      return pathProperties[field].vType;
    }
    return "text";
  };
  const setDefFilter = (
    filter: string,
    groupIndex: number,
    filterIndex: number
  ) => {
    let field: string;
    let fType: string;
    const filterTuple = filter.split(".");
    const type = filterTuple[0] as SpaceDefType;
    if (type == "frontmatter") {
      fType = filterTuple[1];
      field = filterTuple[2];
    } else {
      field = filterTuple[1];
      fType = typeForField(type, field);
    }
    if (filters.length == 0) {
      setFilters([
        {
          type: "any",
          trueFalse: true,
          filters: [
            {
              type: type,
              field,
              fType,
              fn: "",
              value: "",
            },
          ],
        },
      ]);
      return;
    }
    if (filters[groupIndex]?.filters.length == 0) {
      setFilters(
        filters.map((f, i) =>
          i == groupIndex
            ? {
                ...f,
                filters: [
                  {
                    type: type,
                    field,
                    fType,
                    fn: "",
                    value: "",
                  },
                ],
              }
            : f
        )
      );

      return;
    }

    setFilters(
      filters.map((f, i) =>
        i == groupIndex
          ? {
              ...f,
              filters:
                !f.filters || filterIndex == f.filters.length
                  ? [
                      ...(f.filters ?? []),
                      {
                        type: type as SpaceDefType,
                        fType,
                        field,
                        fn: "",
                        value: "",
                      },
                    ]
                  : f.filters.map((g, k) =>
                      k == filterIndex
                        ? {
                            ...g,
                            type: type as SpaceDefType,
                            fType,
                            field,
                          }
                        : g
                    ),
            }
          : f
      )
    );
  };
  const setDefFilterFn = (
    fn: string,
    groupIndex: number,
    filterIndex: number
  ) => {
    setFilters(
      filters.map((f, i) =>
        i == groupIndex
          ? {
              ...f,
              filters: f.filters.map((g, k) =>
                k == filterIndex
                  ? {
                      ...g,
                      fn,
                    }
                  : g
              ),
            }
          : f
      )
    );
  };
  const setDefFilterValue = (
    value: string,
    groupIndex: number,
    filterIndex: number
  ) => {
    setFilters(
      filters.map((f, i) =>
        i == groupIndex
          ? {
              ...f,
              filters: f.filters.map((g, k) =>
                k == filterIndex
                  ? {
                      ...g,
                      value,
                    }
                  : g
              ),
            }
          : f
      )
    );
  };

  const removeDefFilter = (filterIndex: number, groupIndex: number) => {
    setFilters(
      filters.map((f, i) =>
        i == groupIndex
          ? {
              ...f,
              filters: f.filters.filter((g, k) =>
                k == filterIndex ? false : true
              ),
            }
          : f
      )
    );
  };
  const setGroupType = (groupIndex: number, type: "any" | "all") => {
    if (groupIndex == 0 && filters.length == 0) {
      setFilters([
        {
          type: type,
          trueFalse: true,
          filters: [],
        },
      ]);
    } else {
      setFilters(
        filters.map((f, i) =>
          i == groupIndex
            ? {
                ...f,
                type: type,
              }
            : f
        )
      );
    }
  };
  const selectGroupType = (e: React.MouseEvent, i: number) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const filters = ["any", "all"];
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: filters.map((f) => ({ name: f, value: f })),
        saveOptions: (_, value) => setGroupType(i, value[0] as "any" | "all"),
        searchable: false,
        showAll: true,
      }
    );
  };
  const selectFilter = (e: React.MouseEvent, i: number, k: number) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const { type, field, fType } = filters[i].filters[k];
    const _filters = predicateFnsForType(fType, filterFnTypes);
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: true,
        value: [],
        options: _filters.map((f) => ({ name: filterFnLabels[f], value: f })),
        saveOptions: (_, value) => setDefFilterFn(value[0], i, k),
        placeholder: i18n.labels.contextItemSelectPlaceholder,
        searchable: true,
        showAll: true,
      }
    );
  };
  const selectField = async (e: React.MouseEvent, i: number, k: number) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const allPaths = props.superstate.spaceManager.allPaths();
    const properties = allPropertiesForPaths(props.superstate, allPaths);

    const f = [
      ...Object.keys(pathCacheMetadata).map((f) => ({
        name: pathCacheMetadata[f].label,
        value: "filemeta." + f,
      })),
      ...Object.keys(pathProperties).map((f) => ({
        name: pathProperties[f].label,
        value: "fileprop." + f,
      })),
      ...properties.map((f) => ({
        name: f.name,
        value: "frontmatter." + f.type + "." + f.name,
      })),
    ];

    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: f,
        saveOptions: (_, value) => setDefFilter(value[0], i, k),
        placeholder: i18n.labels.contextItemSelectPlaceholder,
        searchable: true,
        showAll: true,
      }
    );
  };
  return (
    <div className="mk-query">
      {filters.length == 0 ? (
        <DefFilterGroup
          superstate={props.superstate}
          selectGroupType={selectGroupType}
          group={null}
          addDefGroup={addDefGroup}
          selectField={selectField}
          i={0}
          removeDefGroup={removeDefGroup}
        ></DefFilterGroup>
      ) : (
        filters.map((f, i) => (
          <DefFilterGroup
            superstate={props.superstate}
            key={i}
            group={f}
            selectGroupType={selectGroupType}
            addDefGroup={addDefGroup}
            selectField={selectField}
            i={i}
            removeDefGroup={removeDefGroup}
          >
            {f.filters.map((filter, k) => (
              <DefFilter
                superstate={props.superstate}
                key={k}
                filter={filter}
                i={i}
                k={k}
                selectField={selectField}
                selectFilter={selectFilter}
                selectFilterValue={selectFilterValue}
                removeDefFilter={removeDefFilter}
              ></DefFilter>
            ))}
          </DefFilterGroup>
        ))
      )}
    </div>
  );
};
const DefFilter = (props: {
  superstate: Superstate;
  filter: SpaceDefFilter;
  i: number;
  k: number;
  selectField: (e: React.MouseEvent, i: number, k: number) => void;
  selectFilter: (e: React.MouseEvent, i: number, k: number) => void;
  selectFilterValue: (
    e: React.MouseEvent,
    h: SpaceDefFilter,
    i: number,
    k: number
  ) => void;
  removeDefFilter: (k: number, i: number) => void;
}) => {
  const {
    filter,
    selectField,
    selectFilter,
    selectFilterValue,

    removeDefFilter,
    i,
    k,
  } = props;
  return (
    <div className="mk-filter">
      <span onClick={(e) => selectField(e, i, k)}>
        {filter.field.length == 0 ? i18n.labels.select : filter.field}
      </span>
      {filter.field.length > 0 && (
        <span onClick={(e) => selectFilter(e, i, k)}>
          {!filterFnLabels[filter.fn]
            ? i18n.labels.select
            : filterFnLabels[filter.fn]}
        </span>
      )}
      {filter.field.length > 0 &&
        filterFnLabels[filter.fn] &&
        filterFnTypes[filter.fn]?.valueType != "none" && (
          <span>
            <FilterValueSpan
              fieldType={filter.fType}
              filter={filter}
              selectFilterValue={(e: React.MouseEvent, h: SpaceDefFilter) =>
                selectFilterValue(e, h, i, k)
              }
            ></FilterValueSpan>
          </span>
        )}
      <span onClick={() => removeDefFilter(k, i)}>
        <div
          className="mk-icon-xsmall"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
          }}
        ></div>
      </span>
    </div>
  );
};
const DefFilterGroup = (
  props: PropsWithChildren<{
    superstate: Superstate;
    group: SpaceDefGroup;
    addDefGroup: () => void;
    selectGroupType: (e: React.MouseEvent, i: number) => void;
    selectField: (e: React.MouseEvent, i: number, k: number) => void;
    i: number;
    removeDefGroup: (i: number) => void;
  }>
) => {
  const {
    group,
    selectGroupType,
    addDefGroup,
    selectField,
    i,
    removeDefGroup,
  } = props;
  return (
    <div className="mk-query-group">
      <div className="mk-query-group-type">
        <span
          onClick={(e) => selectGroupType(e, i)}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker(
              `ui//mk-ui-${group?.type ?? "any"}`
            ),
          }}
        ></span>
      </div>
      <div className="mk-filter-bar mk-query-filters">
        {props.children}
        <div
          className="mk-filter"
          onClick={(e) => selectField(e, i, group?.filters.length ?? 0)}
        >
          <span>
            <span
              className="mk-icon-xsmall"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//mk-ui-plus"),
              }}
            ></span>
            Filter
          </span>
        </div>
      </div>
      <div
        className="mk-icon-small"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
        }}
        onClick={(e) => {
          removeDefGroup(i);
        }}
      ></div>
    </div>
  );
};
