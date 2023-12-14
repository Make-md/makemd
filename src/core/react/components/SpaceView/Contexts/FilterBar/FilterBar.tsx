import i18n from "core/i18n";
import { showPropertyMenu } from "core/react/components/UI/Menus/contexts/spacePropertyMenu";
import {
  SelectOption,
  defaultMenu,
  menuInput,
  menuSeparator,
} from "core/react/components/UI/Menus/menu";
import { showSpaceAddMenu } from "core/react/components/UI/Menus/navigator/showSpaceAddMenu";
import { showDatePickerMenu } from "core/react/components/UI/Menus/properties/datePickerMenu";
import { openContextEditorModal } from "core/react/components/UI/Modals/ContextEditor";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { PathPropertyName } from "core/types/context";
import { Filter, Sort } from "core/types/predicate";
import { contextViewEmbedStringFromContext } from "core/utils/contexts/embed";
import { optionValuesForColumn } from "core/utils/contexts/optionValuesForColumn";
import { filterFnLabels } from "core/utils/contexts/predicate/filterFns/filterFnLabels";
import { filterFnTypes } from "core/utils/contexts/predicate/filterFns/filterFnTypes";
import {
  defaultPredicateFnForType,
  predicateFnsForType,
} from "core/utils/contexts/predicate/predicate";
import { sortFnTypes } from "core/utils/contexts/predicate/sort";
import { format } from "date-fns";
import React, { useContext, useRef } from "react";
import { defaultContextSchemaID } from "schemas/mdb";
import { SpaceTableColumn, SpaceTableSchema } from "types/mdb";
import { FrameSchema } from "types/mframe";
import { parseMultiString } from "utils/parsers";
import { pathToString } from "utils/path";
import { serializeMultiString } from "utils/serializers";
import { ContextMDBContext } from "../../../../context/ContextMDBContext";
import { SearchBar } from "./SearchBar";

export const FilterBar = (props: { superstate: Superstate }) => {
  const ctxRef = useRef(null);
  const { spaceInfo, spaceState: spaceCache } = useContext(SpaceContext);
  const {
    dbSchemas: schemas,
    setDBSchema,
    dbSchema,
    contextTable,
    tableData,
  } = useContext(ContextMDBContext);
  const {
    data,
    loadContextFields,
    cols,
    schema,
    setSchema,
    setSearchString,
    setEditMode,
    predicate,
    savePredicate,
    hideColumn,
    saveColumn,
    sortColumn,
    delColumn,
    views,
  } = useContext(ContextEditorContext);
  const { saveSchema, frameSchemas, deleteSchema } =
    useContext(FramesMDBContext);

  const filteredCols = cols.filter((f) => f.hidden != "true");

  const saveViewType = (type: string) => {
    savePredicate({
      ...predicate,
      view: type,
    });
  };

  const selectView = (_dbschema: SpaceTableSchema, value?: string) => {
    setDBSchema(_dbschema);
    value && setSchema(views.find((f) => f.id == value));
  };
  const openView = (e: React.MouseEvent, view: FrameSchema) => {
    const dbSchema = schemas.find((f) => f.type == "db" && f.id == view.def.db);
    if (dbSchema) {
      selectView(dbSchema, view.id);
      return;
    }
    return;
  };

  const clearFilters = () => {
    savePredicate({
      ...predicate,
      filters: [],
      sort: [],
    });
  };
  const clearHiddenCols = () => {
    savePredicate({
      ...predicate,
      colsHidden: [],
    });
  };

  const removeFilter = (filter: Filter) => {
    const newFilters = [
      ...predicate.filters.filter((f) => f.field != filter.field),
    ];
    savePredicate({
      ...predicate,
      filters: newFilters,
    });
  };

  const viewContextMenu = (e: React.MouseEvent, _schema: FrameSchema) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.menu.copyEmbedLink,
      icon: "lucide//link",
      onClick: (e) => {
        navigator.clipboard.writeText(
          contextViewEmbedStringFromContext(spaceCache, _schema.id)
        );
      },
    });

    menuOptions.push({
      name: i18n.buttons.deleteView,
      icon: "lucide//edit",
      onClick: (e) => {
        props.superstate.ui.openModal(
          i18n.labels.renameView,
          (props: { hide: () => void }) => (
            <InputModal
              value={_schema.name}
              saveLabel={i18n.labels.renameView}
              hide={props.hide}
              saveValue={(value) =>
                saveSchema({
                  ..._schema,
                  name: value,
                })
              }
            ></InputModal>
          )
        );
      },
    });
    menuOptions.push({
      name: i18n.buttons.delete,
      icon: "lucide//trash",
      onClick: (e) => {
        deleteSchema(_schema);
      },
    });
    props.superstate.ui.openMenu(
      { x: e.pageX, y: e.pageY },
      defaultMenu(props.superstate.ui, menuOptions)
    );
  };

  const showFilterMenu = (e: React.MouseEvent) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.menu.tableView,
      icon: "lucide//table-2",
      onClick: (e) => {
        saveViewType("table");
      },
    });
    menuOptions.push({
      name: i18n.menu.cardView,
      icon: "lucide//layout-grid",
      onClick: (e) => {
        saveViewType("card");
      },
    });
    menuOptions.push({
      name: i18n.menu.listView,
      icon: "lucide//layout-list",
      onClick: (e) => {
        saveViewType("list");
      },
    });
    if (dbSchema?.primary) {
      menuOptions.push({
        name: i18n.menu.flowView,
        icon: "lucide//infinity",
        onClick: (e) => {
          saveViewType("flow");
        },
      });
    }
    menuOptions.push(menuSeparator);
    menuOptions.push({
      name: i18n.menu.groupBy,
      icon: "lucide//columns",
      onClick: (e) => {
        showGroupByMenu(e);
      },
    });
    menuOptions.push({
      name: i18n.menu.sortBy,
      icon: "lucide//sort-desc",
      onClick: (e) => {
        showSortMenu(e);
      },
    });
    menuOptions.push(menuSeparator);
    menuOptions.push({
      name: i18n.menu.newFilter,
      icon: "lucide//filter",
      onClick: (e) => {
        showAddFilterMenu(e);
      },
    });
    menuOptions.push({
      name: i18n.menu.clearFilters,
      icon: "lucide//x-square",
      onClick: (e) => {
        clearFilters();
      },
    });
    menuOptions.push(menuSeparator);
    menuOptions.push({
      name: i18n.menu.unhideFields,
      icon: "lucide//eye",
      onClick: (e) => {
        clearHiddenCols();
      },
    });
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      defaultMenu(props.superstate.ui, menuOptions)
    );
  };

  const addSort = (_: string[], sort: string[]) => {
    const field = sort[0];
    const fieldType = filteredCols.find((f) => f.name + f.table == field)?.type;
    if (fieldType) {
      const type = defaultPredicateFnForType(fieldType, sortFnTypes);
      const newSort: Sort = {
        field,
        fn: type,
      };
      savePredicate({
        ...predicate,
        sort: [
          ...predicate.sort.filter((s) => s.field != newSort.field),
          newSort,
        ],
      });
    }
  };

  const saveGroupBy = (_: string[], groupBy: string[]) => {
    savePredicate({
      ...predicate,
      groupBy: groupBy,
    });
  };

  const removeSort = (sort: Sort) => {
    const newSort = [...predicate.sort.filter((f) => f.field != sort.field)];
    savePredicate({
      ...predicate,
      sort: newSort,
    });
  };
  const addFilter = (_: string[], filter: string[]) => {
    const field = filter[0];
    const fieldType = filteredCols.find((f) => f.name + f.table == field)?.type;
    if (fieldType) {
      const type = defaultPredicateFnForType(fieldType, filterFnTypes);
      const newFilter: Filter =
        fieldType == "boolean"
          ? {
              field,
              fn: type,
              value: "true",
            }
          : {
              field,
              fn: type,
              value: "",
            };
      savePredicate({
        ...predicate,
        filters: [
          ...predicate.filters.filter((s) => s.field != newFilter.field),
          newFilter,
        ],
      });
    }
  };

  const changeSortMenu = (e: React.MouseEvent, sort: Sort) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const saveSort = (_: string[], newType: string[]) => {
      const type = newType[0];
      const newSort: Sort = {
        ...sort,
        fn: type,
      };
      savePredicate({
        ...predicate,
        sort: [
          ...predicate.sort.filter((s) => s.field != newSort.field),
          newSort,
        ],
      });
    };
    const fieldType = filteredCols.find(
      (f) => f.name + f.table == sort.field
    )?.type;
    const sortsForType = predicateFnsForType(fieldType, sortFnTypes);
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: sortsForType.map((f) => ({
          name: sortFnTypes[f].label,
          value: f,
        })),
        saveOptions: saveSort,
        placeholder: i18n.labels.sortItemSelectPlaceholder,
        searchable: false,
        showAll: true,
      }
    );
  };
  const showViewsMenu = (e: React.MouseEvent) => {
    openContextEditorModal(
      props.superstate,
      spaceInfo,
      dbSchema?.id,
      schema?.id,
      1
    );
  };
  const showColsMenu = (e: React.MouseEvent) => {
    openContextEditorModal(
      props.superstate,
      spaceInfo,
      dbSchema?.id,
      schema?.id,
      0
    );
  };
  const saveField = (field: SpaceTableColumn, oldField: SpaceTableColumn) => {
    if (field.name.length > 0) {
      if (
        field.name != oldField.name ||
        field.type != oldField.type ||
        field.value != oldField.value ||
        field.attrs != oldField.attrs
      ) {
        const saveResult = saveColumn(field, oldField);
      }
    }
  };
  const showMenu = (e: React.MouseEvent, field: SpaceTableColumn) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const options = optionValuesForColumn(
      field.name,
      field.table == "" ? tableData : contextTable[field.table]
    );
    showPropertyMenu({
      superstate: props.superstate,
      position: { x: offset.left, y: offset.top + 30 },
      editable: true,
      options,
      field,
      fields: cols,
      contextPath: spaceInfo.path,
      saveField: (newField) => saveField(newField, field),
      hide: hideColumn,
      deleteColumn: delColumn,
      sortColumn,
      hidden: predicate.colsHidden.includes(field.name + field.table),
    });
  };

  const changeFilterMenu = (e: React.MouseEvent, filter: Filter) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const saveFilter = (_: string[], newType: string[]) => {
      const type = newType[0];
      const newFilter: Filter = {
        ...filter,
        fn: type,
      };
      savePredicate({
        ...predicate,
        filters: [
          ...predicate.filters.filter((s) => s.field != newFilter.field),
          newFilter,
        ],
      });
    };
    const fieldType = filteredCols.find(
      (f) => f.name + f.table == filter.field
    )?.type;
    const filtersForType = predicateFnsForType(fieldType, filterFnTypes);
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: filtersForType.map((f) => ({
          name: filterFnLabels[f],
          value: f,
        })),
        saveOptions: saveFilter,
        placeholder: i18n.labels.filterItemSelectPlaceholder,
        searchable: false,
        showAll: true,
      }
    );
  };

  const showAddFilterMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: filteredCols
          .filter((f) => predicateFnsForType(f.type, filterFnTypes).length > 0)
          .map((f) => ({
            name: f.name + f.table,
            value: f.name + f.table,
          })),
        saveOptions: addFilter,
        placeholder: i18n.labels.propertyItemSelectPlaceholder,
        searchable: false,
        showAll: true,
      }
    );
  };
  const showSortMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: filteredCols.map((f) => ({
          name: f.name + f.table,
          value: f.name + f.table,
        })),
        saveOptions: addSort,
        placeholder: i18n.labels.sortItemSelectPlaceholder,
        searchable: false,
        showAll: true,
      }
    );
  };

  const showGroupByMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: filteredCols
          .filter((f) => f.name != PathPropertyName)
          .map((f) => ({
            name: f.name + f.table,
            value: f.name + f.table,
          })),
        saveOptions: saveGroupBy,
        placeholder: i18n.labels.propertyItemSelectPlaceholder,
        searchable: false,
        showAll: true,
      }
    );
  };

  const showSaveViewModal = () => {
    props.superstate.ui.openModal(
      i18n.labels.saveView,
      (props: { hide: () => void }) => (
        <InputModal
          value=""
          saveLabel={i18n.labels.saveView}
          hide={props.hide}
          saveValue={(value) =>
            saveSchema({
              ...schema,
              id: value.replace(/ /g, "_"),
              name: value,
            })
          }
        ></InputModal>
      )
    );
  };

  const selectFilterValue = (e: React.MouseEvent, filter: Filter) => {
    switch (filterFnTypes[filter.fn].valueType) {
      case "text":
      case "number":
        {
          const saveFilterValue = (value: string) => {
            const newFilter: Filter = {
              ...filter,
              value,
            };
            savePredicate({
              ...predicate,
              filters: [
                ...predicate.filters.filter((s) => s.field != newFilter.field),
                newFilter,
              ],
            });
          };
          const menuOptions: SelectOption[] = [];
          menuOptions.push(
            menuInput(filter.value, (value) => {
              const newFilter: Filter = {
                ...filter,
                value,
              };
              savePredicate({
                ...predicate,
                filters: [
                  ...predicate.filters.filter(
                    (s) => s.field != newFilter.field
                  ),
                  newFilter,
                ],
              });
            })
          );

          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            { x: offset.left, y: offset.top + 30 },
            defaultMenu(props.superstate.ui, menuOptions)
          );
        }
        break;
      case "date": {
        const saveValue = (date: Date) => {
          const newFilter: Filter = {
            ...filter,
            value: date ? format(date, "yyyy-MM-dd") : "",
          };
          savePredicate({
            ...predicate,
            filters: [
              ...predicate.filters.filter((s) => s.field != newFilter.field),
              newFilter,
            ],
          });
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
          const col = cols.find((f) => f.name + f.table == filter.field);
          const saveOptions = (options: string[], values: string[]) => {
            const newFilter: Filter = {
              ...filter,
              value: serializeMultiString(values),
            };
            savePredicate({
              ...predicate,
              filters: [
                ...predicate.filters.filter((s) => s.field != newFilter.field),
                newFilter,
              ],
            });
          };
          if (col.type.startsWith("option")) {
            const offset = (e.target as HTMLElement).getBoundingClientRect();
            props.superstate.ui.openMenu(
              { x: offset.left, y: offset.top + 30 },
              {
                ui: props.superstate.ui,
                multi: true,
                editable: false,
                value: parseMultiString(filter.value),
                options: parseMultiString(col.value).map((f) => ({
                  name: f,
                  value: f,
                })),
                saveOptions,
                placeholder: i18n.labels.optionItemSelectPlaceholder,
                searchable: true,
                showAll: true,
              }
            );
          } else if (col.type.startsWith("context")) {
            const contextData = contextTable[col.table]?.rows ?? [];
            const offset = (e.target as HTMLElement).getBoundingClientRect();
            props.superstate.ui.openMenu(
              { x: offset.left, y: offset.top + 30 },
              {
                ui: props.superstate.ui,
                multi: true,
                editable: false,
                value: parseMultiString(filter.value),
                options:
                  contextData.map((f) => ({
                    name: pathToString(f[PathPropertyName]),
                    value: f[PathPropertyName],
                  })) ?? [],
                saveOptions,
                placeholder: i18n.labels.optionItemSelectPlaceholder,
                searchable: true,
                showAll: true,
              }
            );
          }
        }
        break;
    }
  };

  return (
    <>
      <div className="mk-view-config">
        <div className="mk-view-selector">
          {views.map((f, i) => (
            <div
              key={i}
              className={`${schema?.id == f.id ? "mk-is-active" : ""}`}
              onContextMenu={(e) => viewContextMenu(e, f)}
            >
              <button onClick={(e) => openView(e, f)}>{f.name}</button>
            </div>
          ))}
          <button onClick={(e) => showSaveViewModal()}>+</button>
        </div>
        <span></span>
        {
          <div className="mk-view-options">
            <SearchBar
              superstate={props.superstate}
              setSearchString={setSearchString}
            ></SearchBar>

            <button
              onClick={(e) => showFilterMenu(e)}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker(
                  "ui//mk-ui-view-options"
                ),
              }}
            ></button>

            {/* {props.superstate.settings.experimental && (
              <button
                onClick={(e) => setEditMode((p) => (p == 0 ? 1 : 0))}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//mk-ui-build"),
                }}
              ></button>
            )} */}
            <div>
              <button
                onClick={(e) => showColsMenu(e)}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//mk-ui-list"),
                }}
              ></button>
            </div>
            {dbSchema?.id == defaultContextSchemaID && (
              <button
                className="mk-button-new"
                onClick={(e) =>
                  showSpaceAddMenu(props.superstate, e, spaceCache, true)
                }
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//mk-ui-plus"),
                }}
              ></button>
            )}
          </div>
        }
      </div>
      {(predicate.filters.length > 0 ||
        predicate.sort.length > 0 ||
        predicate.groupBy.length > 0) && (
        <div className="mk-filter-bar">
          {predicate.groupBy.length > 0 && (
            <div className="mk-filter">
              <span>Group By</span>
              <span onClick={(e) => showGroupByMenu(e)}>
                {predicate.groupBy[0]}
              </span>
              <div
                onClick={() => saveGroupBy(null, [])}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
                }}
              ></div>
            </div>
          )}
          {predicate.sort.map((f, i) => (
            <div key={i} className="mk-filter">
              <span>{f.field}</span>
              <span onClick={(e) => changeSortMenu(e, f)}>
                {sortFnTypes[f.fn].label}
              </span>
              <div
                onClick={() => removeSort(f)}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
                }}
              ></div>
            </div>
          ))}
          {predicate.filters.map((f, i) => (
            <div key={i} className="mk-filter">
              <span>{f.field}</span>
              <span onClick={(e) => changeFilterMenu(e, f)}>
                {filterFnLabels[f.fn]}
              </span>
              <FilterValueSpan
                fieldType={cols.find((c) => c.name + c.table == f.field)?.type}
                filter={f}
                selectFilterValue={selectFilterValue}
              ></FilterValueSpan>
              <div
                onClick={() => removeFilter(f)}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
                }}
              ></div>
            </div>
          ))}
          <span></span>
        </div>
      )}
    </>
  );
};

export const FilterValueSpan = (props: {
  filter: Filter;
  selectFilterValue: (e: React.MouseEvent, f: Filter) => void;
  fieldType: string;
}) => {
  const { filter, selectFilterValue, fieldType } = props;
  const fnType = filterFnTypes[filter.fn];
  if (!fieldType || !fnType || fnType.valueType == "none") {
    return <></>;
  } else if (!filter.value || filter.value.length == 0) {
    return <span onClick={(e) => selectFilterValue(e, filter)}>Select</span>;
  } else if (
    fieldType.startsWith("option") ||
    fieldType.startsWith("context")
  ) {
    const options = parseMultiString(filter.value);
    return (
      <span onClick={(e) => selectFilterValue(e, filter)}>
        {" "}
        {options.map((f, i) => (
          <span key={i}>{f}</span>
        ))}
      </span>
    );
  }
  return (
    <span onClick={(e) => selectFilterValue(e, filter)}>{filter.value}</span>
  );
};
