import i18n from "i18n";
import React, { useRef, useState } from "react";
import { loadTags, stringFromTag } from "utils/contexts/contexts";
import { splitString } from "utils/contexts/predicate/predicate";
import { uniq } from "utils/tree";
import { TableCellMultiProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

export const TagCell = (props: TableCellMultiProp) => {
  const initialValue = (
    props.multi ? splitString(props.initialValue) ?? [] : [props.initialValue]
  ).filter((f) => f?.length > 0);
  const ref = useRef(null);

  const [value, setValue] = useState<string[]>(initialValue);
  const removeValue = (v: string) => {
    const newValues = value.filter((f) => f != v);
    setValue(newValues);
    props.saveValue(newValues.join(","));
  };

  const saveOptions = (_options: string[], _value: string[]) => {
    if (!props.multi) {
      setValue(_value);
      props.saveValue(_value.join(","));
    } else {
      const newValue = _value[0];
      if (newValue) {
        const newValues = uniq([...value, newValue]);
        setValue(newValues);
        props.saveValue(newValues.join(","));
      }
    }
  };

  const menuProps = () => {
    const options = loadTags(props.plugin).map((f) => ({
      name: f,
      value: stringFromTag(f),
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
      menuProps={menuProps}
      value={value}
      multi={props.multi}
      editMode={props.editMode}
      removeValue={removeValue}
    ></OptionCellBase>
  );
};
