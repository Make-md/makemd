import i18n from "i18n";
import MakeMDPlugin from "main";
import { Menu, Notice, Point } from "obsidian";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { fieldTypeForType, fieldTypes } from "schemas/mdb";
import { MDBColumn, MDBField } from "types/mdb";
import { folderPathToString } from "utils/strings";
import { showSelectMenu } from "./menuItems";
import { PropertyValueComponent } from "./propertyMenu";

const NewPropertyMenuComponent = (props: {
  plugin: MakeMDPlugin;
  schemaId: string;
  tags: string[];
  fields: MDBColumn[];
  contextPath: string;
  hide: () => void;
  saveField: (source: string, field: MDBField) => void;
  fileMetadata: boolean;
}) => {
  const [fieldName, setFieldName] = useState<string>("");
  const [fieldSource, setFieldSource] = useState<string>(
    props.fileMetadata ? "fm" : ""
  );
  const [fieldValue, setFieldValue] = useState<string>("");
  const [fieldType, setFieldType] = useState<string>("text");
  const options = useMemo(() => {
    const options = [];
    if (props.fileMetadata) {
      options.push({
        name: i18n.menu.fileMetadata,
        value: "fm",
        description: i18n.menu.fileMetadataDescription,
      });
    }
    if (props.contextPath) {
      options.push({
        name: folderPathToString(props.contextPath),
        value: "",
        description: `All notes in ${folderPathToString(props.contextPath)}`,
      });
    }
    options.push(
      ...props.tags.map((f) => ({
        name: f,
        value: f,
        description: `All notes tagged ${f}`,
      }))
    );
    return options;
  }, []);

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
    showSelectMenu((e.target as HTMLElement).getBoundingClientRect(), {
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
    });
  };
  const selectedContext = (value: string) => {
    setFieldValue(value);
  };
  const type = useMemo(
    () => fieldTypeForType(fieldType) ?? fieldTypes[0],
    [fieldType]
  );
  const selectSource = (e: React.MouseEvent) => {
    showSelectMenu((e.target as HTMLElement).getBoundingClientRect(), {
      multi: false,
      editable: false,
      searchable: false,
      saveOptions: selectedSource,
      value: [],
      showAll: true,
      options: options,
    });
  };
  const saveField = () => {
    if (fieldName.length == 0) {
      new Notice(i18n.notice.noPropertyName);
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
          <span>Context</span>
          <span>
            {fieldSource == "fm"
              ? "File Metadata"
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
          plugin={props.plugin}
          table={fieldSource}
          fields={props.fields}
          fieldType={fieldType}
          value={fieldValue}
          contextPath={props.contextPath}
          saveValue={selectedValue}
          saveContext={selectedContext}
        ></PropertyValueComponent>
      ) : (
        <></>
      )}
      <div className="menu-separator"></div>
      <div className="menu-item" onClick={(e) => saveField()}>
        <span>Save Property</span>
      </div>
      <div className="menu-item" onClick={(e) => props.hide()}>
        <span>Cancel</span>
      </div>
    </>
  );
};

export const showNewPropertyMenu = (
  plugin: MakeMDPlugin,
  position: Point,
  tags: string[],
  fields: MDBColumn[],
  saveField: (source: string, field: MDBField) => void,
  schemaId: string,
  contextPath?: string,
  fileMetadata?: boolean
) => {
  const menu = new Menu();
  menu.setUseNativeMenu(false);

  const frag = document.createDocumentFragment();

  const div = frag.createDiv();
  div.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
  });

  div.addEventListener("keydown", (e) => {});
  const root = createRoot(div);
  root.render(
    <>
      <NewPropertyMenuComponent
        plugin={plugin}
        tags={tags}
        schemaId={schemaId}
        contextPath={contextPath}
        fields={fields}
        hide={() => menu.hide()}
        saveField={saveField}
        fileMetadata={fileMetadata}
      ></NewPropertyMenuComponent>
    </>
  );
  menu.addItem((menuItem) => {
    menuItem.setTitle(frag);
    menuItem.dom.toggleClass("mk-properties", true);
  });

  const keys = [...menu.scope.keys];
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].key != "Escape") {
      menu.scope.unregister(keys[i]);
    }
  }
  menu.showAtPosition(position);
  return menu;
};
