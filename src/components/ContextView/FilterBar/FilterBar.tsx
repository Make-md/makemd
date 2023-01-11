import {
  inputMenuItem,
  showSelectMenu
} from "components/ui/menus/menuItems";
import { showDatePickerMenu } from "components/ui/menus/datePickerMenu";
import { MergeColumnModal } from "components/ui/modals/mergeColumnModal";
import { SaveViewModal } from "components/ui/modals/saveViewModal";
import "css/FilterBar.css";
import { isMouseEvent } from "hooks/useLongPress";
import i18n from "i18n";
import { uniq } from "lodash";
import MakeMDPlugin from "main";
import {
  Menu, TFile
} from "obsidian";
import { getAPI } from "obsidian-dataview";
import React, { useContext, useRef } from "react";
import { defaultTableFields } from "schemas/mdb";
import { DBTable, MDBColumn, MDBSchema } from "types/mdb";
import {
  frontMatterForFile,
  frontMatterKeys,
  guestimateTypes,
  mergeTableData,
  parseFrontMatter,
  saveContextToFile
} from "utils/contexts/fm";
import { Filter, filterFnTypes } from "utils/contexts/predicate/filter";
import { Sort, sortFnTypes } from "utils/contexts/predicate/sort";
import { getAbstractFileAtPath } from "utils/file";
import { uiIconSet } from "utils/icons";
import { sanitizeTableName } from "utils/sanitize";
import {
  filePathToString, uniqCaseInsensitive,
  uniqueNameFromString
} from "utils/tree";
import {
  defaultPredicateFnForType, predicateFnsForType,
  splitString
} from "../../../utils/contexts/predicate/predicate";
import { MDBContext } from "../MDBContext";
import { SearchBar } from "./SearchBar";
import { TagSelector } from "./TagSelector";

export const FilterBar = (props: {
  plugin: MakeMDPlugin;
  folderNoteName?: string;
  folderNoteOpen?: boolean;
  viewFolderNote?: (open: boolean) => void;
}) => {
  const { folderNoteOpen, viewFolderNote } = props;
  const ctxRef = useRef(null);
  const {
    tables,
    data,
    setDBSchema,
    loadContextFields,
    cols,
    isFolderContext,
    deleteSchema,
    saveSchema,
    saveDB,
    saveContextDB,
    setSchema,
    setSearchString,
    predicate,
    tagContexts,
    savePredicate,
    schema,
    dbSchema,
    dbPath,
    contextTable,
    tableData,
  } = useContext(MDBContext);
  const filteredCols = cols.filter((f) => f.hidden != "true");
  const dataViewAPI = getAPI();
  const saveViewType = (type: string) => {
    saveSchema({
      ...schema,
      type: type,
    });
  };

  const selectView = (_dbschema: MDBSchema, value?: string) => {
    viewFolderNote && folderNoteOpen && viewFolderNote(false);
    setDBSchema(_dbschema);
    value && setSchema(tables.find((f) => f.id == value));
  };
  const openView = (e: React.MouseEvent, _dbschema: MDBSchema) => {
    const views = tables.filter((f) => f.type != "db" && f.def == _dbschema.id);
    if (views.length == 0) {
      selectView(_dbschema);
      return;
    }
    selectView(_dbschema, views[0].id);
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
    menu.addItem((item) => {
      item.setTitle(i18n.menu.flowView);
      item.setIcon("infinity");
      item.onClick(() => {
        saveViewType("flow");
      });
    });
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
        type,
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
              type,
              value: "true",
            }
          : {
              field,
              type,
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
        type,
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
        saveOptions: addFilter,
        placeholder: i18n.labels.propertyItemSelectPlaceholder,
        searchable: false,
        showAll: true,
      }
    );
  };

  const changeFilterMenu = (e: React.MouseEvent, filter: Filter) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const saveFilter = (_: string[], newType: string[]) => {
      const type = newType[0];
      const newFilter: Filter = {
        ...filter,
        type,
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
          name: filterFnTypes[f].label,
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
        options: filteredCols.map((f) => ({
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

  const showFMMenu = (e: React.MouseEvent) => {
    const saveFM = () => {
      data.forEach((f) => {
        const file = getAbstractFileAtPath(app, f.File);
        if (file && file instanceof TFile) {
          saveContextToFile(file, cols, f);
        }
      });
    };
    const getFM = async () => {
      const table = tableData;
      const files = data.map((c) => c.File);

      const importDV = (files: string[]): DBTable => {
        return files.reduce(
          (p, c) => {
            const dvValues = dataViewAPI.page(c);
            const fmKeys = uniqCaseInsensitive(
              Object.keys(dvValues ?? {})
                .filter((f, i, self) =>
                  !self.find(
                    (g, j) =>
                      g.toLowerCase().replace(/\s/g, "-") ==
                        f.toLowerCase().replace(/\s/g, "-") && i > j
                  )
                    ? true
                    : false
                )
                .filter((f) => f != "file")
            );
            return {
              uniques: [],
              cols: uniqCaseInsensitive([...p.cols, ...fmKeys]),
              rows: [
                ...p.rows,
                {
                  File: c,
                  ...fmKeys.reduce(
                    (p, c) => ({
                      ...p,
                      [c]: parseFrontMatter(c, dvValues[c], true),
                    }),
                    {}
                  ),
                },
              ],
            };
          },
          { uniques: [], cols: [], rows: [] }
        );
      };
      const importYAML = (files: string[]): DBTable => {
        return files
          .map((f) => getAbstractFileAtPath(app, f))
          .filter((f) => f)
          .reduce(
            (p, c) => {
              const fm = frontMatterForFile(c);
              const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm));

              return {
                uniques: [],
                cols: uniq([...p.cols, ...fmKeys]),
                rows: [
                  ...p.rows,
                  {
                    File: c.path,
                    ...fmKeys.reduce(
                      (p, c) => ({
                        ...p,
                        [c]: parseFrontMatter(c, fm[c], false),
                      }),
                      {}
                    ),
                  },
                ],
              };
            },
            { uniques: [], cols: [], rows: [] }
          );
      };

      const yamlTableData = dataViewAPI ? importDV(files) : importYAML(files);
      const yamlTypes = guestimateTypes(files, dataViewAPI ? true : false);
      const newTable = mergeTableData(table, yamlTableData, yamlTypes);
      saveDB(newTable);
    };
    const menu = new Menu();
    if (dataViewAPI) {
      menu.addItem((menuItem) => {
        menuItem.setIcon("file-up");
        menuItem.setTitle(i18n.menu.importDataview);
        menuItem.onClick(() => {
          getFM();
        });
      });
    }
    //@ts-ignore
    if (app.fileManager.processFrontMatter) {
      menu.addItem((menuItem) => {
        menuItem.setIcon("file-down");
        menuItem.setTitle(i18n.menu.saveAllProperties);
        menuItem.onClick(() => {
          saveFM();
        });
      });
    }

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
                  f.name != "File" && f.hidden != "true" && f.type != "fileprop"
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

  const selectFilterValue = (e: React.MouseEvent, filter: Filter) => {
    switch (filterFnTypes[filter.type].valueType) {
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
              value: values.join(","),
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
                value: splitString(filter.value),
                options: splitString(col.value).map((f) => ({
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
                value: splitString(filter.value),
                options:
                  contextData.map((f) => ({
                    name: filePathToString(f["File"]),
                    value: f["File"],
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

  const saveNewSchemas = (_schema: MDBSchema) => {
    const newSchema = {
      ..._schema,
      id: uniqueNameFromString(
        sanitizeTableName(_schema.id),
        tables.map((f) => f.id)
      ),
    };
    saveSchema(newSchema).then((f) =>
      saveDB({
        schema: newSchema,
        cols: defaultTableFields.map((f) => ({ ...f, schemaId: newSchema.id })),
        rows: [],
      })
    );
  };
  const newTable = (e: React.MouseEvent) => {
    let vaultChangeModal = new SaveViewModal(
      {
        id: "",
        name: "",
        type: "db",
      },
      saveNewSchemas,
      "new table"
    );
    vaultChangeModal.open();
  };

  const viewContextMenu = (e: React.MouseEvent, _schema: MDBSchema) => {
    const fileMenu = new Menu();

    fileMenu.addSeparator();
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle("Rename Table");
      menuItem.onClick(() => {
        let vaultChangeModal = new SaveViewModal(
          _schema,
          (s) => saveSchema(s),
          "rename table"
        );
        vaultChangeModal.open();
      });
    });
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle("Delete Table");
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
  return (
    <>
      {isFolderContext && <TagSelector plugin={props.plugin}></TagSelector>}
      <div className="mk-view-selector">
        <div className="mk-table-selector">
          {viewFolderNote && (
            <button
              className={`mk-folder-note ${
                folderNoteOpen ? "mk-is-active" : ""
              }`}
              onClick={() => viewFolderNote(true)}
            >
              {props.folderNoteName}
            </button>
          )}
          {tables
            .filter((f) => f.type == "db")
            .map((f) => (
              <div
                className={`${
                  !folderNoteOpen && dbSchema?.id == f.id ? "mk-is-active" : ""
                }`}
                onContextMenu={(e) => !f.primary && viewContextMenu(e, f)}
              >
                <button onClick={(e) => openView(e, f)}>{f.name}</button>
                {tables.filter((g) => g.type != "db" && g.def == f.id).length >
                  1 && (
                  <button
                    className="mk-icon-xsmall mk-collapse"
                    onClick={(e) => showViewMenu(e, f)}
                    dangerouslySetInnerHTML={{
                      __html: uiIconSet["mk-ui-collapse"],
                    }}
                  ></button>
                )}
              </div>
            ))}
          {isFolderContext && (
            <button onClick={(e) => newTable(e)}>+ Table</button>
          )}
        </div>
        <span></span>
        {!props.folderNoteOpen && (
          <div className="mk-view-options">
            <SearchBar setSearchString={setSearchString}></SearchBar>

            <button
              onClick={(e) => showFilterMenu(e)}
              dangerouslySetInnerHTML={{
                __html: uiIconSet["mk-ui-view-options"],
              }}
            ></button>
            {/* <button onClick={(e) => showColsMenu(e)} dangerouslySetInnerHTML={{__html: uiIconSet['mk-ui-options']}}></button> */}
            <button
              onClick={(e) => showFMMenu(e)}
              dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-options"] }}
            ></button>
          </div>
        )}
      </div>
      {(predicate.filters.length > 0 ||
        predicate.sort.length > 0 ||
        predicate.groupBy.length > 0) &&
        !folderNoteOpen && (
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
                  {sortFnTypes[f.type].label}
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
                  {filterFnTypes[f.type].label}
                </span>
                <FilterValueSpan
                  col={cols.find((c) => c.name + c.table == f.field)}
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
            <button
              className="mk-filter-add mk-icon-small"
              onClick={() => showSaveViewModal()}
            >
              <div
                dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-stack"] }}
              ></div>
              Save View
            </button>
          </div>
        )}
    </>
  );
};

const FilterValueSpan = (props: {
  filter: Filter;
  selectFilterValue: (e: React.MouseEvent, f: Filter) => void;
  col: MDBColumn;
}) => {
  const { filter, selectFilterValue } = props;
  const fieldType = props.col?.type;
  if (fieldType == "boolean" || !fieldType) {
    return <></>;
  } else if (filter.value.length == 0) {
    return <span onClick={(e) => selectFilterValue(e, filter)}>Select</span>;
  } else if (
    fieldType.startsWith("option") ||
    fieldType.startsWith("context")
  ) {
    const options = splitString(filter.value);
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
