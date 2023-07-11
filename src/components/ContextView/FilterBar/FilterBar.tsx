import { showDatePickerMenu } from "components/ui/menus/datePickerMenu";
import { inputMenuItem, showSelectMenu } from "components/ui/menus/menuItems";
import { showPropertyMenu } from "components/ui/menus/propertyMenu";
import { ContextEditorModal } from "components/ui/modals/contextEditorModal";
import { MergeColumnModal } from "components/ui/modals/mergeColumnModal";
import { SaveViewModal } from "components/ui/modals/saveViewModal";
import { VaultChangeModal } from "components/ui/modals/vaultChangeModals";
import "css/FilterBar.css";
import { isMouseEvent } from "hooks/useLongPress";
import i18n from "i18n";
import MakeMDPlugin from "main";
import { Menu, TFolder } from "obsidian";
import React, { useContext, useRef } from "react";
import { FilePropertyName } from "types/context";
import { MDBColumn, MDBSchema } from "types/mdb";
import { Filter, Sort } from "types/predicate";
import { contextEmbedStringFromContext } from "utils/contexts/contexts";
import { optionValuesForColumn } from "utils/contexts/mdb";
import { filterFnLabels } from "utils/contexts/predicate/filterFns/filterFnLabels";
import { filterFnTypes } from "utils/contexts/predicate/filterFns/filterFnTypes";
import { sortFnTypes } from "utils/contexts/predicate/sort";
import {
  createNewCanvasFile,
  getAbstractFileAtPath,
  newFileInFolder,
} from "utils/file";
import { uiIconSet } from "utils/icons";
import { serializeMultiString } from "utils/serializer";
import { filePathToString } from "utils/strings";
import {
  defaultPredicateFnForType,
  predicateFnsForType,
} from "../../../utils/contexts/predicate/predicate";
import { parseMultiString } from "../../../utils/parser";
import { MDBContext } from "../MDBContext";
import { SearchBar } from "./SearchBar";

export const FilterBar = (props: { plugin: MakeMDPlugin }) => {
  const ctxRef = useRef(null);
  const {
    tables,
    data,
    setDBSchema,
    loadContextFields,
    cols,
    deleteSchema,
    saveSchema,
    saveDB,
    saveContextDB,
    setSchema,
    setSearchString,
    predicate,
    tagContexts,
    savePredicate,
    hideColumn,
    saveColumn,
    sortColumn,
    delColumn,
    schema,
    dbSchema,
    contextInfo,
    contextTable,
    tableData,
  } = useContext(MDBContext);
  const filteredCols = cols.filter((f) => f.hidden != "true");

  const saveViewType = (type: string) => {
    saveSchema({
      ...schema,
      type: type,
    });
  };

  const views = tables.filter((f) => f.type != "db" && f.def == dbSchema?.id);

  const selectView = (_dbschema: MDBSchema, value?: string) => {
    setDBSchema(_dbschema);
    value && setSchema(tables.find((f) => f.id == value));
  };
  const openView = (e: React.MouseEvent, view: MDBSchema) => {
    const dbSchema = tables.find((f) => f.type == "db" && f.id == view.def);
    if (dbSchema) {
      selectView(dbSchema, view.id);
      return;
    }
    return;
  };
  const showViewMenu = (e: React.MouseEvent, _dbschema: MDBSchema) => {
    const views = tables.filter((f) => f.type != "db" && f.def == _dbschema.id);

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        multi: false,
        editable: false,
        value: tagContexts,
        options: views.map((m) => ({ name: m.name, value: m.id })),
        saveOptions: (_: string[], value: string[]) =>
          selectView(_dbschema, value[0]),
        placeholder: i18n.labels.viewItemSelectPlaceholder,
        searchable: false,
        showAll: true,
      }
    );
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

  const viewContextMenu = (e: React.MouseEvent, _schema: MDBSchema) => {
    const fileMenu = new Menu();

    fileMenu.addSeparator();
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle("Copy Embed Link");
      menuItem.onClick(() => {
        navigator.clipboard.writeText(
          contextEmbedStringFromContext(contextInfo, _schema.id)
        );
      });
    });
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle("Rename View");
      menuItem.onClick(() => {
        let vaultChangeModal = new SaveViewModal(
          _schema,
          (s) => saveSchema(s),
          "rename view"
        );
        vaultChangeModal.open();
      });
    });
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle("Delete View");
      menuItem.onClick(() => {
        deleteSchema(_schema);
      });
    });

    // Trigger
    if (isMouseEvent(e)) {
      fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
    } else {
      fileMenu.showAtPosition({
        // @ts-ignore
        x: e.nativeEvent.locationX,
        // @ts-ignore
        y: e.nativeEvent.locationY,
      });
    }
  };

  const showFilterMenu = (e: React.MouseEvent) => {
    const menu = new Menu();
    menu.addItem((item) => {
      item.setTitle(i18n.menu.tableView);
      item.setIcon("table-2");
      item.onClick(() => {
        saveViewType("table");
      });
    });
    menu.addItem((item) => {
      item.setTitle(i18n.menu.cardView);
      item.setIcon("layout-grid");
      item.onClick(() => {
        saveViewType("card");
      });
    });
    menu.addItem((item) => {
      item.setTitle(i18n.menu.listView);
      item.setIcon("layout-list");
      item.onClick(() => {
        saveViewType("list");
      });
    });
    if (dbSchema?.primary) {
      menu.addItem((item) => {
        item.setTitle(i18n.menu.flowView);
        item.setIcon("infinity");
        item.onClick(() => {
          saveViewType("flow");
        });
      });
    }
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle(i18n.menu.groupBy);
      item.setIcon("columns");
      item.onClick(() => {
        showGroupByMenu(e);
      });
    });
    menu.addItem((item) => {
      item.setTitle(i18n.menu.sortBy);
      item.setIcon("sort-desc");
      item.onClick(() => {
        showSortMenu(e);
      });
    });
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle(i18n.menu.newFilter);
      item.setIcon("filter");
      item.onClick(() => {
        showAddFilterMenu(e);
      });
    });
    menu.addItem((item) => {
      item.setTitle(i18n.menu.clearFilters);
      item.setIcon("x-square");
      item.onClick(() => {
        clearFilters();
      });
    });
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle(i18n.menu.unhideFields);
      item.setIcon("eye");
      item.onClick(() => {
        clearHiddenCols();
      });
    });

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    menu.showAtPosition({ x: offset.left, y: offset.top + 30 });
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
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
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

  const showColsMenu = (e: React.MouseEvent) => {
    let vaultChangeModal = new ContextEditorModal(
      props.plugin,
      contextInfo,
      schema?.id
    );
    vaultChangeModal.open();
    // const offset = (e.target as HTMLElement).getBoundingClientRect();
    // showSelectMenu(
    //   { x: offset.left, y: offset.top + 30 },
    //   {
    //     multi: false,
    //     editable: false,
    //     value: [],

    //     options: cols.map((f) => ({
    //       name: f.name + f.table,
    //       value: f.name + f.table,
    //     })),
    //     saveOptions: (_, values) =>
    //       showMenu(
    //         e,
    //         cols.find((f) => f.name + f.table == values[0])
    //       ),
    //     placeholder: i18n.labels.propertyItemSelectPlaceholder,
    //     searchable: true,
    //     showAll: true,
    //   }
    // );
  };
  const saveField = (field: MDBColumn, oldField: MDBColumn) => {
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
  const showMenu = (e: React.MouseEvent, field: MDBColumn) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const options = optionValuesForColumn(
      field.name,
      field.table == "" ? tableData : contextTable[field.table]
    );
    showPropertyMenu(
      props.plugin,
      { x: offset.left, y: offset.top + 30 },
      true,
      options,
      field,
      cols,
      contextInfo.contextPath,
      (newField) => saveField(newField, field),
      (newField, val) => {},
      hideColumn,
      delColumn,
      sortColumn,
      predicate.colsHidden.includes(field.name + field.table)
    );
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
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
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
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
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
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
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
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        multi: false,
        editable: false,
        value: [],
        options: filteredCols
          .filter((f) => f.primary != "true")
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

  const showAddMenu = (e: React.MouseEvent | React.TouchEvent) => {
    const fileMenu = new Menu();
    const folder = getAbstractFileAtPath(
      app,
      contextInfo.contextPath
    ) as TFolder;
    fileMenu.addItem((menuItem) => {
      menuItem.setIcon("edit");
      menuItem.setTitle(i18n.buttons.createNote);
      menuItem.onClick((ev: MouseEvent) => {
        newFileInFolder(props.plugin, folder);
      });
    });
    fileMenu.addItem((menuItem) => {
      menuItem.setIcon("layout-dashboard");
      menuItem.setTitle(i18n.buttons.createCanvas);
      menuItem.onClick((ev: MouseEvent) => {
        createNewCanvasFile(props.plugin, folder, "");
      });
    });

    fileMenu.addItem((menuItem) => {
      menuItem.setIcon("folder-plus");
      menuItem.setTitle(i18n.buttons.createFolder);
      menuItem.onClick((ev: MouseEvent) => {
        let vaultChangeModal = new VaultChangeModal(
          props.plugin,
          folder,
          "create folder",
          "/"
        );
        vaultChangeModal.open();
      });
    });

    if (isMouseEvent(e)) {
      fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
    } else {
      fileMenu.showAtPosition({
        // @ts-ignore
        x: e.nativeEvent.locationX,
        // @ts-ignore
        y: e.nativeEvent.locationY,
      });
    }
    return false;
  };
  const showFMMenu = (e: React.MouseEvent) => {
    const menu = new Menu();

    menu.addItem((menuItem) => {
      menuItem.setIcon("log-in");
      menuItem.setTitle(i18n.menu.mergeProperties);
      menuItem.onClick(() => {
        showMergeColumnModal();
      });
    });

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    menu.showAtPosition({ x: offset.left, y: offset.top + 30 });
  };
  const mergeColumn = (fromCol: MDBColumn, toCol: MDBColumn) => {
    const fromTable =
      fromCol.table == "" ? tableData : contextTable[fromCol.table];
    if (toCol.table == "") {
      saveDB({
        ...tableData,
        rows: tableData.rows.map((r, i) => {
          const foundRow = fromTable.rows.find((f) => f.File == r.File);
          return foundRow ? { ...r, [toCol.name]: foundRow[fromCol.name] } : r;
        }),
      });
    } else {
      saveContextDB(
        {
          ...contextTable[toCol.table],
          rows: contextTable[toCol.table].rows.map((r, i) => {
            const foundRow = fromTable.rows.find((f) => f.File == r.File);
            return foundRow
              ? { ...r, [toCol.name]: foundRow[fromCol.name] }
              : r;
          }),
        },
        toCol.table
      );
    }
  };
  const showMergeColumnModal = () => {
    let vaultChangeModal = new MergeColumnModal(
      [
        ...(filteredCols?.map((f) => ({ ...f, table: "" })) ?? []),
        ...tagContexts.reduce(
          (p, c) => [
            ...p,
            ...(contextTable[c]?.cols
              .filter(
                (f) =>
                  f.name != FilePropertyName &&
                  f.hidden != "true" &&
                  f.type != "fileprop"
              )
              .map((f) => ({ ...f, table: c })) ?? []),
          ],
          []
        ),
      ],
      mergeColumn
    );
    vaultChangeModal.open();
  };

  const showSaveViewModal = () => {
    let vaultChangeModal = new SaveViewModal(schema, saveSchema, "new view");
    vaultChangeModal.open();
  };

  const editViewModal = () => {
    let vaultChangeModal = new SaveViewModal(schema, saveSchema, "rename view");
    vaultChangeModal.open();
  };

  const selectFilterValue = (e: React.MouseEvent, filter: Filter) => {
    switch (filterFnTypes[filter.fn].valueType) {
      case "text":
      case "number":
        {
          const menu = new Menu();
          menu.setUseNativeMenu(false);
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
          menu.addItem((menuItem) => {
            inputMenuItem(menuItem, filter.value, (value) =>
              saveFilterValue(value)
            );
            menuItem.setIcon("type");
          });
          const offset = (e.target as HTMLElement).getBoundingClientRect();
          menu.showAtPosition({ x: offset.left, y: offset.top + 30 });
        }
        break;
      case "date": {
        const saveValue = (date: Date) => {
          const newFilter: Filter = {
            ...filter,
            value: date.valueOf().toString(),
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
            showSelectMenu(
              { x: offset.left, y: offset.top + 30 },
              {
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
            showSelectMenu(
              { x: offset.left, y: offset.top + 30 },
              {
                multi: true,
                editable: false,
                value: parseMultiString(filter.value),
                options:
                  contextData.map((f) => ({
                    name: filePathToString(f[FilePropertyName]),
                    value: f[FilePropertyName],
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
          {views.map((f) => (
            <div
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
            <SearchBar setSearchString={setSearchString}></SearchBar>

            <button
              onClick={(e) => showFilterMenu(e)}
              dangerouslySetInnerHTML={{
                __html: uiIconSet["mk-ui-view-options"],
              }}
            ></button>
            {/* <button onClick={(e) => showColsMenu(e)} dangerouslySetInnerHTML={{__html: uiIconSet['mk-ui-options']}}></button> */}
            {dbSchema?.primary && (
              <button
                onClick={(e) => showColsMenu(e)}
                dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-build"] }}
              ></button>
            )}

            {contextInfo.type == "folder" && dbSchema?.id == "files" && (
              <button
                className="mk-button-new"
                onClick={(e) => showAddMenu(e)}
                dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-plus"] }}
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
                dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
              ></div>
            </div>
          )}
          {predicate.sort.map((f) => (
            <div className="mk-filter">
              <span>{f.field}</span>
              <span onClick={(e) => changeSortMenu(e, f)}>
                {sortFnTypes[f.fn].label}
              </span>
              <div
                onClick={() => removeSort(f)}
                dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
              ></div>
            </div>
          ))}
          {predicate.filters.map((f) => (
            <div className="mk-filter">
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
                dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
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
  } else if (filter.value.length == 0) {
    return <span onClick={(e) => selectFilterValue(e, filter)}>Select</span>;
  } else if (
    fieldType.startsWith("option") ||
    fieldType.startsWith("context")
  ) {
    const options = parseMultiString(filter.value);
    return (
      <span onClick={(e) => selectFilterValue(e, filter)}>
        {" "}
        {options.map((f) => (
          <span>{f}</span>
        ))}
      </span>
    );
  }
  return (
    <span onClick={(e) => selectFilterValue(e, filter)}>{filter.value}</span>
  );
};
