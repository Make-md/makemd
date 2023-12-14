import i18n from "core/i18n";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "core/superstate/superstate";
import { ensureArray } from "core/utils/strings";
import React from "react";
import { fieldTypeForType, fieldTypes } from "schemas/mdb";
import { safelyParseJSON } from "utils/parsers";
import { CellEditMode, TableCellMultiProp } from "../TableView/TableView";
import { DataTypeView } from "./DataTypeView";

type ObjectType = {
  [key: string]: { type: string; value?: string };
};

export const ObjectEditor = (props: {
  value: Record<string, any>;
  superstate: Superstate;
  type?: ObjectType;
  saveValue: (newValue: Record<string, any>) => void;
  saveType: (newType: ObjectType) => void;
}) => {
  const { value, type, saveValue, saveType } = props;

  const saveKey = (key: string, newKey: string) => {
    if (key != newKey)
      saveValue({
        ...value,
        [newKey]: value[key],
        [key]: undefined,
      });
  };
  const saveVal = (key: string, val: string) => {
    saveValue({
      ...value,
      [key]: val,
    });
  };
  const selectType = (e: React.MouseEvent, key: string) => {
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        searchable: false,
        saveOptions: (_, values) =>
          saveType({
            ...(type ?? {}),
            [key]: { ...(type?.[key] ?? {}), type: values[0] },
          }),
        value: [],
        showAll: true,
        options: fieldTypes.map((f, i) => ({
          id: i + 1,
          name: f.label,
          value: f.type,
          icon: "",
        })),
      }
    );
  };
  return (
    <>
      {Object.keys(value).map((f, i) => (
        <>
          <div key={i} className="mk-cell-object-row">
            <div className="mk-path-context-field">
              <div
                className="mk-path-context-field-icon"
                onClick={(e) => selectType(e, f)}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker(
                    fieldTypeForType(type?.[f]?.type)?.icon
                  ),
                }}
              ></div>
              <input
                onClick={(e) => e.stopPropagation()}
                className="mk-path-context-field-key"
                type="text"
                value={f as string}
                onBlur={(e) => saveKey(f, e.target.value)}
              />
            </div>
            {!type?.[f]?.type ||
              (!type[f].type.startsWith("object") && (
                <div className="mk-path-context-value">
                  <DataTypeView
                    initialValue={value[f]}
                    superstate={props.superstate}
                    row={value}
                    column={{
                      name: f,
                      schemaId: "",
                      table: "",
                      type: type?.[f]?.type ?? "text",
                      value: type?.[f]?.value,
                    }}
                    editable={true}
                    updateValue={(value: string) => saveVal(f, value)}
                    updateFieldValue={(fieldValue: string, value: string) =>
                      saveType({
                        ...(type ?? {}),
                        [f]: {
                          ...(type?.[f] ?? {}),
                          type: type?.[f]?.type ?? "text",
                          value: fieldValue,
                        },
                      })
                    }
                  ></DataTypeView>
                </div>
              ))}
          </div>

          {type?.[f]?.type && type[f].type.startsWith("object") && (
            <div className="mk-path-context-value">
              <DataTypeView
                initialValue={value[f]}
                superstate={props.superstate}
                row={value}
                column={{
                  name: f,
                  schemaId: "",
                  table: "",
                  type: type?.[f]?.type ?? "text",
                  value: type?.[f]?.value,
                }}
                editable={true}
                updateValue={(value: string) => saveVal(f, value)}
                updateFieldValue={(fieldValue: string, value: string) =>
                  saveType({
                    ...(type ?? {}),
                    [f]: {
                      ...(type?.[f] ?? {}),
                      type: type?.[f]?.type ?? "text",
                      value: fieldValue,
                    },
                  })
                }
              ></DataTypeView>
            </div>
          )}
        </>
      ))}
    </>
  );
};

export const ObjectCell = (
  props: TableCellMultiProp & {
    savePropValue: (fieldValue: string, newValue: string) => void;
  }
) => {
  const parsedValue = parseFieldValue(props.propertyValue, "object");
  const type = parsedValue.type;
  const { initialValue, superstate } = props;

  const [value, setValue] = React.useState(
    props.multi
      ? ensureArray(safelyParseJSON(initialValue))
      : safelyParseJSON(initialValue) ?? {}
  );
  const saveType = (newType: ObjectType) => {
    props.savePropValue(
      JSON.stringify({ ...parsedValue, type: newType }),
      JSON.stringify(value)
    );
  };
  const saveValue = (newValue: { [key: string]: string }) => {
    props.saveValue(JSON.stringify(newValue));
  };
  const saveMultiValue = (
    newValue: { [key: string]: string },
    index: number
  ) => {
    props.saveValue(
      JSON.stringify(
        (value as Record<string, any>[]).map((f, i) =>
          i == index ? newValue : f
        )
      )
    );
  };
  const newKey = (key: string) => {
    if (key)
      saveValue({
        ...value,
        [key]: "",
      });
  };

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    props.multi
      ? ensureArray(safelyParseJSON(initialValue))
      : safelyParseJSON(initialValue) ?? {};
  }, [initialValue, props.multi]);

  return props.editMode <= CellEditMode.EditModeView ? (
    <></>
  ) : (
    <div className="mk-cell-object">
      {props.multi ? (
        (value as Record<string, any>[]).map((f, i) => (
          <ObjectEditor
            saveType={saveType}
            value={f}
            type={type}
            superstate={superstate}
            key={i}
            saveValue={(val) => saveMultiValue(val, i)}
          ></ObjectEditor>
        ))
      ) : (
        <ObjectEditor
          superstate={superstate}
          value={value}
          type={type}
          saveValue={saveValue}
          saveType={saveType}
        ></ObjectEditor>
      )}
      <div className="mk-path-context-field">
        <input
          onClick={(e) => e.stopPropagation()}
          className="mk-cell-text"
          type="text"
          placeholder={i18n.labels.newProperty}
          value={""}
          onBlur={(e) => newKey(e.target.value)}
        />
      </div>
    </div>
  );
};
