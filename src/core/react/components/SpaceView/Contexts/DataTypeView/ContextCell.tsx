import i18n from "core/i18n";
import {
  deletePropertyMultiValue,
  insertContextItems,
  updateContextValue,
} from "core/utils/contexts/context";
import { parseLinkDisplayString } from "core/utils/parser";
import React, { useEffect, useMemo, useState } from "react";
import { uniq } from "utils/array";
import { parseLinkString, parseMultiString } from "utils/parsers";
import { folderPathToString, pathNameToString } from "utils/path";
import { serializeMultiString } from "utils/serializers";
import { TableCellMultiProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

type ContextObject = {
  label: string;
  path: string;
  ref: boolean;
};

export const ContextCell = (
  props: TableCellMultiProp & {
    space: string;
    spaceField: string;
    path: string;
  }
) => {
  const stringValueToLink = (strings: string[]) =>
    strings.map((f) => {
      return {
        label: parseLinkDisplayString(f),
        path: parseLinkString(f),
        ref: false,
      };
    });
  const initialValue = stringValueToLink(
    props.multi
      ? parseMultiString(props.initialValue) ?? []
      : [props.initialValue]
  );
  const [propValues, setPropValues] = useState(
    props.superstate.contextsIndex.get(props.space)?.spaceMap[
      props.spaceField
    ]?.[props.path]
  );
  useEffect(() => {
    setPropValues(
      props.superstate.contextsIndex.get(props.space)?.spaceMap[
        props.spaceField
      ]?.[props.path]
    );
  }, [props.space, props.spaceField]);

  const options = stringValueToLink([
    ...props.superstate.spacesMap.getInverse(props.space),
  ]).map((f) => ({
    name: f.label,
    value: f.path,
  }));
  const [value, setValue] = useState<ContextObject[]>(initialValue);
  const allValues = useMemo(
    () => [
      ...value,
      ...(propValues ?? []).map((f) => ({
        label: parseLinkDisplayString(f),
        path: parseLinkString(f),
        ref: true,
      })),
    ],
    [value, propValues]
  );
  const removeValue = (v: ContextObject) => {
    if (v.ref) {
      const newPropValues = propValues.filter((f) => f != v.path);
      setPropValues(newPropValues);
      updateContextValue(
        props.superstate.spaceManager,
        props.superstate.spacesIndex.get(props.space).space,
        v.path,
        props.spaceField,
        props.path,
        deletePropertyMultiValue
      );
    } else {
      const newValues = value.filter((f) => f.path != v.path);
      setValue(newValues);
      props.saveValue(serializeMultiString(newValues.map((f) => f.path)));
    }
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
    insertContextItems(props.superstate.spaceManager, _value, props.space);
    if (!props.multi) {
      setValue(
        _value.map((f) => ({
          path: f,
          label: pathNameToString(folderPathToString(f)),
          ref: false,
        }))
      );
      props.saveValue(serializeMultiString(_value));
    } else {
      const newValue = _value[0];
      if (newValue) {
        const newValues = uniq([...value.map((f) => f.path), newValue]);
        setValue(
          newValues.map((f) => ({
            label: pathNameToString(folderPathToString(f)),
            path: f,
            ref: false,
          }))
        );
        props.saveValue(serializeMultiString(newValues));
      }
    }
  };
  const openLink = async (o: ContextObject) => {
    props.superstate.ui.openPath(o.path, false);
  };
  const menuProps = () => {
    const _options = !props.multi
      ? [{ name: i18n.menu.none, value: "" }, ...options]
      : options;
    return {
      ui: props.superstate.ui,
      multi: false,
      editable: true,
      value: allValues.map((f) => f.path),
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
      superstate={props.superstate}
      menuProps={menuProps}
      openItem={openLink}
      getLabelString={(o) => o.label}
      value={allValues}
      multi={props.multi}
      editMode={props.editMode}
      removeValue={removeValue}
    ></OptionCellBase>
  );
};
