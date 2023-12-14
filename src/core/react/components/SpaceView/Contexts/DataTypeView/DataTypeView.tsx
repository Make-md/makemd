import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "core/superstate/superstate";
import { PathPropertyName } from "core/types/context";
import React from "react";
import { fieldTypeForType } from "schemas/mdb";
import { DBRow, SpaceTableColumn, SpaceTables } from "types/mdb";
import { BooleanCell } from "./BooleanCell";
import { ColorCell } from "./ColorCell";
import { ContextCell } from "./ContextCell";
import { DateCell } from "./DateCell";
import { IconCell } from "./IconCell";
import { ImageCell } from "./ImageCell";
import { LinkCell } from "./LinkCell";
import { LookUpCell } from "./LookUpCell";
import { NumberCell } from "./NumberCell";
import { ObjectCell } from "./ObjectCell";
import { OptionCell } from "./OptionCell";
import { PathCell } from "./PathCell";
import { SpaceCell } from "./SpaceCell";
import { SuperCell } from "./SuperCell";
import { TagCell } from "./TagCell";
import { TextCell } from "./TextCell";

type DataTypeViewProps = {
  initialValue: string;
  superstate: Superstate;
  column: SpaceTableColumn;
  editable: boolean;
  row?: DBRow;
  cols?: SpaceTableColumn[];
  openFlow?: () => void;
  updateValue?: (value: string) => void;
  updateFieldValue?: (fieldValue: string, value: string) => void;
  contextTable?: SpaceTables;
};

export const DataTypeView: React.FC<DataTypeViewProps> = (
  props: DataTypeViewProps
) => {
  const { initialValue, column, row } = props;

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
    superstate: props.superstate,
    propertyValue: column.value,
  };

  const fieldType = fieldTypeForType(column.type, column.name);
  const value = parseFieldValue(column.value, column.type);
  if (!fieldType) {
    return <></>;
  }
  if (fieldType.type == "file") {
    return (
      <PathCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
        openFlow={props.openFlow}
      ></PathCell>
    );
  } else if (fieldType.type == "icon") {
    return (
      <IconCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
      ></IconCell>
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
        space={value.space}
        spaceField={value.field}
        path={row?.[PathPropertyName]}
      ></ContextCell>
    );
  } else if (fieldType.type == "fileprop") {
    return (
      <LookUpCell {...viewProps} path={row?.[PathPropertyName]}></LookUpCell>
    );
  } else if (fieldType.type == "number") {
    return <NumberCell {...viewProps}></NumberCell>;
  } else if (fieldType.type == "link") {
    return (
      <LinkCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
        path={row?.[PathPropertyName]}
      ></LinkCell>
    );
  } else if (fieldType.type == "tags") {
    return <TagCell {...viewProps} row={row}></TagCell>;
  } else if (fieldType.type == "image") {
    return <ImageCell {...viewProps}></ImageCell>;
  } else if (fieldType.type == "object") {
    return (
      <ObjectCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
        savePropValue={saveFieldValue}
      ></ObjectCell>
    );
  } else if (fieldType.type == "color") {
    return <ColorCell {...viewProps}></ColorCell>;
  } else if (fieldType.type == "space") {
    return <SpaceCell {...viewProps}></SpaceCell>;
  } else if (fieldType.type == "super") {
    return <SuperCell {...viewProps} row={row}></SuperCell>;
  }
  return <TextCell {...viewProps}></TextCell>;
};
