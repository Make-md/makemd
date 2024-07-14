import i18n from "core/i18n";
import { parseLinkedPropertyToValue } from "core/utils/frames/frame";
import { SelectMenuProps } from "makemd-core";
import React, { useState } from "react";
import { SpaceTableColumn } from "types/mdb";
import { TableCellProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

export const PropertySelectCell = (
  props: TableCellProp & { columns: SpaceTableColumn[] }
) => {
  const [value, setValue] = useState(
    parseLinkedPropertyToValue(props.initialValue)
  );

  const saveOptions = (_: string[], _value: string[]) => {
    setValue(parseLinkedPropertyToValue(_value[0]));
    props.saveValue(_value[0]);
  };
  const menuProps = (): SelectMenuProps => {
    const options = (props.columns ?? []).map((f) => ({
      name: f.name,
      description: f.table,
      value:
        f.table == ""
          ? `$root['props']['${f.name}']`
          : `$contexts['${f.table}']['${f.name}']`,
    }));

    return {
      ui: props.superstate.ui,
      multi: false,
      editable: true,
      value: value ? [value] : [],
      options: options,
      saveOptions,
      placeholder: i18n.labels.linkItemSelectPlaceholder,
      detail: true,
      searchable: true,
      // onHide: () => props.setEditMode(null),
    };
  };
  return (
    <OptionCellBase
      superstate={props.superstate}
      removeValue={null}
      baseClass="mk-cell-link"
      selectLabel={props.compactMode ? props.property.name : i18n.labels.select}
      menuProps={menuProps}
      labelElement={(_props: { value: string }) => <div>{_props.value}</div>}
      value={value ? [value] : []}
      multi={false}
      editMode={props.editMode}
    ></OptionCellBase>
  );
};
