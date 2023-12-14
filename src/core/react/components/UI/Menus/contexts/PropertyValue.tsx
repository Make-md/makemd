import i18n from "core/i18n";
import { filePropTypes } from "core/react/components/SpaceView/Contexts/TableView/ColumnHeader";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "core/superstate/superstate";
import { allCacheTypesForPaths } from "core/utils/properties/allProperties";
import { spaceNameFromSpacePath } from "core/utils/strings";
import React, { useMemo } from "react";
import { defaultContextSchemaID } from "schemas/mdb";
import { SpaceTableColumn } from "types/mdb";
import { SelectOption } from "../menu";

export const PropertyValueComponent = (props: {
  superstate: Superstate;
  name?: string;
  table: string;
  fieldType: string;
  value: string;
  fields: SpaceTableColumn[];
  contextPath: string;
  saveValue: (value: string) => void;
}) => {
  const showOptions = (
    e: React.MouseEvent,
    value: string,
    options: SelectOption[],
    field: string,
    saveProperty?: (prop: string) => void
  ) => {
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        editable: true,
        searchable: true,
        saveOptions: (_, v) => {
          if (saveProperty) {
            saveProperty(v[0]);
          } else {
            saveParsedValue(field, v[0]);
          }
        },
        placeholder: i18n.labels.propertyValueSpace,
        value: [value ?? ""],
        options: options,
      }
    );
  };
  const parsedValue = useMemo(
    () => parseFieldValue(props.value, props.fieldType),
    [props.value, props.fieldType]
  );
  const saveParsedValue = (field: string, value: any) => {
    props.saveValue(JSON.stringify({ ...parsedValue, [field]: value }));
  };
  const saveSpaceProperty = (field: string) => {
    const colExists = props.superstate.contextsIndex
      .get(parsedValue.space)
      ?.cols?.some((f) => f.name == field);
    if (!colExists) {
      props.superstate.spaceManager.addSpaceProperty(parsedValue.space, {
        name: field,
        schemaId: defaultContextSchemaID,
        type: "context",
        value: props.name,
      });
    }
    saveParsedValue("field", field);
  };
  const selectContext = (e: React.MouseEvent) => {
    showOptions(
      e,
      parsedValue.space,
      props.superstate
        .allSpaces()
        .filter((f) => f.type != "default")
        .map((m) => ({ name: m.name, value: m.path })),
      "space"
    );
  };
  const selectSpaceProperty = (e: React.MouseEvent) => {
    showOptions(
      e,
      parsedValue.property,
      props.superstate.contextsIndex
        .get(parsedValue.space)
        ?.cols.filter((f) => {
          return f.type.startsWith("context") &&
            parseFieldValue(f.value, f.type)["space"] == props.contextPath
            ? true
            : false;
        })
        .map((m) => ({ name: m.name, value: m.name })) ?? [],
      "field",
      saveSpaceProperty
    );
  };
  const selectProperty = (e: React.MouseEvent) => {
    const properties =
      props.superstate.contextsIndex
        .get(props.contextPath)
        ?.cols.filter(
          (f) => f.type == "file" || f.type == "link" || f.type == "context"
        )
        .map((f) => ({
          name: f.name,
          value: f.name,
        })) ?? [];
    showOptions(e, null, properties, "field");
  };
  const selectPathProp = (e: React.MouseEvent) => {
    const property = props.superstate.contextsIndex
      .get(props.contextPath)
      ?.cols.find((f) => f.name == parsedValue.field);
    const allPaths = props.superstate.spaceManager.allPaths();

    const fileProps = property
      ? property.type == "file" || property.type == "link"
        ? filePropTypes.map((f) => ({
            name: f.name,
            value: f.value,
          }))
        : props.superstate.contextsIndex
            .get(parseFieldValue(property.value, "context").space)
            ?.cols.filter((f) => f.hidden != "true")
            .map((f) => ({
              name: f.name,
              value: f.name,
            })) ?? []
      : [];
    const cacheTypes = allCacheTypesForPaths(props.superstate, allPaths).map(
      (f) => ({ name: f.name, value: f.name })
    );
    showOptions(e, null, [...fileProps, ...cacheTypes], "value");
  };
  const selectDateFormat = (e: React.MouseEvent) => {
    const formats = [
      {
        name: "2020-04-21",
        value: "yyyy-MM-dd",
      },
      {
        name: "Apr 21, 2020",
        value: "MMM d, yyyy",
      },
      {
        name: "Tue Apr 21, 2020",
        value: "EEE MMM d, yyyy",
      },
    ];
    showOptions(e, null, formats, "format");
  };
  return props.fieldType.startsWith("date") ? (
    <li>
      <div className="menu-item" onClick={(e) => selectDateFormat(e)}>
        <span>{i18n.labels.dateFormat}</span>
        <span>{parsedValue.format}</span>
      </div>
    </li>
  ) : props.fieldType.startsWith("context") ? (
    <>
      <li>
        <div className="menu-item" onClick={(e) => selectContext(e)}>
          <span>{i18n.labels.propertyValueSpace}</span>
          <span>
            {spaceNameFromSpacePath(parsedValue.space, props.superstate)}
          </span>
        </div>
      </li>
      {parsedValue.space?.length > 0 && (
        <li>
          <div className="menu-item" onClick={(e) => selectSpaceProperty(e)}>
            <span>{i18n.labels.propertyValueProperty}</span>
            <span>{parsedValue.field}</span>
          </div>
        </li>
      )}
    </>
  ) : props.fieldType == "fileprop" ? (
    <>
      <li>
        <div className="menu-item" onClick={(e) => selectProperty(e)}>
          <span>{i18n.labels.propertyFileProp}</span>
          <span>{parsedValue.field}</span>
        </div>
      </li>
      {parsedValue.field && (
        <li>
          <div className="menu-item" onClick={(e) => selectPathProp(e)}>
            <span>{i18n.labels.propertyLookup}</span>
            <span>{parsedValue.value}</span>
          </div>
        </li>
      )}
    </>
  ) : props.fieldType == "super" ? (
    <>
      <li>
        <div className="menu-item">
          <span>Dynamic</span>
          <input
            type="checkbox"
            checked={parsedValue.dynamic == true}
            onChange={() => saveParsedValue("dynamic", !parsedValue.dynamic)}
          ></input>
        </div>
      </li>
      <li>
        {!parsedValue.dynamic ? (
          <div
            className="menu-item"
            onClick={(e) =>
              showOptions(
                e,
                parsedValue.field,
                [...props.superstate.superProperties.keys()].map((f) => ({
                  value: f,
                  name: props.superstate.superProperties.get(f).name,
                })),
                "field"
              )
            }
          >
            <span>{i18n.labels.propertyValueProperty}</span>
            <span>{parsedValue.field}</span>
          </div>
        ) : (
          <div className="menu-item" onClick={(e) => selectProperty(e)}>
            <span>{i18n.labels.propertyFileProp}</span>
            <span>{parsedValue.field}</span>
          </div>
        )}
      </li>
    </>
  ) : (
    <></>
  );
};
