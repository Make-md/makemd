import { Pos } from "types/Pos";

import { DataTypeView } from "core/react/components/SpaceView/Contexts/DataTypeView/DataTypeView";
import { showPropertiesMenu } from "core/react/components/UI/Menus/properties/propertiesMenu";
import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import { Superstate } from "core/superstate/superstate";
import { saveProperties } from "core/superstate/utils/spaces";
import { PathPropertyName } from "core/types/context";
import { updateContextValue } from "core/utils/contexts/context";
import { useEffect } from "preact/hooks";
import React, { useState } from "react";
import {
  defaultContextSchemaID,
  fieldTypes,
  stickerForField,
} from "schemas/mdb";
import { SpaceProperty, SpaceTableColumn } from "types/mdb";
import { uniqCaseInsensitive } from "utils/array";
import { parseProperty } from "utils/parsers";
import { defaultValueForType, detectPropertyType } from "utils/properties";

export const PropertiesView = (props: {
  superstate: Superstate;
  path: string;
  spaces: string[];
  force?: boolean;
  excludeKeys: string[];
  editable?: boolean;
}) => {
  const { path } = props;
  const [values, setValues] = useState<Record<string, string>>({});
  const [cols, setCols] = useState([]);
  const [excludeKeys, setExcludeKeys] = useState<string[]>([]);

  const refreshData = async () => {
    const pathContexts: Set<string> =
      props.superstate.spacesMap.get(path) ?? new Set();
    const columns = [...pathContexts]
      .map(
        (f) =>
          props.superstate.contextsIndex.get(f)?.tables?.[
            defaultContextSchemaID
          ]?.cols ?? []
      )
      .reduce((p, c) => [...p, ...c], []);
    const newCols = [];
    const newValues: Record<string, string> = {};
    const properties =
      props.superstate.pathsIndex.get(path)?.metadata?.property ?? {};
    const fmKeys = uniqCaseInsensitive(Object.keys(properties)).filter(
      (f) => !columns.some((g) => g.name == f)
    );
    const cols: SpaceTableColumn[] = fmKeys.map((f) => ({
      table: "",
      name: f,
      schemaId: "",
      type: detectPropertyType(properties[f], f),
    }));
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
      ...columns.map((f) => f.name),
      ...(props.excludeKeys ?? []),
    ]);
    setValues(newValues);
  };

  const mdbChanged = (payload: { path: string }) => {
    if (props.spaces.find((f) => f == payload.path)) {
      refreshData();
    }
  };
  const fileChanged = (payload: { path: string }) => {
    if (payload.path == path) {
      refreshData();
    }
  };
  useEffect(() => {
    refreshData();
    props.superstate.eventsDispatcher.addListener(
      "contextStateUpdated",
      mdbChanged
    );
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      fileChanged
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "contextStateUpdated",
        mdbChanged
      );
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        fileChanged
      );
    };
  }, [path, props.spaces]);
  const savePropertyValue = (value: string, f: SpaceTableColumn) => {
    saveProperties(props.superstate, path, {
      [f.name]: value,
    });
  };
  const deletePropertyValue = (property: SpaceProperty) => {
    props.superstate.spaceManager.deleteProperty(path, property.name);
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
      path,
      field.name,
      values[field.name]
    );
  };
  const syncFMValue = (e: React.MouseEvent, property: SpaceProperty) => {
    showSpacesMenu(e, props.superstate, (space) =>
      saveMetadata(property, space)
    );
  };
  const renameFMKey = (key: string, name: string) => {
    props.superstate.spaceManager.renameProperty(path, key, name);
  };
  const selectedType = (value: string[], key: string) => {
    saveProperties(props.superstate, path, {
      [key]: defaultValueForType(value[0]),
    });
  };
  const selectType = (p: Pos, key: string) => {
    props.superstate.ui.openMenu(p, {
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
    });
  };
  const showMenu = (e: React.MouseEvent, property: SpaceProperty) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showPropertiesMenu(
      props.superstate,
      { x: offset.left, y: offset.top + 30 },
      property,
      deletePropertyValue,
      () => syncFMValue(e, property),
      renameFMKey,
      selectType
    );
  };
  const propertiessuperstate = props.superstate.settings.hideFrontmatter;
  return !propertiessuperstate || props.force ? (
    <>
      {cols.map((f, i) => (
        <div key={i} className="mk-path-context-row">
          <div
            className="mk-path-context-field"
            onClick={(e) => showMenu(e, f)}
          >
            <div
              className="mk-path-context-field-icon"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker(stickerForField(f)),
              }}
            ></div>
            <div className="mk-path-context-field-key">{f.name}</div>
          </div>
          <div className="mk-path-context-value">
            <DataTypeView
              superstate={props.superstate}
              initialValue={values[f.name]}
              row={{ [PathPropertyName]: path }}
              column={{ ...f, table: "" }}
              editable={props.editable}
              updateValue={(value) => savePropertyValue(value, f)}
              updateFieldValue={(fieldValue, value) =>
                savePropertyValue(value, f)
              }
              contextTable={{}}
            ></DataTypeView>
          </div>
        </div>
      ))}
    </>
  ) : excludeKeys.length > 0 ? (
    <style>
      {`${excludeKeys
        .map((f) => `.metadata-property[data-property-key="${f}"]`)
        .join(", ")}
      {
         display: none;
      }`}
    </style>
  ) : (
    <></>
  );
};
