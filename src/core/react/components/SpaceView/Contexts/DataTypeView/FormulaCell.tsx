import { FormulaEditor } from "core/react/components/SpaceEditor/Actions/FormulaEditor";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { ensureString } from "core/utils/strings";
import React, { useMemo } from "react";
import { DBRow, SpaceTableColumn } from "shared/types/mdb";
import { windowFromDocument } from "shared/utils/dom";
import { CellEditMode, TableCellProp } from "../TableView/TableView";
import { BooleanCell } from "./BooleanCell";
import { IconCell } from "./IconCell";
import { ImageCell } from "./ImageCell";
import { LinkCell } from "./LinkCell";
import { OptionCell } from "./OptionCell";

export const FormulaCell = (
  props: TableCellProp & {
    row: DBRow;
    columns: SpaceTableColumn[];
    saveOptions: (options: string, value: string) => void;
    source: string;
  }
) => {
  const initialValue = ensureString(props.initialValue);
  const parsedValue = useMemo(
    () => parseFieldValue(props.propertyValue, "fileprop", props.superstate),
    [props.propertyValue]
  );
  const saveParsedValue = (field: string, value: any) => {
    props.saveOptions(JSON.stringify({ ...parsedValue, [field]: value }), "");
  };
  const editFormula = (e: React.MouseEvent) => {
    const _props = {
      superstate: props.superstate,
      saveFormula: (value: string) => saveParsedValue("value", value),
      formula: parsedValue.value,
      value: props.row,
      fields: props.columns,
      path: props.path,
    };
    props.superstate.ui.openCustomMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      <FormulaEditor {..._props}></FormulaEditor>,
      { ..._props },
      windowFromDocument(e.view.document),
      "bottom"
    );
  };

  return parsedValue.type == "boolean" ? (
    <BooleanCell
      {...props}
      initialValue={initialValue}
      editMode={CellEditMode.EditModeReadOnly}
    />
  ) : initialValue?.length == 0 ? (
    <></>
  ) : parsedValue.type == "image" ? (
    <ImageCell
      {...props}
      initialValue={initialValue}
      editMode={CellEditMode.EditModeReadOnly}
      multi={true}
    />
  ) : parsedValue.type == "icon" ? (
    <IconCell
      {...props}
      initialValue={initialValue}
      multi={true}
      editMode={CellEditMode.EditModeReadOnly}
    ></IconCell>
  ) : parsedValue.type == "link" ? (
    <LinkCell
      {...props}
      initialValue={initialValue}
      multi={true}
      editMode={CellEditMode.EditModeReadOnly}
    ></LinkCell>
  ) : (
    <OptionCell
      {...props}
      initialValue={initialValue}
      editMode={CellEditMode.EditModeReadOnly}
      multi={true}
      source={props.source}
    />
  );
};
