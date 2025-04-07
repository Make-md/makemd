import classNames from "classnames";
import { PathCrumb } from "core/react/components/UI/Crumbs/PathCrumb";
import { showNewPropertyMenu } from "core/react/components/UI/Menus/contexts/newSpacePropertyMenu";
import { showPropertyMenu } from "core/react/components/UI/Menus/contexts/spacePropertyMenu";
import {
  defaultMenu,
  menuInput,
  menuSeparator,
} from "core/react/components/UI/Menus/menu/SelectionMenu";
import { showSpaceAddMenu } from "core/react/components/UI/Menus/navigator/showSpaceAddMenu";
import {
  DatePickerTimeMode,
  showDatePickerMenu,
} from "core/react/components/UI/Menus/properties/datePickerMenu";
import { showLinkMenu } from "core/react/components/UI/Menus/properties/linkMenu";
import { showSetValueMenu } from "core/react/components/UI/Menus/properties/propertyMenu";
import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { filterFnLabels } from "core/utils/contexts/predicate/filterFns/filterFnLabels";
import { filterFnTypes } from "core/utils/contexts/predicate/filterFns/filterFnTypes";
import {
  defaultPredicateFnForType,
  defaultPredicateForSchema,
  predicateFnsForType,
} from "core/utils/contexts/predicate/predicate";
import { sortFnTypes } from "core/utils/contexts/predicate/sort";
import { formatDate } from "core/utils/date";
import { nameForField } from "core/utils/frames/frames";
import { isPhone } from "core/utils/ui/screen";
import { SelectOption, SelectOptionType, Superstate, i18n } from "makemd-core";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { fieldTypeForField, stickerForField } from "schemas/mdb";
import { defaultContextSchemaID } from "shared/schemas/context";
import { FrameEditorMode } from "shared/types/frameExec";
import { SpaceProperty, SpaceTableColumn } from "shared/types/mdb";
import { Rect } from "shared/types/Pos";
import { Filter, Predicate, Sort } from "shared/types/predicate";
import { windowFromDocument } from "shared/utils/dom";
import { parseMultiString } from "utils/parsers";
import { parseMDBStringValue } from "utils/properties";
import { serializeMultiString } from "utils/serializers";
import { ContextTitle } from "./ContextTitle";
import { ListSelector } from "./ListSelector";
import { SearchBar } from "./SearchBar";

export const FilterBar = (props: {
  superstate: Superstate;
  showTitle?: boolean;
  setView?: (view: string) => void;
  minMode?: boolean;
}) => {
  const { spaceState: spaceCache } = useContext(SpaceContext);
  const { readMode } = useContext(PathContext);
  const {
    source,
    dbSchema,
    cols,
    setSearchString,
    setEditMode,
    predicate,
    savePredicate,
    hideColumn,
    delColumn,
    saveColumn,
  } = useContext(ContextEditorContext);

  const { frameSchema, saveSchema, setFrameSchema } =
    useContext(FramesMDBContext);
  const [searchActive, setSearchActive] = useState(false);

  const properties = spaceCache?.propertyTypes ?? [];
  const propertiesForPredicate = async (
    _predicate: Predicate,
    frame: "listView" | "listGroup" | "listItem"
  ) => {
    if (_predicate.view == "table") return [];
    if (
      _predicate.view == "day" ||
      _predicate.view == "week" ||
      _predicate.view == "month"
    ) {
      if (frame != "listView") return [];
      return [
        {
          name: "start",
          type: "option",
          value: JSON.stringify({
            alias: "Start Time Property",
            source: `$properties`,
            sourceProps: {
              type: "date",
            },
            required: true,
          }),
        },
        {
          name: "end",
          type: "option",
          value: JSON.stringify({
            alias: "End Time Property",
            source: `$properties`,
            sourceProps: {
              type: "date",
            },
          }),
        },
        {
          name: "repeat",
          type: "option",
          value: JSON.stringify({
            alias: "Repeat Property",
            source: `$properties`,
            sourceProps: {
              type: "object",
              typeName: "Repeat",
            },
          }),
        },
        {
          name: "startOfDay",
          type: "number",
          value: JSON.stringify({
            alias: "Start of Day",
          }),
        },
        {
          name: "endOfDay",
          type: "number",
          value: JSON.stringify({
            alias: "End of Day",
          }),
        },
        {
          name: "date",
          type: "date",
          value: JSON.stringify({
            alias: "Start Date",
          }),
        },
        {
          name: "hideHeader",
          type: "boolean",
          value: JSON.stringify({
            alias: "Hide Header",
          }),
        },
      ];
    }
    let path = _predicate?.[frame];
    if (!path || path.length == 0) {
      if (frame == "listView") {
        path = "spaces://$kit/#*listView";
      }
      if (frame == "listGroup") {
        path = "spaces://$kit/#*listGroup";
      }
      if (frame == "listItem") {
        path = "spaces://$kit/#*rowItem";
      }
    }
    const uri = props.superstate.spaceManager.uriByString(path);
    if (uri.authority == "$kit") {
      const node = props.superstate.kitFrames.get(uri.ref)?.node;
      if (!node) return [];
      return Object.keys(node.types)
        .map((f) => ({
          type: node.types[f],
          name: f,
          attrs: JSON.stringify(node.propsAttrs?.[f]),
          schemaId: node.schemaId,
          value: JSON.stringify(node.propsValue?.[f]),
        }))
        .filter((f) => !f.name.startsWith("_"));
    }
    return props.superstate.spaceManager
      .readFrame(uri.path, uri.ref)
      .then((g) => g?.cols.filter((f) => !f.name.startsWith("_")) ?? []);
  };

  const filteredCols = cols.filter((f) => f.hidden != "true");
  const [expanded, setExpanded] = useState(false);
  const saveViewType = (type: string) => {
    if (type == "table") {
      savePredicate({
        view: "table",
        listView: "",
        listGroup: "",
        listItem: "",
      });
    }
    if (type == "flow") {
      savePredicate({
        view: "list",
        listView: "spaces://$kit/#*listView",
        listGroup: "spaces://$kit/#*listGroup",
        listItem: "spaces://$kit/#*flowListItem",
      });
    }
    if (type == "list") {
      savePredicate({
        view: "list",
        listView: "spaces://$kit/#*listView",
        listGroup: "spaces://$kit/#*listGroup",
        listItem: "spaces://$kit/#*rowItem",
      });
    }
    if (type == "details") {
      savePredicate({
        view: "list",
        listView: "spaces://$kit/#*listView",
        listGroup: "spaces://$kit/#*listGroup",
        listItem: "spaces://$kit/#*detailItem",
      });
    }
    if (type == "board") {
      savePredicate({
        view: "list",
        listView: "spaces://$kit/#*columnView",
        listGroup: "spaces://$kit/#*columnGroup",
        listItem: "spaces://$kit/#*cardListItem",
      });
    }
    if (type == "cards") {
      savePredicate({
        view: "list",
        listView: "spaces://$kit/#*listView",
        listGroup: "spaces://$kit/#*gridGroup",
        listItem: "spaces://$kit/#*cardsListItem",
      });
    }
    if (type == "catalog") {
      savePredicate({
        view: "list",
        listView: "spaces://$kit/#*listView",
        listGroup: "spaces://$kit/#*rowGroup",
        listItem: "spaces://$kit/#*coverListItem",
      });
    }
    if (type == "gallery") {
      savePredicate({
        view: "list",
        listView: "spaces://$kit/#*listView",
        listGroup: "spaces://$kit/#*masonryGroup",
        listItem: "spaces://$kit/#*imageListItem",
      });
    }
    if (type == "calendar") {
      savePredicate({
        view: "list",
        listView: "spaces://$kit/#*calendarView",
        listGroup: "spaces://$kit/#*dateGroup",
        listItem: "spaces://$kit/#*eventItem",
      });
    }
  };

  const clearFilters = () => {
    savePredicate({
      filters: [],
      sort: [],
    });
  };
  const clearHiddenCols = () => {
    savePredicate({
      colsHidden: [],
    });
  };

  const removeFilter = (filter: Filter, index: number) => {
    const pred = predicate ?? defaultPredicateForSchema(dbSchema);
    const newFilters = [...pred.filters.filter((f, i) => i != index)];
    savePredicate({
      filters: newFilters,
    });
  };

  type LayoutType = {
    name: string;
    icon: string;
    view: string;
    listView: string;
    listGroup: string;
    listItem: string;
  };

  const defaultViewTypes: Record<string, LayoutType> = {
    table: {
      name: i18n.menu.tableView,
      icon: "ui//table",
      view: "table",
      listView: "",
      listGroup: "",
      listItem: "",
    },
    list: {
      name: i18n.menu.listView,
      icon: "ui//list",
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*listGroup",
      listItem: "spaces://$kit/#*rowItem",
    },
    details: {
      name: i18n.menu.detailsView,
      icon: "ui//layout-grid",
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*listGroup",
      listItem: "spaces://$kit/#*detailItem",
    },
    board: {
      name: i18n.menu.boardView,
      icon: "ui//square-kanban",
      view: "list",
      listView: "spaces://$kit/#*columnView",
      listGroup: "spaces://$kit/#*columnGroup",
      listItem: "spaces://$kit/#*cardListItem",
    },

    cards: {
      name: i18n.menu.cardView,
      icon: "ui//layout-dashboard",
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*gridGroup",
      listItem: "spaces://$kit/#*cardsListItem",
    },
    catalog: {
      name: i18n.menu.catalogView,
      icon: "ui//gallery-horizontal-end",
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*rowGroup",
      listItem: "spaces://$kit/#*coverListItem",
    },
    gallery: {
      name: i18n.menu.galleryView,
      icon: "ui//layout-dashboard",
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*masonryGroup",
      listItem: "spaces://$kit/#*imageListItem",
    },
    flow: {
      name: i18n.menu.flowView,
      icon: "ui//edit",
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*listGroup",
      listItem: "spaces://$kit/#*flowListItem",
    },
    day: {
      name: "Day View",
      icon: "ui//calendar",
      view: "day",
      listView: "",
      listGroup: "",
      listItem: "",
    },
    week: {
      name: "Week View",
      icon: "ui//calendar",
      view: "week",
      listView: "",
      listGroup: "",
      listItem: "",
    },
    month: {
      name: "Month View",
      icon: "ui//calendar",
      view: "month",
      listView: "",
      listGroup: "",
      listItem: "",
    },
    // calendar: {
    //   name: i18n.menu.calendarView,
    //   icon: "ui//calendar",
    //   view: "list",
    //   listView: "spaces://$kit/#*calendarView",
    //   listGroup: "spaces://$kit/#*dateGroup",
    //   listItem: "spaces://$kit/#*eventItem",
    // },
    // calendarDay: {
    //   name: i18n.menu.dayView,
    //   icon: "ui//calendar",
    //   view: "list",
    //   listView: "spaces://$kit/#*calendarView",
    //   listGroup: "spaces://$kit/#*dateGroup",
    //   listItem: "spaces://$kit/#*eventItem",
    // },
  };
  const showLayoutMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const menuOptions: SelectOption[] = [];

    Object.keys(defaultViewTypes).forEach((c) => {
      const layout = defaultViewTypes[c];
      menuOptions.push({
        name: layout.name,
        icon: layout.icon,
        onClick: (e) => {
          savePredicate({
            view: layout.view,
            listView: layout.listView,
            listGroup: layout.listGroup,
            listItem: layout.listItem,
          });
        },
      });
    });
    if (props.superstate.settings.experimental) {
      menuOptions.push({
        name: i18n.menu.customView,
        icon: "ui//brush",
        onClick: (e) => {
          setEditMode(FrameEditorMode.Group);
        },
      });
    }

    return props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };

  const selectSource = (offset: Rect, win: Window) => {
    return showSpacesMenu(offset, win, props.superstate, (link: string) => {
      const newSchema = {
        ...frameSchema,
        name: frameSchema.name,
        def: {
          db: defaultContextSchemaID,
          context: link,
        },
        type: "view",
      };
      saveSchema(newSchema).then((f) => setFrameSchema(newSchema));
    });
  };

  const selectList = (offset: Rect, win: Window) => {
    const schemas = props.superstate.contextsIndex.get(source)?.schemas;
    if (!schemas) return;
    const options: SelectOption[] = schemas.map((f) => ({
      name: f.name,
      value: f.id,
      onClick: (e) => {
        const newSchema = {
          ...frameSchema,
          name: frameSchema.name,
          def: {
            db: f.id,
            context: source,
          },
          type: "view",
        };
        saveSchema(newSchema).then((f) => setFrameSchema(newSchema));
      },
    }));
    return props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, options),
      win
    );
  };

  const [listViewOptions, setListViewOptions] = useState<SpaceProperty[]>([]);
  const [listGroupOptions, setListGroupOptions] = useState<SpaceProperty[]>([]);
  const [listItemOptions, setListItemOptions] = useState<SpaceProperty[]>([]);

  useEffect(() => {
    propertiesForPredicate(predicate, "listView").then((f) =>
      setListViewOptions(f)
    );
    propertiesForPredicate(predicate, "listGroup").then((f) =>
      setListGroupOptions(f)
    );
    propertiesForPredicate(predicate, "listItem").then((f) =>
      setListItemOptions(f)
    );
  }, [predicate]);

  const optionsMenuRef = useRef(null);
  const showViewOptionsMenu = async (
    e?: React.MouseEvent,
    update?: boolean
  ) => {
    const menuOptions: SelectOption[] = [];

    if (!readMode) {
      menuOptions.push(
        menuInput(frameSchema.name ?? "", (value) =>
          saveSchema({ ...frameSchema, name: value })
        )
      );
      menuOptions.push(menuSeparator);

      menuOptions.push({
        name: i18n.menu.properties,
        icon: "ui//list",
        type: SelectOptionType.Submenu,

        onSubmenu: (offset, onHide) => {
          return showPropertyEditMenu(
            offset,
            windowFromDocument(e.view.document),
            onHide
          );
        },
      });
    }
    menuOptions.push({
      name: i18n.menu.groupBy,
      icon: "ui//columns",
      type: SelectOptionType.Submenu,
      onSubmenu: (offset, onHide) => {
        return showGroupByMenu(
          offset,
          windowFromDocument(e.view.document),
          onHide
        );
      },
    });
    menuOptions.push({
      name: i18n.menu.sortBy,
      icon: "ui//sort-desc",
      type: SelectOptionType.Submenu,
      onSubmenu: (offset, onHide) => {
        return showSortMenu(
          offset,
          windowFromDocument(e.view.document),
          onHide
        );
      },
    });
    menuOptions.push({
      name: i18n.menu.filters,
      icon: "ui//filter",
      type: SelectOptionType.Submenu,
      onSubmenu: (rect, onHide) => {
        return showAddFilterMenu(
          rect,
          windowFromDocument(e.view.document),
          onHide
        );
      },
    });

    menuOptions.push(menuSeparator);

    const sourceSpace = props.superstate.spacesIndex.get(source);
    menuOptions.push({
      name: "Source",
      icon: "ui//table",
      type: SelectOptionType.Disclosure,
      value: sourceSpace.name,
      onSubmenu: (rect, onHide) => {
        return selectSource(rect, windowFromDocument(e.view.document));
      },
    });

    const table = dbSchema.name;
    menuOptions.push({
      name: "List",
      icon: "ui//table",
      type: SelectOptionType.Disclosure,
      value: table,
      onSubmenu: (rect, onHide) => {
        return selectList(rect, windowFromDocument(e.view.document));
      },
    });

    menuOptions.push(menuSeparator);

    const savePropValue = (
      type: "listGroupProps" | "listViewProps" | "listItemProps",
      prop: string,
      value: string
    ) => {
      savePredicate({
        [type]: {
          ...predicate[type],
          [prop]: value,
        },
      });
    };
    listViewOptions.forEach((f) => {
      menuOptions.push({
        name: nameForField(f, props.superstate),
        icon: stickerForField(f),
        type: SelectOptionType.Disclosure,
        value: predicate.listViewProps?.[f.name],
        onClick: (e) => {
          showSetValueMenu(
            (e.target as HTMLElement).getBoundingClientRect(),
            windowFromDocument(e.view.document),
            props.superstate,
            predicate.listViewProps?.[f.name],
            f,
            (value) =>
              savePropValue(
                "listViewProps",
                f.name,
                parseMDBStringValue(f.type, value, true)
              ),
            spaceCache.path,
            dbSchema.id
          );
        },
      });
    });
    listGroupOptions.forEach((f) => {
      menuOptions.push({
        name: nameForField(f, props.superstate),
        icon: stickerForField(f),
        type: SelectOptionType.Disclosure,
        value: predicate.listGroupProps?.[f.name],
        onClick: (e) => {
          showSetValueMenu(
            (e.target as HTMLElement).getBoundingClientRect(),
            windowFromDocument(e.view.document),
            props.superstate,
            predicate.listGroupProps?.[f.name],
            f,

            (value) =>
              savePropValue(
                "listGroupProps",
                f.name,
                parseMDBStringValue(f.type, value, true)
              ),
            spaceCache.path,
            dbSchema.id
          );
        },
      });
    });
    listItemOptions.forEach((f) => {
      menuOptions.push({
        name: nameForField(f, props.superstate),
        icon: stickerForField(f),
        type: SelectOptionType.Disclosure,
        value: predicate.listItemProps?.[f.name],
        onClick: (e) => {
          showSetValueMenu(
            (e.target as HTMLElement).getBoundingClientRect(),
            windowFromDocument(e.view.document),
            props.superstate,
            predicate.listItemProps?.[f.name],
            f,
            (value) =>
              savePropValue(
                "listItemProps",
                f.name,
                parseMDBStringValue(f.type, value, true)
              ),
            spaceCache.path,
            dbSchema.id
          );
        },
      });
    });

    if (update) {
      optionsMenuRef.current?.update(
        defaultMenu(props.superstate.ui, menuOptions)
      );
      return;
    }
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    optionsMenuRef.current = props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document),
      null,
      () => {
        optionsMenuRef.current = null;
      }
    );
  };

  useEffect(() => {
    if (optionsMenuRef.current) {
      showViewOptionsMenu(null, true);
    }
  }, [predicate]);

  const addSort = (_: string[], sort: string[]) => {
    const field = sort[0];
    const fieldObject = filteredCols.find((f) => f.name + f.table == field);
    const fieldType = fieldTypeForField(fieldObject);
    if (fieldType) {
      const type = defaultPredicateFnForType(fieldType, sortFnTypes);
      const newSort: Sort = {
        field,
        fn: type,
      };
      savePredicate({
        sort: [
          ...(predicate?.sort.filter((s) => s.field != newSort.field) ?? []),
          newSort,
        ],
      });
    }
  };

  const saveGroupBy = (_: string[], groupBy: string[]) => {
    savePredicate({
      groupBy: groupBy,
    });
  };

  const removeSort = (sort: Sort) => {
    const newSort = [
      ...(predicate?.sort ?? []).filter((f) => f.field != sort.field),
    ];
    savePredicate({
      sort: newSort,
    });
  };
  const addFilter = (field: string) => {
    const fieldObject = filteredCols.find((f) => f.name + f.table == field);
    const fieldType = fieldTypeForField(fieldObject);
    if (fieldType) {
      const type = defaultPredicateFnForType(fieldType, filterFnTypes);
      if (!type) return;
      const newFilter: Filter =
        fieldType == "boolean"
          ? {
              field,
              fn: type,
              fType: filterFnTypes[type].valueType,
              value: "true",
            }
          : {
              field,
              fn: type,
              fType: filterFnTypes[type].valueType,
              value: "",
            };
      savePredicate({
        filters: [...(predicate?.filters ?? []), newFilter],
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
        sort: [
          ...(predicate?.sort ?? []).filter((s) => s.field != newSort.field),
          newSort,
        ],
      });
    };
    const fieldObject = filteredCols.find(
      (f) => f.name + f.table == sort.field
    );
    const fieldType = fieldTypeForField(fieldObject);
    const sortsForType = predicateFnsForType(fieldType, sortFnTypes);
    props.superstate.ui.openMenu(
      offset,
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
      },
      windowFromDocument(e.view.document)
    );
  };

  const changeFilterMenu = (
    e: React.MouseEvent,
    filter: Filter,
    index: number
  ) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const saveFilter = (_: string[], newType: string[]) => {
      const type = newType[0];
      const newFilter: Filter = {
        ...filter,
        fn: type,
        fType: filterFnTypes[type].valueType,
      };
      savePredicate({
        filters: (predicate?.filters ?? []).map((s, i) =>
          i == index ? newFilter : s
        ),
      });
    };
    const field = filteredCols.find((f) => f.name + f.table == filter.field);
    const fieldType = fieldTypeForField(field);
    const filtersForType = predicateFnsForType(fieldType, filterFnTypes);
    props.superstate.ui.openMenu(
      offset,
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
      },
      windowFromDocument(e.view.document)
    );
  };

  const showAddFilterMenu = (offset: Rect, win: Window, onHide: () => void) => {
    const options: SelectOption[] = filteredCols
      .filter(
        (f) =>
          f.type == "fileprop" ||
          predicateFnsForType(f.type, filterFnTypes).length > 0
      )
      .map((f) => ({
        name: f.name + f.table,
        value: f.name + f.table,
        icon: stickerForField(f),
        onClick: (e) => {
          addFilter(f.name + f.table);
        },
      }));
    options.push(menuSeparator);

    options.push({
      name: i18n.menu.clearFilters,
      icon: "ui//x-square",
      onClick: (e) => {
        clearFilters();
      },
    });

    return props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: options,
        placeholder: i18n.labels.propertyItemSelectPlaceholder,
        searchable: true,
        showAll: true,
      },
      win,
      null,
      onHide
    );
  };
  const showSortMenu = (offset: Rect, win: Window, onHide: () => void) => {
    return props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: filteredCols.map((f) => ({
          name: f.name + f.table,
          icon: stickerForField(f),
          value: f.name + f.table,
        })),
        saveOptions: addSort,
        placeholder: i18n.labels.sortItemSelectPlaceholder,
        searchable: true,
        showAll: true,
      },
      win,
      "right",
      onHide
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

  const saveNewField = (source: string, field: SpaceProperty) => {
    return saveColumn({ ...field, table: "" });
  };

  const showPropertyEditMenu = (
    offset: Rect,
    win: Window,
    onHide: () => void
  ) => {
    const showPropertyEditorMenu = (
      f: SpaceTableColumn,
      offset: Rect,
      onHide: () => void
    ) => {
      return showPropertyMenu(
        {
          superstate: props.superstate,
          rect: offset,
          editable: f.primary != "true",
          win,
          options: [],
          field: f,
          fields: filteredCols,
          contextPath: spaceCache.path,
          saveField: (newField) => saveField(newField, f),
          hide: hideColumn,
          deleteColumn: delColumn,
          hidden: predicate?.colsHidden.includes(f.name + f.table),
        },
        onHide,
        true
      );
    };
    const options: SelectOption[] = [];
    options.push({
      name: i18n.labels.newProperty,
      icon: "ui//plus",
      type: SelectOptionType.Submenu,
      onSubmenu: (offset: Rect, onHide: () => void) => {
        return showNewPropertyMenu(
          props.superstate,
          offset,
          win,
          {
            spaces: [],
            fields: [],
            saveField: saveNewField,
            schemaId: dbSchema.id,
            contextPath: spaceCache.path,
          },
          onHide
        );
      },
    });
    options.push(menuSeparator);
    options.push(
      ...filteredCols
        .filter(
          (f) =>
            predicate.colsHidden.some((h) => h == f.name + f.table) == false
        )
        .map((f) => ({
          name: f.name + f.table,
          icon: stickerForField(f),
          value: f.name + f.table,
          type: SelectOptionType.Submenu,
          onSubmenu: (rect: Rect, onHide: () => void) =>
            showPropertyEditorMenu(f, rect, onHide),
        }))
    );
    options.push(menuSeparator);
    options.push(
      ...filteredCols
        .filter((f) => predicate.colsHidden.some((h) => h == f.name + f.table))
        .map((f) => ({
          name: f.name + f.table,
          icon: stickerForField(f),
          value: f.name + f.table,
          type: SelectOptionType.Submenu,
          onSubmenu: (rect: Rect, onHide: () => void) =>
            showPropertyEditorMenu(f, rect, onHide),
        }))
    );
    options.push(menuSeparator);
    options.push({
      name: i18n.menu.unhideFields,
      icon: "ui//eye",
      onClick: (e) => {
        clearHiddenCols();
      },
    });
    return props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: options,

        placeholder: i18n.labels.propertyItemSelectPlaceholder,
        searchable: false,
        showAll: true,
      },
      win,
      "right",
      onHide
    );
  };

  const showGroupByMenu = (offset: Rect, win: Window, onHide: () => void) => {
    return props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options: filteredCols.map((f) => ({
          name: f.name + f.table,
          icon: stickerForField(f),
          value: f.name + f.table,
        })),
        saveOptions: saveGroupBy,
        placeholder: i18n.labels.propertyItemSelectPlaceholder,
        searchable: false,
        showAll: true,
      },
      win,
      "right",
      onHide
    );
  };

  const selectFilterValue = (
    e: React.MouseEvent,
    filter: Filter,
    index: number
  ) => {
    switch (filter.fType ?? filterFnTypes[filter.fn].valueType) {
      case "property":
        {
          savePredicate({
            filters: (predicate?.filters ?? []).map((s, i) =>
              i == index ? filter : s
            ),
          });
        }
        break;
      case "text":
      case "number":
        {
          savePredicate({
            filters: (predicate?.filters ?? []).map((s, i) =>
              i == index ? filter : s
            ),
          });
        }
        break;
      case "date": {
        const saveValue = (date: Date) => {
          const newFilter: Filter = {
            ...filter,
            value: date ? formatDate(props.superstate.settings, date) : "",
          };
          savePredicate({
            filters: (predicate?.filters ?? []).map((s, i) =>
              i == index ? newFilter : s
            ),
          });
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
      case "link":
        {
          const col = cols.find((f) => f.name + f.table == filter.field);
          if (col?.type.startsWith("context")) {
            const space = parseFieldValue(col.value, col.type)?.space;
            if (!space) return;

            const contextData = props.superstate.getSpaceItems(space) ?? [];
            const offset = (e.target as HTMLElement).getBoundingClientRect();
            props.superstate.ui.openMenu(
              offset,
              {
                ui: props.superstate.ui,
                multi: false,
                editable: false,
                value: parseMultiString(filter.value),
                options:
                  contextData.map((f) => ({
                    name: f.name,
                    value: f.path,
                  })) ?? [],
                saveOptions: (options: string[], values: string[]) => {
                  const newFilter: Filter = {
                    ...filter,
                    value: values[0],
                  };
                  savePredicate({
                    filters: (predicate?.filters ?? []).map((s, i) =>
                      i == index ? newFilter : s
                    ),
                  });
                },
                placeholder: i18n.labels.optionItemSelectPlaceholder,
                searchable: true,
                showAll: true,
              },
              windowFromDocument(e.view.document)
            );
            return;
          }
          const saveValue = (link: string) => {
            const newFilter: Filter = {
              ...filter,
              value: link,
            };
            savePredicate({
              filters: (predicate?.filters ?? []).map((s, i) =>
                i == index ? newFilter : s
              ),
            });
          };
          const offset = (
            e.target as HTMLButtonElement
          ).getBoundingClientRect();
          showLinkMenu(
            offset,
            windowFromDocument(e.view.document),
            props.superstate,
            (link) => {
              saveValue(link);
            },
            { multi: true }
          );
          e.stopPropagation();
        }
        break;
      case "list":
        {
          const col = cols.find((f) => f.name + f.table == filter.field);
          const saveOptions = (options: string[], values: string[]) => {
            const newFilter: Filter = {
              ...filter,
              value: serializeMultiString(values),
            };
            savePredicate({
              filters: (predicate?.filters ?? []).map((s, i) =>
                i == index ? newFilter : s
              ),
            });
          };
          if (col.type.startsWith("option")) {
            const offset = (e.target as HTMLElement).getBoundingClientRect();
            const options = parseFieldValue(col.value, col.type).options;

            props.superstate.ui.openMenu(
              offset,
              {
                ui: props.superstate.ui,
                multi: true,
                editable: false,
                value: parseMultiString(filter.value),
                options: options ?? [],
                saveOptions,
                placeholder: i18n.labels.optionItemSelectPlaceholder,
                searchable: true,
                showAll: true,
              },
              windowFromDocument(e.view.document)
            );
          } else if (col.type.startsWith("context")) {
            const space = parseFieldValue(col.value, col.type)?.space;
            if (!space) return;
            const contextData = props.superstate.getSpaceItems(space) ?? [];
            const offset = (e.target as HTMLElement).getBoundingClientRect();
            props.superstate.ui.openMenu(
              offset,
              {
                ui: props.superstate.ui,
                multi: true,
                editable: false,
                value: parseMultiString(filter.value),
                options:
                  contextData.map((f) => ({
                    name: f.name,
                    value: f.path,
                  })) ?? [],
                saveOptions,
                placeholder: i18n.labels.optionItemSelectPlaceholder,
                searchable: true,
                showAll: true,
              },
              windowFromDocument(e.view.document)
            );
          } else if (col.type.startsWith("link")) {
            const offset = (e.target as HTMLElement).getBoundingClientRect();
            showLinkMenu(
              offset,
              windowFromDocument(e.view.document),
              props.superstate,
              (link) => {
                saveOptions([link], [link]);
              },
              { multi: true }
            );
            e.stopPropagation();
          } else if (col.type.startsWith("tags")) {
            const contextData = props.superstate.spaceManager.readTags();
            const offset = (e.target as HTMLElement).getBoundingClientRect();
            props.superstate.ui.openMenu(
              offset,
              {
                ui: props.superstate.ui,
                multi: true,
                editable: false,
                value: parseMultiString(filter.value),
                options:
                  contextData.map((f) => ({
                    name: f,
                    value: f,
                  })) ?? [],
                saveOptions,
                placeholder: i18n.labels.tagItemSelectPlaceholder,
                searchable: true,
                showAll: true,
              },
              windowFromDocument(e.view.document)
            );
          }
        }
        break;
    }
  };
  const missingOptions = useMemo(
    () => [
      ...listGroupOptions.filter(
        (f) =>
          parseFieldValue(f.value, f.type, props.superstate).required &&
          !(predicate.listGroupProps?.[f.name]?.length > 0)
      ),
      ...listViewOptions.filter(
        (f) =>
          parseFieldValue(f.value, f.type, props.superstate).required &&
          !(predicate.listViewProps?.[f.name]?.length > 0)
      ),
      ...listItemOptions.filter(
        (f) =>
          parseFieldValue(f.value, f.type, props.superstate).required &&
          !(predicate.listItemProps?.[f.name]?.length > 0)
      ),
    ],
    [listGroupOptions, listViewOptions, listItemOptions, predicate]
  );
  return (
    <>
      {props.minMode ? (
        <div className="mk-view-config">
          <SearchBar
            superstate={props.superstate}
            setSearchString={setSearchString}
            closeSearch={() => setSearchActive(false)}
          ></SearchBar>

          <button
            className="mk-toolbar-button"
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();

              showSortMenu(rect, windowFromDocument(e.view.document), null);
            }}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//sort-desc"),
            }}
          ></button>
          <button
            className="mk-toolbar-button"
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();

              showAddFilterMenu(
                rect,
                windowFromDocument(e.view.document),
                null
              );
            }}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//filter"),
            }}
          ></button>
        </div>
      ) : (
        <>
          {props.showTitle && (
            <div className="mk-context-config">
              <ContextTitle superstate={props.superstate}></ContextTitle>

              <span></span>

              {dbSchema?.id == defaultContextSchemaID &&
                !spaceCache.space.readOnly && (
                  <>
                    <button
                      className="mk-button-new"
                      onClick={(e) =>
                        showSpaceAddMenu(
                          props.superstate,
                          (e.target as HTMLElement).getBoundingClientRect(),
                          windowFromDocument(e.view.document),
                          spaceCache,
                          true
                        )
                      }
                      dangerouslySetInnerHTML={{
                        __html: props.superstate.ui.getSticker("ui//plus"),
                      }}
                    ></button>
                  </>
                )}
            </div>
          )}
          <div className="mk-view-config">
            {!expanded && (
              <ListSelector
                superstate={props.superstate}
                expanded={false}
                setView={props.setView}
              ></ListSelector>
            )}

            {
              <div className="mk-view-options">
                <span></span>
                {(isPhone(props.superstate.ui) || !searchActive) && (
                  <button
                    className={classNames(
                      "mk-toolbar-button",
                      searchActive && "mk-active"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchActive((f) => !f);
                    }}
                    dangerouslySetInnerHTML={{
                      __html: props.superstate.ui.getSticker("ui//search"),
                    }}
                  ></button>
                )}
                {!isPhone(props.superstate.ui) && searchActive && (
                  <SearchBar
                    superstate={props.superstate}
                    setSearchString={setSearchString}
                    closeSearch={() => setSearchActive(false)}
                  ></SearchBar>
                )}

                <button
                  className="mk-toolbar-button"
                  onClick={(e) => showLayoutMenu(e)}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//layout"),
                  }}
                ></button>
                <button
                  className="mk-toolbar-button"
                  onClick={(e) => showViewOptionsMenu(e)}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//view-options"),
                  }}
                ></button>
              </div>
            }
          </div>
          {isPhone(props.superstate.ui) && searchActive && (
            <SearchBar
              superstate={props.superstate}
              setSearchString={setSearchString}
            ></SearchBar>
          )}
        </>
      )}
      {missingOptions.length > 0 && (
        <div className="mk-view-config-warning">
          {missingOptions.map((f) => (
            <div key={f.name}>{nameForField(f, props.superstate)}</div>
          ))}
          {"are required for this layout"}
        </div>
      )}

      {(predicate?.filters.length > 0 ||
        predicate?.sort.length > 0 ||
        predicate?.groupBy.length > 0) && (
        <div className="mk-filter-bar">
          {predicate.groupBy.length > 0 && (
            <div className="mk-filter">
              <span>{i18n.menu.groupBy}</span>
              <span
                onClick={(e) =>
                  showGroupByMenu(
                    (e.target as HTMLElement).getBoundingClientRect(),
                    windowFromDocument(e.view.document),
                    null
                  )
                }
              >
                {predicate.groupBy[0]}
              </span>
              <div
                onClick={() => saveGroupBy(null, [])}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//close"),
                }}
              ></div>
            </div>
          )}
          {(predicate?.sort ?? []).map((f, i) => (
            <div key={i} className="mk-filter">
              <span>{f.field}</span>
              <span onClick={(e) => changeSortMenu(e, f)}>
                {sortFnTypes[f.fn].label}
              </span>
              <div
                onClick={() => removeSort(f)}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//close"),
                }}
              ></div>
            </div>
          ))}
          {(predicate?.filters ?? [] ?? []).map((f, i) => (
            <div key={i} className="mk-filter">
              <span>{f.field}</span>
              <span onClick={(e) => changeFilterMenu(e, f, i)}>
                {filterFnLabels[f.fn]}
              </span>
              <FilterValueSpan
                superstate={props.superstate}
                fieldType={cols.find((c) => c.name + c.table == f.field)?.type}
                filter={f}
                selectFilterValue={(e, f) => selectFilterValue(e, f, i)}
              ></FilterValueSpan>
              {properties.length > 0 && (
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
                        options: properties.map((f) => ({
                          name: f.name,
                          value: f.name,
                          section: f.type,
                        })),
                        saveOptions: (_, value) =>
                          selectFilterValue(
                            e,
                            {
                              ...f,
                              fType: "property",
                              value: value[0] as any,
                            },
                            i
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
              <div
                onClick={() => removeFilter(f, i)}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//close"),
                }}
              ></div>
            </div>
          ))}
          {(predicate?.filters ?? []).length > 0 && (
            <div
              className="mk-filter-add"
              onClick={(e) => {
                const offset = (
                  e.target as HTMLElement
                ).getBoundingClientRect();
                showAddFilterMenu(
                  offset,
                  windowFromDocument(e.view.document),
                  null
                );
              }}
            >
              <span>
                <span
                  className="mk-icon-xsmall"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//plus"),
                  }}
                ></span>
                {i18n.buttons.addFilter}
              </span>
            </div>
          )}
          <span></span>
        </div>
      )}
    </>
  );
};

export const FilterValueSpan = (props: {
  superstate: Superstate;
  filter: Filter;
  selectFilterValue: (e: React.MouseEvent, f: Filter) => void;
  fieldType: string;
}) => {
  const { filter, selectFilterValue, fieldType } = props;
  const fnType = filterFnTypes[filter.fn];
  const [value, setValue] = useState(filter.value);

  useEffect(() => setValue(filter.value), [filter.value]);
  if (filter.fType == "property") {
    return <span>{filter.value}</span>;
  }
  if (!fieldType || !fnType || fnType.valueType == "none") {
    return <></>;
  } else if (fnType.valueType == "text" || fnType.valueType == "number") {
    return (
      <input
        type="text"
        onChange={(e) => setValue(e.currentTarget.value)}
        onBlur={(e) => {
          selectFilterValue(null, { ...filter, value });
        }}
        onKeyDown={(e) => {
          if (e.key == "Escape") {
            setValue(filter.value);
            e.currentTarget.blur();
          }
          if (e.key == "Enter") {
            e.currentTarget.blur();
          }
        }}
        value={value}
      ></input>
    );
  } else if (
    fieldType.startsWith("option") ||
    fieldType.startsWith("context") ||
    fieldType.startsWith("link") ||
    fieldType.startsWith("tag")
  ) {
    const options = parseMultiString(filter.value);
    return (
      <span onClick={(e) => selectFilterValue(e, filter)}>
        {options.length == 0
          ? i18n.labels.select
          : options.map((f, i) =>
              fieldType.startsWith("option") ? (
                <span key={i}>{f}</span>
              ) : (
                <PathCrumb
                  superstate={props.superstate}
                  key={i}
                  path={f}
                ></PathCrumb>
              )
            )}
      </span>
    );
  } else if (!filter.value || filter.value.length == 0) {
    return (
      <span onClick={(e) => selectFilterValue(e, filter)}>
        {i18n.labels.select}
      </span>
    );
  }
  return (
    <span onClick={(e) => selectFilterValue(e, filter)}>{filter.value}</span>
  );
};
