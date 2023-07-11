import { allMetadataForFiles } from "components/ContextView/ContextBuilder/BuilderMetadataFields";
import { showDatePickerMenu } from "components/ui/menus/datePickerMenu";
import { inputMenuItem, showSelectMenu } from "components/ui/menus/menuItems";
import i18n from "i18n";
import MakeMDPlugin from "main";
import { Menu, TFile } from "obsidian";
import React, {
  forwardRef,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { retrieveAllFiles } from "superstate/spacesStore/spaces";
import { fileMeta, fileProps } from "types/metadata";
import {
  SpaceDef,
  SpaceDefFilter,
  SpaceDefGroup,
  SpaceDefType,
} from "types/space";
import { filterFnLabels } from "utils/contexts/predicate/filterFns/filterFnLabels";
import { filterFnTypes } from "utils/contexts/predicate/filterFns/filterFnTypes";
import { predicateFnsForType } from "utils/contexts/predicate/predicate";
import {
  getAbstractFileAtPath,
  getAllAbstractFilesInVault,
  getAllFoldersInVault,
  getFolderName,
} from "utils/file";
import { uiIconSet } from "utils/icons";
import { guestimateTypes } from "utils/metadata/frontmatter/fm";
import { loadTags } from "utils/metadata/tags";
import { parseMultiString } from "utils/parser";
import { serializeMultiString } from "utils/serializer";
import { fileNameToString } from "utils/strings";
import { FilterValueSpan } from "../ContextView/FilterBar/FilterBar";

const SpaceEditor = forwardRef(
  (
    props: {
      plugin: MakeMDPlugin;
      def?: SpaceDef;
    },
    ref: any
  ) => {
    const [def, setDef] = useState<SpaceDef>(
      props.def ?? {
        type: "smart",
        folder: "",
        filters: [{ type: "any", trueFalse: true, filters: [] }],
      }
    );
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
            const menu = new Menu();
            menu.setUseNativeMenu(false);

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
            saveFilterValue(date.valueOf().toString());
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
              options = loadTags(props.plugin).map((f) => ({
                value: f,
                name: f,
              }));
            } else if (fieldType.startsWith("links")) {
              options = getAllAbstractFilesInVault(props.plugin, app).map(
                (f) => ({
                  name: fileNameToString(f.name),
                  value: f.path,
                  description: f.path,
                })
              );
            }
            const offset = (e.target as HTMLElement).getBoundingClientRect();
            showSelectMenu(
              { x: offset.left, y: offset.top + 30 },
              {
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
      setDef({
        ...def,
        filters: [
          ...def.filters,
          {
            type: "any",
            trueFalse: true,
            filters: [],
          },
        ],
      });
    };
    const removeDefGroup = (groupIndex: number) => {
      setDef({
        ...def,
        filters: def.filters.filter((f, i) => (i == groupIndex ? false : true)),
      });
    };

    const typeForField = (type: SpaceDefType, field: string) => {
      if (type == "frontmatter") {
        return "text";
      }
      if (type == "filemeta") {
        return fileMeta[field].vType;
      }
      if (type == "fileprop") {
        return fileProps[field].vType;
      }
      return "text";
    };
    const setDefFilter = (
      filter: string,
      groupIndex: number,
      filterIndex: number
    ) => {
      let type: SpaceDefType;
      let field: string;
      let fType: string;
      const filterTuple = filter.split(".");
      type = filterTuple[0] as SpaceDefType;
      if (type == "frontmatter") {
        fType = filterTuple[1];
        field = filterTuple[2];
      } else {
        field = filterTuple[1];
        fType = typeForField(type, field);
      }
      if (def.filters.length == 0) {
        setDef({
          ...def,
          filters: [
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
          ],
        });
        return;
      }
      if (def.filters[groupIndex]?.filters.length == 0) {
        setDef({
          ...def,
          filters: def.filters.map((f, i) =>
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
          ),
        });
        return;
      }

      setDef({
        ...def,
        filters: def.filters.map((f, i) =>
          i == groupIndex
            ? {
                ...f,
                filters: f.filters.map((g, k) =>
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
        ),
      });
    };
    const setDefFilterFn = (
      fn: string,
      groupIndex: number,
      filterIndex: number
    ) => {
      setDef({
        ...def,
        filters: def.filters.map((f, i) =>
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
        ),
      });
    };
    const setDefFilterValue = (
      value: string,
      groupIndex: number,
      filterIndex: number
    ) => {
      setDef({
        ...def,
        filters: def.filters.map((f, i) =>
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
        ),
      });
    };
    const addDefFilter = (groupIndex: number) => {
      if (groupIndex == 0 && def.filters.length == 0) {
        setDef({
          ...def,
          filters: [
            {
              type: "any",
              trueFalse: true,
              filters: [
                {
                  type: "" as SpaceDefType,
                  fType: "",
                  field: "",
                  value: "",
                  fn: "",
                },
              ],
            },
          ],
        });
      } else {
        setDef({
          ...def,
          filters: def.filters.map((f, i) =>
            i == groupIndex
              ? {
                  ...f,
                  filters: [
                    ...f.filters,
                    {
                      type: "" as SpaceDefType,
                      fType: "",
                      field: "",
                      value: "",
                      fn: "",
                    },
                  ],
                }
              : f
          ),
        });
      }
    };
    const removeDefFilter = (filterIndex: number, groupIndex: number) => {
      setDef({
        ...def,
        filters: def.filters.map((f, i) =>
          i == groupIndex
            ? {
                ...f,
                filters: f.filters.filter((g, k) =>
                  k == filterIndex ? false : true
                ),
              }
            : f
        ),
      });
    };
    const setGroupType = (groupIndex: number, type: "any" | "all") => {
      if (groupIndex == 0 && def.filters.length == 0) {
        setDef({
          ...def,
          filters: [
            {
              type: type,
              trueFalse: true,
              filters: [],
            },
          ],
        });
      } else {
        setDef({
          ...def,
          filters: def.filters.map((f, i) =>
            i == groupIndex
              ? {
                  ...f,
                  type: type,
                }
              : f
          ),
        });
      }
    };
    const selectGroupType = (e: React.MouseEvent, i: number) => {
      const offset = (e.target as HTMLElement).getBoundingClientRect();
      const filters = ["any", "all"];
      showSelectMenu(
        { x: offset.left, y: offset.top + 30 },
        {
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
      const { type, field, fType } = def.filters[i].filters[k];
      const filters = predicateFnsForType(fType, filterFnTypes);
      showSelectMenu(
        { x: offset.left, y: offset.top + 30 },
        {
          multi: false,
          editable: true,
          value: [],
          options: filters.map((f) => ({ name: filterFnLabels[f], value: f })),
          saveOptions: (_, value) => setDefFilterFn(value[0], i, k),
          placeholder: i18n.labels.contextItemSelectPlaceholder,
          searchable: true,
          showAll: true,
        }
      );
    };
    const selectField = (e: React.MouseEvent, i: number, k: number) => {
      const offset = (e.target as HTMLElement).getBoundingClientRect();
      const allFiles = retrieveAllFiles(
        props.plugin.index.vaultDBCache,
        props.plugin.settings
      );
      const frontmatter = allMetadataForFiles(
        props.plugin,
        allFiles
          .map((f) => getAbstractFileAtPath(app, f.path))
          .filter((f) => f instanceof TFile) as TFile[]
      );
      const fmTypes = guestimateTypes(
        allFiles.map((f) => f.path),
        props.plugin,
        false
      );
      const f = [
        ...Object.keys(fileMeta).map((f) => ({
          name: fileMeta[f].label,
          value: "filemeta." + f,
        })),
        ...Object.keys(fileProps).map((f) => ({
          name: fileProps[f].label,
          value: "fileprop." + f,
        })),
        ...frontmatter.map((f) => ({
          name: f.name,
          value: "frontmatter." + fmTypes[f.name] + "." + f.name,
        })),
      ];

      showSelectMenu(
        { x: offset.left, y: offset.top + 30 },
        {
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
    useEffect(() => {
      ref.current = def;
    }, [def]);
    return (
      <div className="mk-space-settings">
        {def.type == "smart" ? (
          <div className="mk-query">
            {def.filters.length == 0 ? (
              <DefFilterGroup
                selectGroupType={selectGroupType}
                group={null}
                addDefGroup={addDefGroup}
                addDefFilter={addDefFilter}
                selectField={selectField}
                i={0}
                removeDefGroup={removeDefGroup}
              ></DefFilterGroup>
            ) : (
              def.filters.map((f, i) => (
                <DefFilterGroup
                  key={i}
                  group={f}
                  selectGroupType={selectGroupType}
                  addDefGroup={addDefGroup}
                  addDefFilter={addDefFilter}
                  selectField={selectField}
                  i={i}
                  removeDefGroup={removeDefGroup}
                >
                  {f.filters.map((filter, k) => (
                    <DefFilter
                      key={k}
                      filter={filter}
                      i={i}
                      k={k}
                      selectField={selectField}
                      selectFilter={selectFilter}
                      selectFilterValue={selectFilterValue}
                      addDefFilter={addDefFilter}
                      removeDefFilter={removeDefFilter}
                    ></DefFilter>
                  ))}
                </DefFilterGroup>
              ))
            )}
          </div>
        ) : (
          <div className="setting-item mod-toggle">
            <div className="setting-item-info">
              <div className="setting-item-name">Sync to Folder</div>
              <div className="setting-item-description">
                Select a folder to sync this space with all notes from a folder
                <br></br>
                Note: Existing items in the space will be removed from the
                space.
              </div>
            </div>
            <div className="setting-item-control">
              <button
                onClick={(e) => {
                  const offset = (
                    e.target as HTMLElement
                  ).getBoundingClientRect();
                  showSelectMenu(
                    { x: offset.left, y: offset.top + 30 },
                    {
                      multi: false,
                      editable: false,
                      value: [],
                      options: [
                        { name: "None", value: "" },
                        ...getAllFoldersInVault(app).map((f) => ({
                          name: getFolderName(f.path, app),
                          description: f.path,
                          value: f.path,
                        })),
                      ],
                      saveOptions: (_, values) => {
                        setDef((prev) => ({ ...prev, folder: values[0] }));
                      },
                      searchable: true,
                    }
                  );
                }}
              >
                {def.folder?.length > 0
                  ? getFolderName(def.folder, app)
                  : "None"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

SpaceEditor.displayName = "SpaceEditor";

export default SpaceEditor;

const DefFilter = (props: {
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
  addDefFilter: (i: number) => void;
  removeDefFilter: (k: number, i: number) => void;
}) => {
  const {
    filter,
    selectField,
    selectFilter,
    selectFilterValue,
    addDefFilter,
    removeDefFilter,
    i,
    k,
  } = props;
  return (
    <div className="mk-query-filter">
      <div className="mk-filter">
        <span onClick={(e) => selectField(e, i, k)}>
          {filter.field.length == 0 ? "Select" : filter.field}
        </span>
        {filter.field.length > 0 && (
          <span onClick={(e) => selectFilter(e, i, k)}>
            {!filterFnLabels[filter.fn] ? "Select" : filterFnLabels[filter.fn]}
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
      </div>
      <span></span>
      <button aria-label={i18n.buttons.addTag} onClick={(e) => addDefFilter(i)}>
        <div
          className="mk-icon-xsmall"
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-plus"] }}
        ></div>
      </button>
      <button onClick={() => removeDefFilter(k, i)}>
        <div
          className="mk-icon-xsmall"
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
        ></div>
      </button>
    </div>
  );
};
const DefFilterGroup = (
  props: PropsWithChildren<{
    group: SpaceDefGroup;
    addDefGroup: () => void;
    selectGroupType: (e: React.MouseEvent, i: number) => void;
    selectField: (e: React.MouseEvent, i: number, k: number) => void;
    addDefFilter: (i: number) => void;
    i: number;
    removeDefGroup: (i: number) => void;
  }>
) => {
  const {
    group,
    selectGroupType,
    addDefGroup,
    addDefFilter,
    selectField,
    i,
    removeDefGroup,
  } = props;
  return (
    <div className="mk-query-group">
      <div className="mk-query-group-type">
        <div className="mk-filter">
          Match{" "}
          <span onClick={(e) => selectGroupType(e, i)}>
            {group?.type ?? "any"}
          </span>{" "}
          of the following
        </div>
        <span></span>
        <button aria-label={i18n.buttons.addTag} onClick={(e) => addDefGroup()}>
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-plus"] }}
          ></div>
        </button>
        {i > 0 ? (
          <button onClick={() => removeDefGroup(i)}>
            <div
              className="mk-icon-xsmall"
              dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
            ></div>
          </button>
        ) : (
          <></>
        )}
      </div>
      <div className="mk-filter-bar mk-query-filters">
        {!group || group.filters.length == 0 ? (
          <div className="mk-query-filter">
            <div className="mk-filter">
              <span onClick={(e) => selectField(e, i, 0)}>Select</span>
            </div>
            <span></span>
            <button
              aria-label={i18n.buttons.addTag}
              onClick={(e) => addDefFilter(i)}
            >
              <div
                className="mk-icon-xsmall"
                dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-plus"] }}
              ></div>
            </button>
          </div>
        ) : (
          <>{props.children}</>
        )}
      </div>
    </div>
  );
};
