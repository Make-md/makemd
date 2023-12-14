import i18n from "core/i18n";

import { Superstate } from "core/superstate/superstate";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { fieldTypeForType, fieldTypes } from "schemas/mdb";
import { Pos } from "types/Pos";
import { SpaceProperty, SpaceTableColumn } from "types/mdb";
import { folderPathToString } from "utils/path";
import { PropertyValueComponent } from "./PropertyValue";

const NewPropertyMenuComponent = (props: {
  superstate: Superstate;
  schemaId: string;
  spaces: string[];
  fields: SpaceTableColumn[];
  contextPath: string;
  hide: () => void;
  saveField: (source: string, field: SpaceProperty) => void;
  fileMetadata: boolean;
}) => {
  const [fieldName, setFieldName] = useState<string>("");
  const [fieldSource, setFieldSource] = useState<string>(
    props.fileMetadata ? "fm" : ""
  );
  const spaceCaches = useMemo(
    () =>
      props.spaces
        .map((f) => props.superstate.spacesIndex.get(f))
        .filter((f) => f),
    [props.spaces]
  );
  const [fieldValue, setFieldValue] = useState<string>("");
  const [fieldType, setFieldType] = useState<string>("text");
  const options = useMemo(() => {
    const options = [];
    if (props.fileMetadata) {
      options.push({
        name: i18n.menu.setNone,
        value: "fm",
      });
    }
    if (props.contextPath) {
      options.push({
        name: folderPathToString(props.contextPath),
        value: "",
      });
    }
    options.push(
      ...(spaceCaches ?? []).map((f) => ({
        name: f.name,
        value: f.path,
      }))
    );
    return options;
  }, [spaceCaches]);

  const selectedType = (_: string[], value: string[]) => {
    setFieldType(value[0]);
  };
  const selectedValue = (value: string) => {
    setFieldValue(value);
  };
  const selectedSource = (_: string[], value: string[]) => {
    setFieldSource(value[0]);
  };
  const toggleMulti = () => {
    const field = fieldTypes.find(
      (f) => f.type == fieldType || f.multiType == fieldType
    );
    setFieldType(field.type == fieldType ? field.multiType : field.type);
  };

  const selectType = (e: React.MouseEvent) => {
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        searchable: false,
        saveOptions: selectedType,
        value: [],
        showAll: true,
        options: fieldTypes
          .filter((f) => (fieldSource == "fm" ? f.metadata : !f.restricted))
          .map((f, i) => ({
            id: i + 1,
            name: f.label,
            value: f.type,
            icon: "",
          })),
      }
    );
  };
  const selectedContext = (value: string) => {
    setFieldValue(value);
  };
  const type = useMemo(
    () => fieldTypeForType(fieldType, fieldName) ?? fieldTypes[0],
    [fieldType, fieldName]
  );
  const selectSource = (e: React.MouseEvent) => {
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        searchable: false,
        saveOptions: selectedSource,
        value: [],
        showAll: true,
        options: options,
      }
    );
  };
  const saveField = () => {
    if (fieldName.length == 0) {
      props.superstate.ui.notify(i18n.notice.noPropertyName);
      return;
    }
    props.saveField(fieldSource, {
      name: fieldName,
      type: fieldType,
      value: fieldValue,
      schemaId: props.schemaId,
    });
    props.hide();
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key == "Enter") {
      saveField();
    }
  };
  useEffect(() => {
    setTimeout(() => {
      input.current.focus();
    }, 50);
  }, []);
  const input = useRef(null);
  return (
    <>
      <div className="menu-item">
        <span>Name</span>
        <input
          type="text"
          ref={input}
          onKeyDown={onKeyDown}
          onChange={(e) => setFieldName(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          value={fieldName}
        />
      </div>
      <div className="menu-separator"></div>
      {options.length > 1 && (
        <div className="menu-item" onClick={(e) => selectSource(e)}>
          <span>Space</span>
          <span>
            {fieldSource == "fm"
              ? "None"
              : fieldSource == ""
              ? props.contextPath
              : fieldSource}
          </span>
        </div>
      )}
      <div className="menu-item" onClick={(e) => selectType(e)}>
        <span>Type</span>
        <span>{type.label}</span>
      </div>
      {type.multi ? (
        <div className="menu-item">
          <span>{i18n.labels.multiple}</span>
          <input
            type="checkbox"
            checked={fieldType == type.multiType}
            onChange={() => toggleMulti()}
          ></input>
        </div>
      ) : (
        <></>
      )}
      <div className="menu-separator"></div>
      {fieldSource != "fm" ? (
        <PropertyValueComponent
          superstate={props.superstate}
          table={fieldSource}
          fields={props.fields}
          fieldType={fieldType}
          value={fieldValue}
          contextPath={props.contextPath}
          saveValue={selectedValue}
        ></PropertyValueComponent>
      ) : (
        <></>
      )}
      <div className="menu-separator"></div>
      <div className="menu-item" onClick={(e) => saveField()}>
        <span>{i18n.buttons.saveProperty}</span>
      </div>
      <div className="menu-item" onClick={(e) => props.hide()}>
        <span>{i18n.buttons.cancel}</span>
      </div>
    </>
  );
};

export const showNewPropertyMenu = (
  superstate: Superstate,
  position: Pos,
  spaces: string[],
  fields: SpaceTableColumn[],
  saveField: (source: string, field: SpaceProperty) => void,
  schemaId: string,
  contextPath?: string,
  fileMetadata?: boolean
) => {
  superstate.ui.openCustomMenu(position, (props: { hide: () => void }) => (
    <NewPropertyMenuComponent
      superstate={superstate}
      spaces={spaces}
      schemaId={schemaId}
      contextPath={contextPath}
      fields={fields}
      hide={props.hide}
      saveField={saveField}
      fileMetadata={fileMetadata}
    ></NewPropertyMenuComponent>
  ));
};
