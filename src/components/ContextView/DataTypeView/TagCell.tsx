import i18n from "i18n";
import React, { useEffect, useState } from "react";
import { uniq } from "utils/array";
import { loadTags } from "utils/metadata/tags";
import { parseMultiString } from "utils/parser";
import { serializeMultiString } from "utils/serializer";
import { TableCellMultiProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

export const TagCell = (props: TableCellMultiProp) => {
  const initialValue = (parseMultiString(props.initialValue) ?? []).filter(
    (f) => f?.length > 0
  );

  const [value, setValue] = useState<string[]>(initialValue);
  useEffect(() => {
    setValue(parseMultiString(props.initialValue) ?? []);
  }, [props.initialValue]);
  const removeValue = (v: string) => {
    const newValues = value.filter((f) => f != v);
    setValue(newValues);
    props.saveValue(serializeMultiString(newValues));
  };

  const saveOptions = (_options: string[], _value: string[]) => {
    if (!props.multi) {
      setValue(_value);
      props.saveValue(serializeMultiString(_value));
    } else {
      const newValue = _value[0];
      if (newValue) {
        const newValues = uniq([...value, newValue]);
        setValue(newValues);
        props.saveValue(serializeMultiString(newValues));
      }
    }
  };

  const menuProps = () => {
    const options = loadTags(props.plugin).map((f) => ({
      name: f,
      value: f,
    }));
    const _options = !props.multi
      ? [{ name: i18n.menu.none, value: "" }, ...options]
      : options;
    return {
      multi: false,
      editable: true,
      value: value,
      options: _options,
      saveOptions,
      placeholder: i18n.labels.tagItemSelectPlaceholder,
      searchable: true,
      showAll: true,
      onHide: () => props.setEditMode(null),
    };
  };
  return (
    <OptionCellBase
      baseClass="mk-cell-tag"
      menuProps={menuProps}
      value={value}
      multi={props.multi}
      editMode={props.editMode}
      removeValue={removeValue}
    ></OptionCellBase>
  );
};
