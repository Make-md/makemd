import { insertContextItems } from "dispatch/mdb";
import i18n from "i18n";
import React, { useEffect, useRef, useState } from "react";
import { MDBTable } from "types/mdb";
import { splitString } from "utils/contexts/predicate/predicate";
import { getAbstractFileAtPath, openAFile } from "utils/file";
import {
  fileNameToString, folderPathToString,
  uniq
} from "utils/tree";
import { TableCellMultiProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

type ContextObject = {
  label: string;
  path: string;
};

export const ContextCell = (
  props: TableCellMultiProp & { contextTable: MDBTable; contextTag: string }
) => {
  const initialValue = (
    props.multi ? splitString(props.initialValue) ?? [] : [props.initialValue]
  )
    .filter((f) => f?.length > 0)
    .map((f) => ({
      path: f,
      label: fileNameToString(folderPathToString(f)),
    }));
  const ref = useRef(null);
  const options =
    props.contextTable?.rows.map((f) => ({
      name: fileNameToString(folderPathToString(f["File"])),
      value: f["File"],
    })) ?? [];
  const [value, setValue] = useState<ContextObject[]>(initialValue);
  const removeValue = (v: ContextObject) => {
    const newValues = value.filter((f) => f.path != v.path);
    setValue(newValues);
    props.saveValue(newValues.map((f) => f.path).join(","));
  };
  useEffect(() => {
    setValue(
      (props.multi
        ? splitString(props.initialValue) ?? []
        : [props.initialValue]
      )
        .filter((f) => f?.length > 0)
        .map((f) => ({
          path: f,
          label: fileNameToString(folderPathToString(f)),
        }))
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
      props.saveValue(_value.join(","));
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
        props.saveValue(newValues.join(","));
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
