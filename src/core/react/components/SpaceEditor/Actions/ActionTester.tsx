import { runFormulaWithContext } from "core/utils/formula/parser";
import { executeCode } from "core/utils/frames/runner";
import { debounce } from "lodash";
import { Superstate, i18n } from "makemd-core";
import React, { useEffect, useState } from "react";
import { SpaceProperty } from "types/mdb";
import { parsePropertyValue } from "utils/properties";
import { runActionString } from "../../../../utils/commands/actions";
export const ActionTester = (props: {
  superstate: Superstate;
  type: "formula" | "script" | "actions";
  code: string;
  fields: SpaceProperty[];
  value: { [key: string]: string };
  path: string;
  autoTest?: boolean;
}) => {
  const path = props.superstate.pathsIndex.get(props.path);

  const [fieldValues, setFieldValues] = useState<{ [key: string]: any }>({});
  const [result, setResult] = useState<any>();
  const [error, setError] = useState<any>();
  useEffect(() => {
    if (props.autoTest)
      debounce(() => runCommand(), 500, {
        leading: true,
        trailing: true,
      })();
  }, [props.code, props.autoTest]);
  const runCommand = async () => {
    const values = Object.keys(fieldValues).reduce(
      (f, g) => {
        const col = props.fields.find((c) => c.name == g);
        const value = parsePropertyValue(col.type, fieldValues[g]);
        if (value?.length > 0)
          return { ...f, [g]: parsePropertyValue(col.type, fieldValues[g]) };
        return f;
      },
      {
        ...props.value,
        $api: props.superstate.api,
        $contexts: {
          $space: {
            path: path,
          },
          $context: {},
        },
        $properties: props.fields,
      }
    );
    let result;
    let error;
    try {
      if (props.type == "actions")
        result = await runActionString(props.superstate, props.code, {
          props: {},
          instanceProps: values,
          iterations: 0,
        });
      if (props.type == "script")
        result = await executeCode(props.code, values);
      if (props.type == "formula")
        result = await runFormulaWithContext(
          props.superstate.formulaContext,
          props.superstate.pathsIndex,
          props.superstate.spacesMap,
          props.code,
          props.fields.reduce((p, c) => ({ ...p, [c.name]: c }), {}),
          values,
          path,
          true
        );
    } catch (e) {
      result = "";
      error = e?.message;
    }
    setResult(result);
    setError(error);
  };

  return (
    <div className="mk-editor-tester">
      {error?.length > 0 ? (
        <>
          Error:{" "}
          <span style={{ color: "var(--mk-ui-text-error)" }}>{error}</span>
        </>
      ) : (
        <>
          Result:{" "}
          <span style={{ color: "var(--mk-ui-text-primary" }}>
            {String(result)}
          </span>
        </>
      )}
      {!props.autoTest && (
        <button onClick={() => runCommand()}>{i18n.buttons.run}</button>
      )}
    </div>
  );
};
