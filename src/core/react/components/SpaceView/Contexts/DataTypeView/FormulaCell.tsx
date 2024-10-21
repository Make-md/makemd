import { FormulaEditor } from "core/react/components/SpaceEditor/Actions/FormulaEditor";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { ensureString } from "core/utils/strings";
import React, { useMemo } from "react";
import { DBRow, SpaceTableColumn } from "types/mdb";
import { windowFromDocument } from "utils/dom";
import { CellEditMode, TableCellProp } from "../TableView/TableView";
import { BooleanCell } from "./BooleanCell";
import { IconCell } from "./IconCell";
import { ImageCell } from "./ImageCell";
import { LinkCell } from "./LinkCell";
import { OptionCell } from "./OptionCell";

//https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
const humanFileSize = (bytes: number, si = false, dp = 1) => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
};

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
    <BooleanCell {...props} editMode={CellEditMode.EditModeReadOnly} />
  ) : props.initialValue?.length == 0 ? (
    <></>
  ) : parsedValue.type == "image" ? (
    <ImageCell
      {...props}
      editMode={CellEditMode.EditModeReadOnly}
      multi={true}
    />
  ) : parsedValue.type == "icon" ? (
    <IconCell
      {...props}
      multi={true}
      editMode={CellEditMode.EditModeReadOnly}
    ></IconCell>
  ) : parsedValue.type == "link" ? (
    <LinkCell
      {...props}
      multi={true}
      editMode={CellEditMode.EditModeReadOnly}
    ></LinkCell>
  ) : (
    <OptionCell
      {...props}
      editMode={CellEditMode.EditModeReadOnly}
      multi={true}
      source={props.source}
    />
  );
};
