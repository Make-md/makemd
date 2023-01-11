import MakeMDPlugin from "main";
import React, { useContext } from "react";
import { fieldTypes } from "schemas/mdb";
import { DBRow, MDBColumn } from "types/mdb";
import { saveFrontmatterValue } from "utils/contexts/fm";
import { MDBContext } from "../MDBContext";
import { BooleanCell } from "./BooleanCell";
import { ContextCell } from "./ContextCell";
import { DateCell } from "./DateCell";
import { FileCell } from "./FileCell";
import { FilePropertyCell } from "./FilePropertyCell";
import { ImageCell } from "./ImageCell";
import { LinkCell } from "./LinkCell";
import { NumberCell } from "./NumberCell";
import { OptionCell } from "./OptionCell";
import { PreviewCell } from "./PreviewCell";
import { TagCell } from "./TagCell";
import { TextCell } from "./TextCell";

type DataTypeViewProps = {
  initialValue: string;
  plugin: MakeMDPlugin;
  index: number;
  file: string;
  column: MDBColumn;
  editable: boolean;
  row?: DBRow;
  cols?: MDBColumn[];
  openFlow?: () => void;
};

export const DataTypeView: React.FC<DataTypeViewProps> = (
  props: DataTypeViewProps
) => {
  const { initialValue, index, column, file } = props;
  const { tableData, saveDB, saveContextDB, contextTable } =
    useContext(MDBContext);
  const table = column.table;
  const updateData = (column: string, value: string) => {
    const col = (table == "" ? tableData : contextTable[table])?.cols.find(
      (f) => f.name == column
    );
    if (col) saveFrontmatterValue(file, column, value, col.type);
    if (table == "") {
      saveDB({
        ...tableData,
        rows: tableData.rows.map((r, i) =>
          i == index
            ? {
                ...r,
                [column]: value,
              }
            : r
        ),
      });
    } else if (contextTable[table]) {
      saveContextDB(
        {
          ...contextTable[table],
          rows: contextTable[table].rows.map((r, i) =>
            i == index
              ? {
                  ...r,
                  [column]: value,
                }
              : r
          ),
        },
        table
      );
    }
  };
  const updateFieldValue = (
    column: string,
    fieldValue: string,
    value: string
  ) => {
    const col = tableData.cols.find((f) => f.name == column);
    saveFrontmatterValue(file, column, value, col.type);
    if (table == "") {
      const newTable = {
        ...tableData,
        cols: tableData.cols.map((m) =>
          m.name == column
            ? {
                ...m,
                value: fieldValue,
              }
            : m
        ),
        rows: tableData.rows.map((r, i) =>
          i == index
            ? {
                ...r,
                [column]: value,
              }
            : r
        ),
      };
      saveDB(newTable);
    } else if (contextTable[table]) {
      saveContextDB(
        {
          ...contextTable[table],
          cols: contextTable[table].cols.map((m) =>
            m.name == column
              ? {
                  ...m,
                  value: fieldValue,
                }
              : m
          ),
          rows: contextTable[table].rows.map((r, i) =>
            i == index
              ? {
                  ...r,
                  [column]: value,
                }
              : r
          ),
        },
        table
      );
    }
  };
  const saveValue = (value: string) => {
    updateData(column.name, value);
  };
  const saveFieldValue = (fieldValue: string, value: string) => {
    updateFieldValue(column.name, fieldValue, value);
  };
  const viewProps = {
    initialValue: initialValue as string,
    saveValue: saveValue,
    editMode: props.editable == true ? 3 : 0,
    setEditMode: () => {},
    plugin: props.plugin,
  };
  const fieldType =
    fieldTypes.find((t) => column.type == t.type) ||
    fieldTypes.find((t) => column.type == t.multiType);
  if (!fieldType) {
    return <></>;
  }
  if (fieldType.type == "preview") {
    return (
      <PreviewCell
        {...viewProps}
        file={file}
        row={props.row}
        columns={props.cols}
      ></PreviewCell>
    );
  } else if (fieldType.type == "file") {
    return (
      <FileCell
        isFolder={false}
        {...viewProps}
        multi={fieldType.multiType == column.type}
        openFlow={props.openFlow}
      ></FileCell>
    );
  } else if (fieldType.type == "boolean") {
    return <BooleanCell {...viewProps} column={column}></BooleanCell>;
  } else if (fieldType.type == "option") {
    return (
      <OptionCell
        {...viewProps}
        options={column.value}
        multi={fieldType.multiType == column.type}
        saveOptions={saveFieldValue}
      ></OptionCell>
    );
  } else if (fieldType.type == "date") {
    return <DateCell {...viewProps}></DateCell>;
  } else if (fieldType.type == "context") {
    return (
      <ContextCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
        contextTable={contextTable[column.value]}
        contextTag={column.value}
      ></ContextCell>
    );
  } else if (fieldType.type == "fileprop") {
    return (
      <FilePropertyCell
        {...viewProps}
        property={column.value}
        file={file}
      ></FilePropertyCell>
    );
  } else if (fieldType.type == "number") {
    return <NumberCell {...viewProps}></NumberCell>;
  } else if (fieldType.type == "link") {
    return (
      <LinkCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
        file={file}
      ></LinkCell>
    );
  } else if (fieldType.type == "tag") {
    return (
      <TagCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
      ></TagCell>
    );
  } else if (fieldType.type == "image") {
    return <ImageCell {...viewProps}></ImageCell>;
  }
  return <TextCell {...viewProps}></TextCell>;
};
