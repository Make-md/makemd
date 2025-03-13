import { Superstate } from "makemd-core";
import React from "react";
import { fieldTypeForType } from "schemas/mdb";
import { PathPropertyName } from "shared/types/context";
import { DBRow, SpaceTableColumn, SpaceTables } from "shared/types/mdb";
import { CellEditMode } from "../TableView/TableView";
import { BooleanCell } from "./BooleanCell";
import { ColorCell } from "./ColorCell";
import { ContextCell } from "./ContextCell";
import { DateCell } from "./DateCell";
import { FormulaCell } from "./FormulaCell";
import { IconCell } from "./IconCell";
import { ImageCell } from "./ImageCell";
import { LinkCell } from "./LinkCell";
import { NumberCell } from "./NumberCell";
import { ObjectCell } from "./ObjectCell";
import { OptionCell } from "./OptionCell";

import { AggregateCell } from "./AggregateCell";
import { PropertySelectCell } from "./PropertySelectCell";
import { SpaceCell } from "./SpaceCell";
import { SuperCell } from "./SuperCell";
import { TagCell } from "./TagCell";
import { TextCell } from "./TextCell";

export type DataTypeViewProps = {
  initialValue: string;
  superstate: Superstate;
  column: SpaceTableColumn;
  editMode: CellEditMode;
  row?: DBRow;
  columns?: SpaceTableColumn[];
  updateValue?: (value: string) => void;
  updateFieldValue?: (fieldValue: string, value: string) => void;
  contextTable?: SpaceTables;
  compactMode?: boolean;
  source?: string;
  setEditMode?: (mode: [string, string]) => void;
  contextPath?: string;
};

export const DataTypeView: React.FC<DataTypeViewProps> = (
  props: DataTypeViewProps
) => {
  const { initialValue, column, row } = props;
  const saveValue = (value: string) => {
    props.updateValue(value);
  };
  const saveFieldValue = (fieldValue: string, value: string) => {
    if (
      props.editMode > CellEditMode.EditModeReadOnly &&
      props.updateFieldValue
    ) {
      props.updateFieldValue(fieldValue, value);
    } else {
      props.updateValue(value);
    }
  };
  const viewProps = {
    initialValue: initialValue as string,
    saveValue: saveValue,
    editMode: props.editMode,
    setEditMode: props.setEditMode ?? (() => {}),
    superstate: props.superstate,
    propertyValue: column.value,
    path: props.source ?? row?.[PathPropertyName],
    property: column,
    compactMode: props.compactMode,
  };

  const fieldType = fieldTypeForType(column.type, column.name);
  if (!fieldType) {
    return <></>;
  }
  if (fieldType.type == "file") {
    return (
      <LinkCell
        {...viewProps}
        multi={false}
        source={props.source}
        editMode={CellEditMode.EditModeReadOnly}
      ></LinkCell>
    );
  } else if (fieldType.type == "icon") {
    return (
      <IconCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
      ></IconCell>
    );
  } else if (fieldType.type == "boolean") {
    return <BooleanCell {...viewProps}></BooleanCell>;
  } else if (fieldType.type == "option") {
    return (
      <OptionCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
        saveOptions={saveFieldValue}
        source={props.source}
      ></OptionCell>
    );
  } else if (fieldType.type == "date") {
    return <DateCell {...viewProps}></DateCell>;
  } else if (fieldType.type == "context") {
    return (
      <ContextCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
        source={props.source}
        contextTable={props.contextTable}
        contextPath={props.contextPath}
      ></ContextCell>
    );
  } else if (fieldType.type == "aggregate") {
    return (
      <AggregateCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
        row={row}
        source={props.source}
        contextTable={props.contextTable}
        contextPath={props.contextPath}
        cols={props.columns}
      ></AggregateCell>
    );
  } else if (fieldType.type == "fileprop") {
    return (
      <FormulaCell
        {...viewProps}
        row={props.row}
        columns={props.columns}
        saveOptions={saveFieldValue}
        source={props.source}
      ></FormulaCell>
    );
  } else if (fieldType.type == "number") {
    return <NumberCell {...viewProps}></NumberCell>;
  } else if (fieldType.type == "link") {
    return (
      <LinkCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
        source={props.source}
      ></LinkCell>
    );
  } else if (fieldType.type == "tags-multi") {
    return <TagCell {...viewProps}></TagCell>;
  } else if (fieldType.type == "image") {
    return (
      <ImageCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
      ></ImageCell>
    );
  } else if (fieldType.type == "object") {
    return (
      <ObjectCell
        {...viewProps}
        multi={fieldType.multiType == column.type}
        savePropValue={saveFieldValue}
        columns={props.columns}
        row={props.row}
        compactMode={props.compactMode}
      ></ObjectCell>
    );
  } else if (fieldType.type == "color") {
    return <ColorCell {...viewProps}></ColorCell>;
  } else if (fieldType.type == "space") {
    return <SpaceCell {...viewProps} isTable={false}></SpaceCell>;
  } else if (fieldType.type == "table") {
    return <SpaceCell {...viewProps} isTable={true}></SpaceCell>;
  } else if (fieldType.type == "super") {
    return (
      <SuperCell
        {...viewProps}
        row={row}
        columns={props.columns}
        compactMode={props.compactMode}
        source={props.source}
      ></SuperCell>
    );
  } else if (fieldType.type == "input") {
    return (
      <PropertySelectCell
        {...viewProps}
        columns={props.columns}
      ></PropertySelectCell>
    );
  }
  return <TextCell {...viewProps}></TextCell>;
};
