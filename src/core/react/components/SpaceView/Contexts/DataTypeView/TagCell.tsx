import i18n from "core/i18n";
import { addTagToPath, deleteTagFromPath } from "core/superstate/utils/tags";
import { PathPropertyName } from "core/types/context";
import React, { useMemo } from "react";
import { DBRow } from "types/mdb";
import { parseMultiString } from "utils/parsers";
import { TableCellProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

export const TagCell = (props: TableCellProp & { row: DBRow }) => {
  const value = useMemo(
    () => parseMultiString(props.initialValue),
    [props.initialValue]
  );
  const removeValue = (v: string) => {
    deleteTagFromPath(props.superstate, props.row[PathPropertyName], v);
  };

  const saveOptions = (_options: string[], _value: string[]) => {
    const newValue = _value[0];
    addTagToPath(props.superstate, props.row[PathPropertyName], newValue);
  };

  const menuProps = () => {
    const options = props.superstate.spaceManager.readTags().map((f) => ({
      name: f,
      value: f,
    }));

    return {
      ui: props.superstate.ui,
      multi: false,
      editable: true,
      value: value,
      options: options,
      saveOptions,
      placeholder: i18n.labels.tagItemSelectPlaceholder,
      searchable: true,
      showAll: true,
      onHide: () => props.setEditMode(null),
    };
  };
  return (
    <OptionCellBase
      superstate={props.superstate}
      baseClass="mk-cell-tags"
      menuProps={menuProps}
      value={value}
      multi={true}
      editMode={props.editMode}
      removeValue={removeValue}
    ></OptionCellBase>
  );
};
