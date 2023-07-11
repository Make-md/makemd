import { insertContextItems } from "dispatch/mdb";
import i18n from "i18n";
import React, { useEffect, useRef, useState } from "react";
import { FilePropertyName } from "types/context";
import { MDBTable } from "types/mdb";
import { uniq } from "utils/array";
import { getAbstractFileAtPath, openAFile } from "utils/file";
import {
  parseLinkDisplayString,
  parseLinkString,
  parseMultiString,
} from "utils/parser";
import { serializeMultiString } from "utils/serializer";
import { fileNameToString, folderPathToString } from "utils/strings";
import { TableCellMultiProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

type ContextObject = {
  label: string;
  path: string;
};

export const ContextCell = (
  props: TableCellMultiProp & { contextTable: MDBTable; contextTag: string }
) => {
  const stringValueToLink = (strings: string[]) =>
    strings.map((f) => {
      return {
        label: parseLinkDisplayString(f),
        path: parseLinkString(f),
      };
    });
  const initialValue = stringValueToLink(
    props.multi
      ? parseMultiString(props.initialValue) ?? []
      : [props.initialValue]
  );
  const ref = useRef(null);
  const options = stringValueToLink(
    props.contextTable?.rows.map((f) => f[FilePropertyName]) ?? []
  ).map((f) => ({
    name: f.label,
    value: f.path,
  }));
  const [value, setValue] = useState<ContextObject[]>(initialValue);
  const removeValue = (v: ContextObject) => {
    const newValues = value.filter((f) => f.path != v.path);
    setValue(newValues);
    props.saveValue(serializeMultiString(newValues.map((f) => f.path)));
  };
  useEffect(() => {
    setValue(
      stringValueToLink(
        props.multi
          ? parseMultiString(props.initialValue) ?? []
          : [props.initialValue]
      )
    );
  }, [props.initialValue]);

  const saveOptions = (_options: string[], _value: string[]) => {
    insertContextItems(props.plugin, _options, props.contextTag);
    if (!props.multi) {
      setValue(
        _value.map((f) => ({
          path: f,
          label: fileNameToString(folderPathToString(f)),
        }))
      );
      props.saveValue(serializeMultiString(_value));
    } else {
      const newValue = _value[0];
      if (newValue) {
        const newValues = uniq([...value.map((f) => f.path), newValue]);
        setValue(
          newValues.map((f) => ({
            label: fileNameToString(folderPathToString(f)),
            path: f,
          }))
        );
        props.saveValue(serializeMultiString(newValues));
      }
    }
  };
  const openLink = async (o: ContextObject) => {
    const file = getAbstractFileAtPath(app, o.path);
    if (file) {
      openAFile(file, props.plugin, false);
    }
  };
  const menuProps = () => {
    const _options = !props.multi
      ? [{ name: i18n.menu.none, value: "" }, ...options]
      : options;
    return {
      multi: false,
      editable: true,
      value: value.map((f) => f.path),
      options: _options,
      saveOptions,
      placeholder: i18n.labels.contextItemSelectPlaceholder,
      searchable: true,
      showAll: true,
      onHide: () => props.setEditMode(null),
    };
  };
  return (
    <OptionCellBase
      baseClass="mk-cell-context"
      menuProps={menuProps}
      openItem={openLink}
      getLabelString={(o) => o.label}
      value={value}
      multi={props.multi}
      editMode={props.editMode}
      removeValue={removeValue}
    ></OptionCellBase>
  );
};
