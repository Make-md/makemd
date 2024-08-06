import i18n from "core/i18n";
import { FormulaEditor } from "core/react/components/SpaceEditor/Actions/FormulaEditor";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "core/superstate/superstate";
import { spaceNameFromSpacePath } from "core/utils/strings";
import React, { useMemo } from "react";
import {
  defaultContextSchemaID,
  fieldTypeForType,
  fieldTypes,
} from "schemas/mdb";
import { SpaceTableColumn } from "types/mdb";
import { windowFromDocument } from "utils/dom";
import { InputModal } from "../../Modals/InputModal";
import { SelectOption } from "../menu/SelectionMenu";

export const PropertyValueComponent = (props: {
  superstate: Superstate;
  name?: string;
  table: string;
  fieldType: string;
  value: string;
  fields: SpaceTableColumn[];
  contextPath?: string;
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
      },
      windowFromDocument(e.view.document)
    );
  };
  const selectType = (e: React.MouseEvent) => {
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        searchable: false,
        saveOptions: (_, v) => saveParsedValue("type", v[0]),
        value: [],
        showAll: true,
        options: fieldTypes
          .filter((f) => f.primative)
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
  const parsedValue = useMemo(
    () => parseFieldValue(props.value, props.fieldType, props.superstate),
    [props.value, props.fieldType]
  );
  const saveParsedValue = (field: string, value: any) => {
    props.saveValue(JSON.stringify({ ...parsedValue, [field]: value }));
  };
  const saveSpaceProperty = (field: string) => {
    const colExists = props.superstate.contextsIndex
      .get(parsedValue.space)
      ?.contextTable?.cols?.some((f) => f.name == field);
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
        .map((m) => ({ name: m.name, value: m.path, description: m.path })),
      "space"
    );
  };
  const selectSpaceProperty = (e: React.MouseEvent) => {
    showOptions(
      e,
      parsedValue.property,
      props.superstate.contextsIndex
        .get(parsedValue.space)
        ?.contextTable?.cols.filter((f) => {
          return f.type?.startsWith("context") &&
            parseFieldValue(f.value, f.type, props.superstate)["space"] ==
              props.contextPath
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
      props.fields
        .filter(
          (f) => f.type == "file" || f.type == "link" || f.type == "context"
        )
        .map((f) => ({
          name: f.name,
          value: f.name,
        })) ?? [];
    showOptions(e, null, properties, "field");
  };

  const editFormula = (e: React.MouseEvent) => {
    const _props = {
      superstate: props.superstate,
      saveFormula: (value: string) => saveParsedValue("value", value),
      formula: parsedValue.value,
      value: {},
      fields: props.fields.filter((f) => f.name != props.name),
      path: "",
    };
    props.superstate.ui.openCustomMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      <FormulaEditor {..._props}></FormulaEditor>,
      { ..._props },
      windowFromDocument(e.view.document),
      "bottom"
    );
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
  return props.fieldType?.startsWith("date") ? (
    <div className="mk-menu-option" onClick={(e) => selectDateFormat(e)}>
      <span>{i18n.labels.dateFormat}</span>
      <span>{parsedValue.format}</span>
    </div>
  ) : props.fieldType?.startsWith("context") ? (
    <>
      <div className="mk-menu-option" onClick={(e) => selectContext(e)}>
        <span>{i18n.labels.propertyValueSpace}</span>
        <span>
          {spaceNameFromSpacePath(parsedValue.space, props.superstate)}
        </span>
      </div>
      {parsedValue.space?.length > 0 && props.contextPath && (
        <div className="mk-menu-option" onClick={(e) => selectSpaceProperty(e)}>
          <span>{i18n.labels.propertyValueProperty}</span>
          <span>{parsedValue.field}</span>
        </div>
      )}
    </>
  ) : props.fieldType == "number" ? (
    <></>
  ) : props.fieldType == "fileprop" ? (
    <>
      <div className="mk-menu-option" onClick={(e) => editFormula(e)}>
        <span>{i18n.labels.propertyLookup}</span>
      </div>
      <div className="mk-menu-option" onClick={(e) => selectType(e)}>
        <span>{i18n.labels.propertyType}</span>
        <span>{fieldTypeForType(parsedValue.type)?.label}</span>
      </div>
    </>
  ) : props.fieldType == "object" ? (
    <div
      className="mk-menu-option"
      onClick={(e) => {
        props.superstate.ui.openModal(
          "Object Name",

          <InputModal
            value={parsedValue.typeName}
            saveLabel={"Rename Object"}
            saveValue={(value) => {
              saveParsedValue("typeName", value);
            }}
          ></InputModal>,
          windowFromDocument(e.view.document)
        );
      }}
    >
      <span>Name</span>
      <span>{parsedValue.typeName}</span>
    </div>
  ) : props.fieldType == "super" ? (
    <>
      <div className="mk-menu-option">
        <span>{i18n.labels.propertyDynamic}</span>
        <input
          type="checkbox"
          checked={parsedValue.dynamic == true}
          onChange={() => saveParsedValue("dynamic", !parsedValue.dynamic)}
        ></input>
      </div>

      <div className="mk-menu-option" onClick={(e) => selectProperty(e)}>
        <span>{i18n.labels.propertyFileProp}</span>
        <span>{parsedValue.field}</span>
      </div>
    </>
  ) : (
    <></>
  );
};
