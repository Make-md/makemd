import i18n from "core/i18n";
import { parseLinkDisplayString } from "core/utils/parser";
import React, { useEffect, useRef, useState } from "react";
import { uniq } from "utils/array";
import { parseLinkString, parseMultiString } from "utils/parsers";
import { pathToString } from "utils/path";
import { serializeMultiString } from "utils/serializers";
import { TableCellMultiProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

type LinkObject = {
  label: string;
  sticker?: string;
  value: string;
};

export const LinkCell = (props: TableCellMultiProp & { path?: string }) => {
  const initialValue = (
    props.multi
      ? parseMultiString(props.initialValue) ?? []
      : [props.initialValue]
  ).filter((f) => f);
  const stringValueToLink = (strings: string[]) =>
    strings.map((f) => {
      const pathState = props.superstate.pathsIndex.get(f);
      if (pathState) {
        return {
          label: pathState.name,
          sticker: pathState.label?.sticker,
          value: f,
        };
      }
      return {
        label: parseLinkDisplayString(f),
        value: parseLinkString(f),
      };
    });
  useEffect(() => {
    setValue(
      resolveLinks(
        stringValueToLink(
          props.multi
            ? parseMultiString(props.initialValue) ?? []
            : [props.initialValue]
        )
      )
    );
  }, [props.initialValue]);
  const resolveLinks = (links: LinkObject[]) =>
    links.map((f) => ({
      value: f.value,
      label: pathToString(f.value),
    }));
  const ref = useRef(null);
  const [value, setValue] = useState<LinkObject[]>(
    resolveLinks(stringValueToLink(initialValue))
  );

  const removeValue = (v: LinkObject) => {
    const newValues = value.filter((f) => f.value != v.value);
    setValue(newValues);
    props.saveValue(serializeMultiString(newValues.map((f) => f.value)));
  };

  const saveOptions = (_: string[], _value: string[]) => {
    if (!props.multi) {
      setValue(resolveLinks(stringValueToLink(_value)));
      props.saveValue(serializeMultiString(_value));
    } else {
      const newValue = _value[0];
      if (newValue) {
        const newValues = uniq([...value.map((f) => f.value), newValue]);
        setValue(resolveLinks(stringValueToLink(newValues)));
        props.saveValue(serializeMultiString(newValues));
      }
    }
  };
  const menuProps = () => {
    const options = props.superstate.spaceManager.allPaths().map((f) => ({
      name: parseLinkDisplayString(f),
      value: f,
      description: f,
    }));
    const _options = !props.multi
      ? [{ name: i18n.menu.none, value: "" }, ...options]
      : options;
    return {
      ui: props.superstate.ui,
      multi: false,
      editable: true,
      value: value.map((f) => f.value),
      options: _options,
      saveOptions,
      placeholder: i18n.labels.linkItemSelectPlaceholder,
      detail: true,
      searchable: true,
      // onHide: () => props.setEditMode(null),
    };
  };

  const openLink = async (o: LinkObject) => {
    const pathExists = await props.superstate.spaceManager.pathExists(o.value);
    if (pathExists) {
      props.superstate.ui.openPath(o.value, false);
    } else {
      await props.superstate.spaceManager.createItemAtPath("/", "md", o.value);
      props.superstate.ui.openPath(o.value, false);
    }
  };
  return (
    <OptionCellBase
      superstate={props.superstate}
      baseClass="mk-cell-link"
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
