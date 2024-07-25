import i18n from "core/i18n";
import {
  DatePickerTimeMode,
  showDatePickerMenu,
} from "core/react/components/UI/Menus/properties/datePickerMenu";
import { Superstate } from "core/superstate/superstate";
import { Metadata } from "core/types/metadata";
import { SpaceDefFilter, SpaceDefGroup } from "core/types/space";
import { filterFnLabels } from "core/utils/contexts/predicate/filterFns/filterFnLabels";
import { filterFnTypes } from "core/utils/contexts/predicate/filterFns/filterFnTypes";
import {
  allPredicateFns,
  predicateFnsForType,
} from "core/utils/contexts/predicate/predicate";
import { format } from "date-fns";
import React, { PropsWithChildren, useEffect } from "react";
import { SpaceProperty } from "types/mdb";
import { windowFromDocument } from "utils/dom";
import { parseMultiString } from "utils/parsers";
import { pathNameToString } from "utils/path";
import { serializeMultiString } from "utils/serializers";
import { FilterValueSpan } from "../SpaceView/Contexts/FilterBar/FilterBar";
import { SelectSection } from "../UI/Menus/menu/SelectionMenu";
import { showLinkMenu } from "../UI/Menus/properties/linkMenu";
import { showSpacesMenu } from "../UI/Menus/properties/selectSpaceMenu";

export const SpaceQuery = (props: {
  superstate: Superstate;
  fields: Metadata[];
  sections: SelectSection[];
  filters: SpaceDefGroup[];
  setFilters: React.Dispatch<React.SetStateAction<SpaceDefGroup[]>>;
  removeable?: boolean;
  linkProps?: SpaceProperty[];
}) => {
  useEffect(() => {
    props.superstate.refreshMetadata();
  }, []);
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
    if (filter.fType == "property") {
      setFilters(
        filters.map((f, groupIndex) =>
          i == groupIndex
            ? {
                ...f,
                filters: f.filters.map((g, filterIndex) =>
                  k == filterIndex
                    ? {
                        ...g,
                        fType: "property",
                        value: filter.value,
                      }
                    : g
                ),
              }
            : f
        )
      );
      return;
    }
    switch (filterFnTypes[filter.fn]?.valueType) {
      case "text":
      case "number":
        {
          saveFilterValue(filter.value);
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
          offset,
          windowFromDocument(e.view.document),
          date.getTime() ? date : null,
          saveValue,
          DatePickerTimeMode.None
        );
        break;
      }
      case "link": {
        const saveValue = (value: string) => {
          saveFilterValue(value);
        };
        const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
        showLinkMenu(
          offset,
          windowFromDocument(e.view.document),
          props.superstate,
          saveValue
        );
        e.stopPropagation();
        break;
      }
      case "space": {
        const saveValue = (value: string) => {
          saveFilterValue(value);
        };
        const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
        showSpacesMenu(
          offset,
          windowFromDocument(e.view.document),
          props.superstate,
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
          } else if (fieldType.startsWith("link")) {
            options = props.superstate.spaceManager.allPaths().map((f) => ({
              name: pathNameToString(f),
              value: f,
              description: f,
            }));
          }
          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            offset,
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
            },
            windowFromDocument(e.view.document)
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

  const setDefFilter = (
    filter: Metadata,
    groupIndex: number,
    filterIndex: number
  ) => {
    if (!filter) return;
    if (filters.length == 0) {
      setFilters([
        {
          type: "all",
          trueFalse: true,
          filters: [
            {
              type: filter.type,
              field: filter.field,
              fType: filter.vType,
              fn: filter.defaultFilter,
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
                    type: filter.type,
                    field: filter.field,
                    fType: filter.vType,
                    fn: filter.defaultFilter,
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
                        type: filter.type,
                        field: filter.field,
                        fType: filter.vType,
                        fn: filter.defaultFilter,
                        value: "",
                      },
                    ]
                  : f.filters.map((g, k) =>
                      k == filterIndex
                        ? {
                            ...g,
                            type: filter.type,
                            field: filter.field,
                            fType: filter.vType,
                            fn: filter.defaultFilter,
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
      offset,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: filters.map((f) => ({
          name: f == "any" ? "or" : "and",
          value: f,
        })),
        saveOptions: (_, value) => setGroupType(i, value[0] as "any" | "all"),
        searchable: false,
        showAll: true,
      },
      windowFromDocument(e.view.document)
    );
  };
  const selectFilter = (e: React.MouseEvent, i: number, k: number) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const { type, field, fType } = filters[i].filters[k];
    const _filters =
      fType == "any"
        ? allPredicateFns(filterFnTypes)
        : predicateFnsForType(fType, filterFnTypes);
    props.superstate.ui.openMenu(
      offset,
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
      },
      windowFromDocument(e.view.document)
    );
  };
  const selectField = async (e: React.MouseEvent, i: number, k: number) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();

    props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: props.fields.map((f) => ({
          name: f.label,
          value: f,
          section: f.type,
          description: f.description,
        })),
        saveOptions: (_, value) => setDefFilter(value[0] as any, i, k),
        placeholder: i18n.labels.contextItemSelectPlaceholder,
        searchable: true,
        showAll: true,
        sections: props.sections,
        showSections: true,
      },
      windowFromDocument(e.view.document)
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
          removeable={props.removeable}
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
            removeable={props.removeable}
            i={i}
            removeDefGroup={removeDefGroup}
          >
            {f.filters.map((filter, k, arr) => (
              <React.Fragment key={k}>
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
                  linkProps={props.linkProps}
                ></DefFilter>
                {k != arr.length - 1 && (
                  <div
                    className="mk-filter"
                    onClick={(e) => selectGroupType(e, i)}
                  >
                    <span>{f.type == "any" ? "or" : "and"}</span>
                  </div>
                )}
              </React.Fragment>
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
  linkProps?: SpaceProperty[];
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
  const filterFieldName =
    props.superstate.allMetadata[filter.type]?.properties.find(
      (f) => f.field == filter.field
    )?.label ?? filter.field;
  return (
    <div className="mk-filter">
      <span onClick={(e) => selectField(e, i, k)}>
        {filter.field.length == 0 ? i18n.labels.select : filterFieldName}
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
          <>
            <span>
              <FilterValueSpan
                superstate={props.superstate}
                fieldType={filter.fType}
                filter={filter}
                selectFilterValue={(e: React.MouseEvent, h: SpaceDefFilter) =>
                  selectFilterValue(e, h, i, k)
                }
              ></FilterValueSpan>
            </span>
            {props.linkProps && props.linkProps.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  props.superstate.ui.openMenu(
                    e.currentTarget.getBoundingClientRect(),
                    {
                      ui: props.superstate.ui,
                      multi: false,
                      editable: false,
                      value: [],
                      options: props.linkProps.map((f) => ({
                        name: f.name,
                        value: f.name,
                        section: f.type,
                      })),
                      saveOptions: (_, value) =>
                        selectFilterValue(
                          e,
                          {
                            ...filter,
                            fType: "property",
                            value: value[0] as any,
                          },
                          i,
                          k
                        ),
                      placeholder: i18n.labels.contextItemSelectPlaceholder,
                      searchable: true,
                      showAll: true,
                      sections: [],
                      showSections: false,
                    },
                    windowFromDocument(e.view.document)
                  );
                }}
              >
                <div
                  className="mk-icon-xsmall"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//plug"),
                  }}
                ></div>
              </span>
            )}
          </>
        )}
      <span
        onClick={(e) => {
          removeDefFilter(k, i);
          e.stopPropagation();
        }}
      >
        <div
          className="mk-icon-xsmall"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//close"),
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
    removeable: boolean;
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
      {/* <div className="mk-query-group-type">
        <span
          onClick={(e) => selectGroupType(e, i)}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker(
              `ui//${group?.type ?? "any"}`
            ),
          }}
        ></span>
      </div> */}
      <div className="mk-filter-bar mk-query-filters">
        {props.children}
        <div
          className="mk-filter-add"
          onClick={(e) => selectField(e, i, group?.filters.length ?? 0)}
        >
          <span>
            <span
              className="mk-icon-xsmall"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//plus"),
              }}
            ></span>
            {i18n.buttons.addCondition}
          </span>
        </div>
      </div>
      {props.removeable && (
        <div
          className="mk-filter-add"
          onClick={(e) => {
            removeDefGroup(i);
            e.stopPropagation();
          }}
        >
          <span>
            <span
              className="mk-icon-small"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//close"),
              }}
            ></span>
          </span>
        </div>
      )}
    </div>
  );
};
