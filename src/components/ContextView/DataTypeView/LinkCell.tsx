import i18n from "i18n";
import { TFile } from "obsidian";
import React, { useRef, useState } from "react";
import { splitString } from "utils/contexts/predicate/predicate";
import {
  getAllAbstractFilesInVault,
  getFolderPathFromString, openTFile
} from "utils/file";
import { getFileFromString } from "utils/flow/flowEditor";
import { fileNameToString, filePathToString, uniq } from "utils/tree";
import { TableCellMultiProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

type LinkObject = {
  label: string;
  value: string;
  file?: TFile;
};

export const LinkCell = (props: TableCellMultiProp & { file: string }) => {
  const initialValue = (
    props.multi ? splitString(props.initialValue) ?? [] : [props.initialValue]
  ).filter((f) => f);
  const stringValueToLink = (strings: string[]) =>
    strings.map((f) => {
      const match = /\[\[(.*?)\]\]/g.exec(f);
      const stringValue =
        match?.length > 1 ? match[1].substring(0, match[1].indexOf("|")) : f;
      return {
        label: filePathToString(stringValue),
        value: stringValue,
      };
    });
  const resolveLinks = (links: LinkObject[]) =>
    links.map((f) => ({
      value: f.value,
      label: filePathToString(f.value),
      file: getFileFromString(f.value, getFolderPathFromString(props.file)),
    }));
  const ref = useRef(null);
  const [value, setValue] = useState<LinkObject[]>(
    resolveLinks(stringValueToLink(initialValue))
  );

  const removeValue = (v: LinkObject) => {
    const newValues = value.filter((f) => f.value != v.value);
    setValue(newValues);
    props.saveValue(newValues.map((f) => f.value).join(","));
  };

  const saveOptions = (_: string[], _value: string[]) => {
    if (props.multi) {
      setValue(resolveLinks(stringValueToLink(_value)));
      props.saveValue(_value.join(","));
    } else {
      const newValue = _value[0];
      if (newValue) {
        const newValues = uniq([...value.map((f) => f.value), newValue]);
        setValue(resolveLinks(stringValueToLink(newValues)));
        props.saveValue(newValues.join(","));
      }
    }
  };
  const menuProps = () => {
    const options = getAllAbstractFilesInVault(props.plugin, app).map((f) => ({
      name: fileNameToString(f.name),
      value: f.path,
    }));
    const _options = !props.multi
      ? [{ name: i18n.menu.none, value: "" }, ...options]
      : options;
    return {
      multi: false,
      editable: false,
      value: value.map((f) => f.value),
      options: _options,
      saveOptions,
      placeholder: i18n.labels.linkItemSelectPlaceholder,
      detail: true,
      searchable: true,
      onHide: () => props.setEditMode(null),
    };
  };

  const openLink = async (o: LinkObject) => {
    if (o.file) {
      openTFile(o.file, props.plugin, false);
    } else {
      //@ts-ignore
      const file = await app.fileManager.createNewMarkdownFile(
        app.vault.getRoot(),
        o.value
      );
      openTFile(file, props.plugin, false);
      setValue(resolveLinks(value));
    }
  };
  const editable = props.editMode != 0;
  return (
    <OptionCellBase
      menuProps={menuProps}
      getLabelString={(o) => o.label}
      valueClass={(o) =>
        o.file ? "mk-cell-link-item" : "mk-cell-link-unresolved"
      }
      openItem={openLink}
      value={value}
      multi={props.multi}
      editMode={props.editMode}
      removeValue={removeValue}
    ></OptionCellBase>
  );
};
