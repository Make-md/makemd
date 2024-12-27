import { parseFieldValue } from "core/schemas/parseFieldValue";
import { calculateAggregate } from "core/utils/contexts/predicate/aggregates";
import React, { useEffect, useMemo, useState } from "react";
import { PathPropertyName } from "shared/types/context";
import { DBRow, SpaceTableColumn, SpaceTables } from "shared/types/mdb";
import { uniq } from "shared/utils/array";
import { parseMultiString } from "utils/parsers";
import { TableCellMultiProp } from "../TableView/TableView";

export const ReduceCell = (
  props: TableCellMultiProp & {
    source: string;
    row: DBRow;
    contextTable: SpaceTables;
    contextPath: string;
    cols: SpaceTableColumn[];
  }
) => {
  const fieldValue = useMemo(
    () => parseFieldValue(props.propertyValue, "aggregate", props.superstate),
    [props.propertyValue]
  );

  const refFieldValue = useMemo(() => {
    const field = props.cols?.find((f) => f.name == fieldValue.ref);
    if (field && field.type == "context") {
      return parseFieldValue(field.value, "context", props.superstate);
    }
    return null;
  }, [props.cols, fieldValue]);

  const spacePath = useMemo(() => {
    if (refFieldValue && refFieldValue.space) {
      return props.superstate.spaceManager.resolvePath(
        refFieldValue.space,
        props.contextPath
      );
    }
  }, [refFieldValue, props.contextPath]);

  const column = useMemo(() => {
    return props.contextTable[spacePath]?.cols.find(
      (f) => f.name == fieldValue.field
    );
  }, [fieldValue.field, props.contextTable, spacePath]);
  const parseValue = (v: string, multi: boolean) =>
    (multi ? parseMultiString(v) ?? [] : [v]).filter((f) => f);

  const [propValues, setPropValues] = useState([]);
  useEffect(() => {
    if (!refFieldValue?.field || !props.contextTable[spacePath]) {
      return;
    }

    setPropValues(
      props.contextTable[spacePath].rows.reduce((p, c) => {
        if (parseMultiString(c[refFieldValue.field]).includes(props.path)) {
          return [...p, c[PathPropertyName]];
        }
        return p;
      }, [])
    );
  }, [spacePath, refFieldValue, props.path, props.contextTable]);

  const [value, setValue] = useState<string[]>([]);
  const result = useMemo(() => {
    if (!spacePath || !column) {
      return "";
    }

    return calculateAggregate(
      props.superstate,
      uniq([...value, ...propValues])
        .map((f) =>
          props.contextTable[spacePath].rows.find(
            (r) => r[PathPropertyName] == f
          )
        )
        .filter((f) => f)
        .map((f) => f[column.name]),
      fieldValue.fn,
      column
    );
  }, [value, propValues, fieldValue, props.contextTable, spacePath, column]);

  useEffect(() => {
    setValue(parseValue(props.row[fieldValue.ref], props.multi));
  }, [props.row, fieldValue, props.multi]);

  return <div className="mk-cell-text">{result}</div>;
};
