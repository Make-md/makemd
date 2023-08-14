import MakeMDPlugin from "main";
import React from "react";
import { fieldTypeForType } from "schemas/mdb";
import { DBRow, MDBColumn, MDBTables } from "types/mdb";
import { BooleanCell } from "./BooleanCell";
import { ContextCell } from "./ContextCell";
import { DateCell } from "./DateCell";
import { FileCell } from "./FileCell";
import { LookUpCell } from "./FilePropertyCell";
import { ImageCell } from "./ImageCell";
import { LinkCell } from "./LinkCell";
import { NumberCell } from "./NumberCell";
import { ObjectCell } from "./ObjectCell";
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
  updateValue?: (value: string) => void;
  updateFieldValue?: (fieldValue: string, value: string) => void;
  contextTable?: MDBTables;
};

export const DataTypeView: React.FC<DataTypeViewProps> = (
  props: DataTypeViewProps
) => {
  const { initialValue, index, column, file } = props;

  const saveValue = (value: string) => {
    props.updateValue(value);
  };
  const saveFieldValue = (fieldValue: string, value: string) => {
    props.updateFieldValue(fieldValue, value);
  };
  const viewProps = {
    initialValue: initialValue as string,
    saveValue: saveValue,
    editMode: props.editable == true ? 3 : 0,
    setEditMode: () => {},
    plugin: props.plugin,
    propertyValue: column.value,
  };

  const fieldType = fieldTypeForType(column.type);
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
        contextTable={props.contextTable[column.value]}
        contextTag={column.value}
      ></ContextCell>
    );
  } else if (fieldType.type == "fileprop") {

    return <LookUpCell {...viewProps} file={file}></LookUpCell>;
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
  } else if (fieldType.type == "object") {
    return <ObjectCell {...viewProps}></ObjectCell>;
  }
  return <TextCell {...viewProps}></TextCell>;
};
