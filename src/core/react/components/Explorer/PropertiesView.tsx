import { useDndMonitor } from "@dnd-kit/core";
import { showPropertiesMenu } from "core/react/components/UI/Menus/properties/propertiesMenu";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { PathContext } from "core/react/context/PathContext";
import {
  deleteProperty,
  renameProperty,
  saveProperties,
} from "core/superstate/utils/spaces";
import { updateContextValue } from "core/utils/contexts/context";
import { SelectOption, Superstate, i18n } from "makemd-core";

import { linkContextRow } from "core/utils/contexts/linkContextRow";
import React, { useContext, useEffect, useState } from "react";
import { fieldTypes } from "schemas/mdb";
import { defaultContextSchemaID } from "shared/schemas/context";
import { SpaceProperty, SpaceTableColumn } from "shared/types/mdb";
import { uniqCaseInsensitive } from "shared/utils/array";
import { windowFromDocument } from "shared/utils/dom";
import { parseProperty } from "utils/parsers";
import {
  defaultValueForType,
  detectPropertyType,
  parseMDBStringValue,
} from "utils/properties";
import { DataPropertyView } from "../SpaceView/Contexts/DataTypeView/DataPropertyView";
import { CellEditMode } from "../SpaceView/Contexts/TableView/TableView";
import { showPropertyMenu } from "../UI/Menus/contexts/spacePropertyMenu";

export const PropertiesView = (props: {
  superstate: Superstate;
  spaces: string[];
  force?: boolean;
  excludeKeys: string[];
  editable?: boolean;
  compactMode: boolean;
}) => {
  const { pathState } = useContext(PathContext);
  const [values, setValues] = useState<Record<string, string>>({});
  const [cols, setCols] = useState([]);
  const [excludeKeys, setExcludeKeys] = useState<string[]>([]);
  const { tableData, saveProperty, delProperty, saveFrame } =
    useContext(FramesMDBContext);

  // const saveField = (source: string, field: SpaceProperty) => {
  //   if (source == "$fm") {
  //     saveNewProperty(props.superstate, pathState.path, field);
  //     return;
  //   }
  //   props.superstate.spaceManager.addSpaceProperty(source, field);
  // };

  // const newProperty = (e: React.MouseEvent) => {
  //   const offset = (e.target as HTMLElement).getBoundingClientRect();
  //   showNewPropertyMenu(
  //     props.superstate,
  //     offset,
  //     [],
  //     [],
  //     saveField,
  //     defaultContextSchemaID,
  //     null,
  //     true,
  //     pathState.type == "space"
  //   );
  // };
  const refreshData = async () => {
    const pathContexts: Set<string> =
      props.superstate.spacesMap.get(pathState.path) ?? new Set();
    const columns = (
      await Promise.all(
        [...pathContexts].map(async (f) =>
          props.superstate.spaceManager
            .readTable(f, defaultContextSchemaID)
            .then((f) => f.cols ?? [])
        )
      )
    ).reduce((p, c) => [...p, ...c], []);
    const newCols = [];
    const newValues: Record<string, string> = {};
    const properties = pathState?.metadata?.property ?? {};
    const fmKeys = uniqCaseInsensitive([
      ...Object.keys(properties),
      ...(tableData?.cols?.map((f) => f.name) ?? []),
    ]).filter((f) => !columns.some((g) => g.name == f));
    const cols: SpaceTableColumn[] = fmKeys.map(
      (f) =>
        tableData?.cols?.find((g) => g.name == f) ?? {
          table: "",
          name: f,
          schemaId: "",
          type: detectPropertyType(properties[f], f),
        }
    );
    if (properties) {
      newCols.push(...cols);
      fmKeys.forEach((c) => {
        newValues[c] = parseProperty(c, properties[c]);
      });
    }

    setCols(
      newCols.filter((f) => !props.excludeKeys?.some((g) => g == f.name))
    );
    setExcludeKeys([
      ...(props.superstate.settings.hideFrontmatter
        ? columns.map((f) => f.name)
        : []),
    ]);
    setValues(
      linkContextRow(
        props.superstate.formulaContext,
        props.superstate.pathsIndex,
        props.superstate.contextsIndex,
        props.superstate.spacesMap,
        newValues,
        cols,
        pathState,
        props.superstate.settings
      )
    );
  };

  const mdbChanged = (payload: { path: string }) => {
    if (props.spaces.find((f) => f == payload.path)) {
      refreshData();
    }
  };

  useEffect(() => {
    refreshData();
    props.superstate.eventsDispatcher.addListener(
      "contextStateUpdated",
      mdbChanged
    );

    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "contextStateUpdated",
        mdbChanged
      );
    };
  }, [props.spaces, tableData]);
  const savePropertyValue = (value: string, f: SpaceTableColumn) => {
    if (saveProperty) {
      const property = tableData?.cols?.find((g) => g.name == f.name);

      if (property) saveProperty(f, property);
    }
    saveProperties(props.superstate, pathState.path, {
      [f.name]: parseMDBStringValue(f.type, value, true),
    });
  };
  const deletePropertyValue = (property: SpaceProperty) => {
    if (delProperty) {
      if (property) delProperty(property);
    }
    deleteProperty(props.superstate, pathState.path, property.name);
  };
  const saveMetadata = async (property: SpaceProperty, space: string) => {
    const field: SpaceProperty = {
      ...property,
      schemaId: defaultContextSchemaID,
    };
    const spaceInfo = props.superstate.spacesIndex.get(space)?.space;
    if (!spaceInfo) return;

    await props.superstate.spaceManager.addSpaceProperty(space, field);
    await updateContextValue(
      props.superstate.spaceManager,
      spaceInfo,
      pathState.path,
      field.name,
      values[field.name]
    );
  };
  const syncFMValue = (e: React.MouseEvent, property: SpaceProperty) => {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    const options = [...props.superstate.spacesMap.get(pathState.path)]
      .map((f) => props.superstate.pathsIndex.get(f))
      .filter((f) => f)
      .map<SelectOption>((f) => ({
        name: f.name,
        value: f.path,
        icon: f.label?.sticker,
        description: f.path,
      }));

    props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options,
        saveOptions: (_: string[], value: string[]) => {
          saveMetadata(property, value[0]);
        },
        placeholder: i18n.labels.spaceSelectPlaceholder,
        detail: true,
        searchable: true,
        showAll: true,
      },
      windowFromDocument(e.view.document),
      "bottom"
    );
  };
  const renameFMKey = (key: string, name: string) => {
    if (saveProperty) {
      const property = tableData?.cols?.find((g) => g.name == key);
      if (property) saveProperty({ ...property, name }, property);
    }
    renameProperty(props.superstate, pathState.path, key, name);
  };
  const selectedType = (value: string[], key: string) => {
    if (saveProperty) {
      const property = tableData?.cols?.find((g) => g.name == key);
      if (property) saveProperty({ ...property, type: value[0] }, property);
    }
    saveProperties(props.superstate, pathState.path, {
      [key]: defaultValueForType(value[0]),
    });
  };
  const selectType = (e: React.MouseEvent, key: string) => {
    const r = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      r,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        searchable: false,
        saveOptions: (_, v) => selectedType(v, key),
        value: [],
        showAll: true,
        options: fieldTypes
          .filter((f) => f.metadata)
          .map((f, i) => ({
            id: i + 1,
            name: f.label,
            value: f.type,
            icon: f.icon,
          })),
      },
      windowFromDocument(e.view.document)
    );
  };
  const [dragProperty, setDragProperty] = useState<SpaceProperty | null>(null);
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const resetState = () => {
    setHoverNode(null);
    setDragProperty(null);
  };
  useDndMonitor({
    onDragStart({ active }) {
      if (active.data.current.type == "property")
        setDragProperty(active.data.current.property);
    },
    onDragOver({ active, over }) {
      const overId = over?.data.current.id;

      if (over?.data.current.type == "property")
        if (overId) setHoverNode(overId as string);
    },
    onDragCancel() {
      resetState();
    },
    onDragEnd({ active, over }) {
      if (!active || !hoverNode) {
        resetState();
        return;
      }

      resetState();
    },
  });
  const updateField = (newField: SpaceProperty, oldProperty: SpaceProperty) => {
    if (saveProperty) {
      const property = tableData?.cols?.find((g) => g.name == oldProperty.name);
      if (property) saveProperty(newField, property);
    }
    if (newField.name != oldProperty.name)
      renameProperty(
        props.superstate,
        pathState.path,
        oldProperty.name,
        newField.name
      );
  };
  const showMenu = (e: React.MouseEvent, property: SpaceProperty) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();

    if (pathState.type == "space") {
      showPropertyMenu({
        superstate: props.superstate,
        rect: offset,
        win: windowFromDocument(e.view.document),
        editable: true,
        options: [],
        field: property,
        fields: cols,
        isSpace: true,
        contextPath: pathState.path,
        saveField: (newField) => updateField(newField, property),
        deleteColumn: deletePropertyValue,
        anchor: "bottom",
      });
      return;
    }
    showPropertiesMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      property,
      deletePropertyValue,
      () => syncFMValue(e, property),
      renameFMKey,
      selectType
    );
  };

  return (
    <>
      {props.compactMode ? (
        cols.map((f, i) => (
          <DataPropertyView
            key={i}
            path={pathState.path}
            propertyMenu={(e) => showMenu(e, f)}
            superstate={props.superstate}
            initialValue={values[f.name]}
            row={values}
            compactMode={props.compactMode}
            column={{ ...f, table: "" }}
            columns={[]}
            editMode={
              !props.editable
                ? CellEditMode.EditModeView
                : CellEditMode.EditModeAlways
            }
            updateValue={(value) => savePropertyValue(value, f)}
            updateFieldValue={(fieldValue, value) =>
              savePropertyValue(value, {
                ...f,
                value: fieldValue,
              })
            }
            contextTable={{}}
            source={pathState.path}
          ></DataPropertyView>
        ))
      ) : props.force ? (
        cols.map((f, i) => (
          <DataPropertyView
            key={i}
            path={pathState.path}
            propertyMenu={(e) => showMenu(e, f)}
            superstate={props.superstate}
            initialValue={values[f.name]}
            row={values}
            compactMode={props.compactMode}
            column={{ ...f, table: "" }}
            columns={[]}
            editMode={
              !props.editable
                ? CellEditMode.EditModeView
                : CellEditMode.EditModeAlways
            }
            updateValue={(value) => savePropertyValue(value, f)}
            updateFieldValue={(fieldValue, value) =>
              savePropertyValue(value, {
                ...f,
                value: fieldValue,
              })
            }
            contextTable={{}}
            source={pathState.path}
          ></DataPropertyView>
        ))
      ) : (
        <></>
      )}
      {excludeKeys.length > 0 && (
        <style>
          {`${excludeKeys
            .map((f) => `.metadata-property[data-property-key="${f}"]`)
            .join(", ")}
      {
         display: none;
      }`}
        </style>
      )}
    </>
  );
};

export const PropertyView = (props: {
  superstate: Superstate;
  savePropertyValue: (value: string, f: SpaceTableColumn) => void;
  showMenu: (e: React.MouseEvent, property: SpaceTableColumn) => void;
  row: Record<string, string>;
  source: string;
  column: SpaceTableColumn;
  editable: boolean;
  columns: SpaceTableColumn[];
  compactMode: boolean;
}) => {
  return (
    <DataPropertyView
      path={props.source}
      propertyMenu={(e) => props.showMenu(e, props.column)}
      superstate={props.superstate}
      initialValue={props.row[props.column.name]}
      row={props.row}
      compactMode={props.compactMode}
      column={{ ...props.column, table: "" }}
      columns={props.columns}
      editMode={
        !props.editable
          ? CellEditMode.EditModeView
          : CellEditMode.EditModeAlways
      }
      updateValue={(value) => props.savePropertyValue(value, props.column)}
      updateFieldValue={(fieldValue, value) =>
        props.savePropertyValue(value, {
          ...props.column,
          value: fieldValue,
        })
      }
      contextTable={{}}
      source={props.source}
    ></DataPropertyView>
  );
};
