import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { PathPropertyName } from "core/types/context";
import { calculateAggregate } from "core/utils/contexts/predicate/aggregates";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { DBRow } from "types/mdb";
import { uniq } from "utils/array";
import { parseMultiString } from "utils/parsers";
import { TableCellMultiProp } from "../TableView/TableView";

export const ReduceCell = (
  props: TableCellMultiProp & {
    source: string;
    row: DBRow;
  }
) => {
  const { spaceState } = useContext(SpaceContext);
  const { contextTable, cols } = useContext(ContextEditorContext);

  const fieldValue = useMemo(
    () => parseFieldValue(props.propertyValue, "aggregate", props.superstate),
    [props.propertyValue]
  );

  const refFieldValue = useMemo(() => {
    const field = cols.find((f) => f.name == fieldValue.ref);
    if (field && field.type == "context") {
      return parseFieldValue(field.value, "context", props.superstate);
    }
    return null;
  }, [cols, fieldValue]);

  const spacePath = useMemo(() => {
    if (refFieldValue && refFieldValue.space) {
      return props.superstate.spaceManager.resolvePath(
        refFieldValue.space,
        spaceState?.path
      );
    }
  }, [refFieldValue, spaceState]);
  const column = useMemo(() => {
    return contextTable[spacePath]?.cols.find(
      (f) => f.name == fieldValue.field
    );
  }, [fieldValue.field, contextTable, spacePath]);
  const parseValue = (v: string, multi: boolean) =>
    (multi ? parseMultiString(v) ?? [] : [v]).filter((f) => f);

  const [propValues, setPropValues] = useState([]);
  useEffect(() => {
    if (!fieldValue?.field || !contextTable[spacePath]) {
      return;
    }
    setPropValues(
      contextTable[spacePath].rows.reduce((p, c) => {
        if (parseMultiString(c[fieldValue.field]).includes(props.path)) {
          return [...p, c[PathPropertyName]];
        }
        return p;
      }, [])
    );
  }, [spacePath, fieldValue, props.path, contextTable]);

  const [value, setValue] = useState<string[]>([]);
  const result = useMemo(() => {
    if (!spacePath || !column) {
      return "";
    }

    return calculateAggregate(
      props.superstate,
      uniq([...value, ...propValues])
        .map((f) =>
          contextTable[spacePath].rows.find((r) => r[PathPropertyName] == f)
        )
        .filter((f) => f)
        .map((f) => f[column.name]),
      fieldValue.fn,
      column
    );
  }, [value, propValues, fieldValue, contextTable, spacePath, column]);

  useEffect(() => {
    setValue(parseValue(props.row[fieldValue.ref], props.multi));
  }, [props.row, fieldValue, props.multi]);

  return <div className="mk-cell-text">{result}</div>;
};
