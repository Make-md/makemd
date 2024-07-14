import { parseFieldValue } from "core/schemas/parseFieldValue";
import {
  unwrapParanthesis,
  wrapParanthesis,
  wrapQuotes,
} from "core/utils/strings";
import React, { useEffect, useMemo, useState } from "react";
import { DBRow, SpaceTableColumn } from "types/mdb";
import { windowFromDocument } from "utils/dom";
import { TableCellProp } from "../TableView/TableView";
import { ParameterSetter } from "./SuperCell/ParameterSetter";

export const SuperCell = (
  props: TableCellProp & {
    row: DBRow;
    columns?: SpaceTableColumn[];
    compactMode: boolean;
    source: string;
  }
) => {
  const command = useMemo(() => {
    const parsedValue = parseFieldValue(
      props.propertyValue,
      "super",
      props.superstate
    );
    const superPropertyName = parsedValue.dynamic
      ? props.row?.[parsedValue.field]
      : parsedValue.field;
    return props.superstate.cli.commandForAction(superPropertyName);
  }, [props.propertyValue, props.row]);
  const parseValue = (value: string) => {
    if (!value) return null;
    let parsedValue: Record<string, any>;
    try {
      parsedValue = JSON.parse(value);
      parsedValue = Object.keys(parsedValue).reduce((p, c) => {
        if (typeof parsedValue[c] === "object") {
          return { ...p, [c]: JSON.stringify(parsedValue[c]) };
        }
        if (typeof parsedValue[c] === "string") {
          return { ...p, [c]: wrapQuotes(parsedValue[c]) };
        }
        return { ...p, [c]: parsedValue[c] };
      }, {});
    } catch (e) {
      console.log(e);
      return null;
    }
    return parsedValue;
  };

  const [value, setValue] = useState(
    parseValue(unwrapParanthesis(props.initialValue))
  );
  useEffect(() => {
    setValue(parseValue(unwrapParanthesis(props.initialValue)));
  }, [props.initialValue]);
  const specialStringify = (obj: Record<string, any>) => {
    return `{${Object.keys(obj ?? {})
      .map((key) => `"${key}": ${obj[key]}`)
      .join(",")}}`;
  };
  const saveValue = (key: string, val: string) => {
    setValue({ ...value, [key]: val });
    const newValue = wrapParanthesis(
      specialStringify({ ...value, [key]: val })
    );
    props.saveValue(newValue);
  };

  const editParameters = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const _props = {
      superstate: props.superstate,
      command: command,
      value: value,
      saveValue: saveValue,
    };
    props.superstate.ui.openCustomMenu(
      rect,
      <ParameterSetter {..._props}></ParameterSetter>,
      _props,
      windowFromDocument(e.view.document),
      "bottom"
    );
  };
  return (
    <>
      {command &&
        (props.compactMode ? (
          <div className="mk-cell-super" onClick={(e) => editParameters(e)}>
            Edit Parameters
          </div>
        ) : (
          <ParameterSetter
            superstate={props.superstate}
            command={command}
            value={value}
            saveValue={saveValue}
          ></ParameterSetter>
        ))}
    </>
  );
};
