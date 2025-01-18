import { FormulaEditor } from "core/react/components/SpaceEditor/Actions/FormulaEditor";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { aggregateFnTypes } from "core/utils/contexts/predicate/aggregates";
import { spaceNameFromSpacePath } from "core/utils/strings";
import { SelectMenuProps, SelectOption, Superstate } from "makemd-core";
import React, { useMemo } from "react";
import { fieldTypeForField, fieldTypeForType, fieldTypes } from "schemas/mdb";
import i18n from "shared/i18n";
import { defaultContextSchemaID } from "shared/schemas/context";
import { SpaceTableColumn } from "shared/types/mdb";
import { onlyUniqueProp, uniq } from "shared/utils/array";
import { colors } from "shared/utils/color";
import { windowFromDocument } from "shared/utils/dom";
import { parseMultiString } from "utils/parsers";
import { InputModal } from "../../Modals/InputModal";
import { defaultMenu, menuInput, menuSeparator } from "../menu/SelectionMenu";

export const PropertyValueComponent = (props: {
  superstate: Superstate;
  name?: string;
  table: string;
  fieldType: string;
  value: string;
  fields: SpaceTableColumn[];
  contextPath?: string;
  saveValue: (value: string) => void;
}) => {
  const showOptions = (
    e: React.MouseEvent,
    value: string,
    options: SelectOption[],
    field: string,
    saveProperty?: (prop: string) => void
  ) => {
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        editable: true,
        searchable: true,
        saveOptions: (_, v) => {
          if (saveProperty) {
            saveProperty(v[0]);
          } else {
            saveParsedValue(field, v[0]);
          }
        },
        placeholder: i18n.labels.propertyValueSpace,
        value: [value ?? ""],
        options: options,
      },
      windowFromDocument(e.view.document)
    );
  };
  const selectType = (e: React.MouseEvent) => {
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        searchable: false,
        saveOptions: (_, v) => saveParsedValue("type", v[0]),
        value: [],
        showAll: true,
        options: fieldTypes
          .filter((f) => f.primative)
          .map((f, i) => ({
            id: i + 1,
            name: f.label,
            value: f.type,
            icon: f.icon,
          })),
      },
      windowFromDocument(e.view.document)
    );
  };
  const parsedValue = useMemo(
    () => parseFieldValue(props.value, props.fieldType, props.superstate),
    [props.value, props.fieldType]
  );
  const saveParsedValue = (field: string, value: any) => {
    props.saveValue(JSON.stringify({ ...parsedValue, [field]: value }));
  };
  const saveSpaceProperty = (field: string) => {
    const colExists = props.superstate.contextsIndex
      .get(parsedValue.space)
      ?.contextTable?.cols?.find((f) => f.name == field);
    if (!colExists) {
      props.superstate.spaceManager.addSpaceProperty(parsedValue.space, {
        name: field,
        schemaId: defaultContextSchemaID,
        type: "context",
        value: JSON.stringify({
          space: props.contextPath,
          field: props.name,
        }),
      });
    } else {
      props.superstate.spaceManager.saveSpaceProperty(
        parsedValue.space,
        {
          ...colExists,
          value: JSON.stringify({
            space: props.contextPath,
            field: props.name,
          }),
        },
        colExists
      );
    }
    saveParsedValue("field", field);
  };
  const selectContext = (e: React.MouseEvent) => {
    showOptions(
      e,
      parsedValue.space,
      props.superstate
        .allSpaces()
        .filter((f) => f.type != "default")
        .map((m) => ({ name: m.name, value: m.path, description: m.path })),
      "space"
    );
  };

  const selectAggregateRef = (e: React.MouseEvent) => {
    const properties =
      props.fields
        .filter((f) => f.type == "context")
        .map((f) => ({
          name: f.name,
          value: f.name,
        })) ?? [];
    showOptions(e, null, properties, "ref");
  };

  const selectAggregateProperty = (e: React.MouseEvent) => {
    const fieldRef = parsedValue.ref;
    const field = props.fields.find((f) => f.name == fieldRef);
    if (field) {
      const fieldSpace = parseFieldValue(
        field.value,
        field.type,
        props.superstate
      )?.space;
      if (fieldSpace) {
        showOptions(
          e,
          parsedValue.field,
          props.superstate.contextsIndex
            .get(fieldSpace)
            ?.contextTable?.cols.map((m) => ({
              name: m.name,
              value: m.name,
            })) ?? [],
          "field",
          saveSpaceProperty
        );
      }
    }
  };

  const selectAggregateFn = (e: React.MouseEvent) => {
    const refField = props.fields.find((f) => f.name == parsedValue.ref);
    if (refField) {
      const fieldSpace = parseFieldValue(
        refField.value,
        refField.type,
        props.superstate
      )?.space;
      if (fieldSpace) {
        const field = props.superstate.contextsIndex
          .get(fieldSpace)
          ?.contextTable?.cols?.find((f) => f.name == parsedValue.field);
        if (field) {
          const options: SelectOption[] = [];
          options.push({
            name: "None",
            value: "",
          });
          Object.keys(aggregateFnTypes).forEach((f) => {
            if (
              aggregateFnTypes[f].type.includes(fieldTypeForField(field)) ||
              aggregateFnTypes[f].type.includes("any")
            )
              options.push({
                name: aggregateFnTypes[f].label,
                value: f,
              });
          });
          showOptions(e, null, options, "fn");
        }
      }
    }
  };

  const selectSpaceProperty = (e: React.MouseEvent) => {
    showOptions(
      e,
      parsedValue.property,
      props.superstate.contextsIndex
        .get(parsedValue.space)
        ?.contextTable?.cols.filter((f) => {
          return f.type?.startsWith("context") &&
            parseFieldValue(f.value, f.type, props.superstate)["space"] ==
              props.contextPath
            ? true
            : false;
        })
        .map((m) => ({ name: m.name, value: m.name })) ?? [],
      "field",
      saveSpaceProperty
    );
  };
  const selectProperty = (e: React.MouseEvent) => {
    const properties =
      props.fields
        .filter(
          (f) => f.type == "file" || f.type == "link" || f.type == "context"
        )
        .map((f) => ({
          name: f.name,
          value: f.name,
        })) ?? [];
    showOptions(e, null, properties, "field");
  };

  const editFormula = (e: React.MouseEvent) => {
    const _props = {
      superstate: props.superstate,
      saveFormula: (value: string) => saveParsedValue("value", value),
      formula: parsedValue.value,
      value: {},
      fields: props.fields.filter((f) => f.name != props.name),
      path: "",
    };
    props.superstate.ui.openCustomMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      <FormulaEditor {..._props}></FormulaEditor>,
      { ..._props },
      windowFromDocument(e.view.document),
      "bottom"
    );
  };
  const selectDateFormat = (e: React.MouseEvent) => {
    const formats = [
      {
        name: "2020-04-21",
        value: "yyyy-MM-dd",
      },
      {
        name: "Apr 21, 2020",
        value: "MMM d, yyyy",
      },
      {
        name: "Tue Apr 21, 2020",
        value: "EEE MMM d, yyyy",
      },
    ];
    showOptions(e, null, formats, "format");
  };
  const selectEditOptions = (e: React.MouseEvent) => {
    const parsedValue = parseFieldValue(
      props.value,
      "option",
      props.superstate,
      props.contextPath
    );

    const parseOptions = (_options: SelectOption[]): SelectOption[] => {
      return [
        ...(((_options as SelectOption[]) ?? [])
          .filter((f) => f.value)
          .map((t) => ({
            ...t,
            color: t.color?.length > 0 ? t.color : "var(--mk-color-none)",
            removeable: true,
          })) ?? []),
      ].filter((f) => f.value.length > 0);
    };

    const options = parseOptions(parsedValue.options ?? []);

    const removeOption = (option: string) => {
      const newOptions = options.filter((f) => f.value != option);
      saveParsedValue("options", newOptions);
    };
    const savePropValue = (options: SelectOption[], value: string[]) => {
      saveParsedValue("options", options);
    };
    const saveOptions = (_options: string[], _value: string[]) => {
      const newOptions = [..._options]
        .filter((f) => f.length > 0)
        .map(
          (t) =>
            options.find((f) => f.value == t) ?? {
              name: t,
              value: t,
            }
        );
      savePropValue(newOptions, _value);
    };
    const saveOption = (option: string, newValue: SelectOption) => {
      const newOptions = options.map((t) => (t.value == option ? newValue : t));
      saveParsedValue("options", newOptions);
    };

    const showOptionMenu = (e: React.MouseEvent, optionValue: string) => {
      const option = options.find((f) => f.value == optionValue);
      const menuOptions: SelectOption[] = [];
      menuOptions.push(
        menuInput(option.value, (value) =>
          saveOption(option.value, { ...option, value: value })
        )
      );
      menuOptions.push(menuSeparator);
      menuOptions.push({
        name: "None",
        color: "var(--mk-color-none)",
        onClick: () => {
          saveOption(option.value, { ...option, color: "" });
        },
      });

      colors.forEach((f) => {
        menuOptions.push({
          name: f[0],
          value: f[1],
          color: `${f[1]}`,
          onClick: () => {
            saveOption(option.value, { ...option, color: f[1] });
          },
        });
      });

      props.superstate.ui.openMenu(
        (e.target as HTMLElement).getBoundingClientRect(),
        defaultMenu(props.superstate.ui, menuOptions),
        windowFromDocument(e.view.document)
      );
    };

    const allOptions = uniq(
      [
        ...(props.superstate.spacesMap.getInverse(props.contextPath) ?? []),
      ].flatMap(
        (f) =>
          parseMultiString(
            props.superstate.pathsIndex.get(f)?.metadata?.property?.[props.name]
          ) ?? []
      )
    );

    const menuProps = (): SelectMenuProps => {
      const _options: SelectOption[] = [
        {
          name: "Add from Existing Values",
          value: "$import",
          onClick: () => {
            savePropValue(
              [
                ...options,
                ...allOptions.map((f) => ({
                  name: f,
                  value: f,
                })),
              ].filter(onlyUniqueProp("value")),
              []
            );
          },
        },
        menuSeparator,
      ];
      _options.push(
        ...options.map((f) => ({
          ...f,
          onRemove: () => removeOption(f.value),
          onMoreOptions: (e: React.MouseEvent) => showOptionMenu(e, f.value),
        }))
      );

      return {
        multi: false,
        editable: true,
        ui: props.superstate.ui,
        value: [],
        options: _options,
        saveOptions,
        placeholder: i18n.labels.optionItemSelectPlaceholder,
        searchable: true,
        showAll: true,
      };
    };
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      menuProps(),
      windowFromDocument(e.view.document),
      "bottom"
    );
  };
  return props.fieldType?.startsWith("option") ? (
    <div className="mk-menu-option" onClick={(e) => selectEditOptions(e)}>
      <span>{i18n.labels.editOptions}</span>
    </div>
  ) : props.fieldType?.startsWith("date") ? (
    <div className="mk-menu-option" onClick={(e) => selectDateFormat(e)}>
      <span>{i18n.labels.dateFormat}</span>
      <span>{parsedValue.format}</span>
    </div>
  ) : props.fieldType?.startsWith("context") ? (
    <>
      <div className="mk-menu-option" onClick={(e) => selectContext(e)}>
        <span>{i18n.labels.propertyValueSpace}</span>
        <span>
          {spaceNameFromSpacePath(parsedValue.space, props.superstate)}
        </span>
      </div>
      {parsedValue.space?.length > 0 && props.contextPath && (
        <div className="mk-menu-option" onClick={(e) => selectSpaceProperty(e)}>
          <span>{i18n.labels.propertyValueProperty}</span>
          <span>{parsedValue.field}</span>
        </div>
      )}
    </>
  ) : props.fieldType?.startsWith("aggregate") ? (
    <>
      <div className="mk-menu-option" onClick={(e) => selectAggregateRef(e)}>
        <span>{i18n.labels.propertyValueReference}</span>
        <span>{parsedValue.ref}</span>
      </div>
      {parsedValue.ref?.length > 0 && (
        <div
          className="mk-menu-option"
          onClick={(e) => selectAggregateProperty(e)}
        >
          <span>{i18n.labels.propertyValueAggregate}</span>
          <span>{parsedValue.field}</span>
        </div>
      )}
      {parsedValue.field?.length > 0 && (
        <div className="mk-menu-option" onClick={(e) => selectAggregateFn(e)}>
          <span>{i18n.labels.aggregateBy}</span>
          <span>{aggregateFnTypes[parsedValue?.fn]?.label}</span>
        </div>
      )}
    </>
  ) : props.fieldType == "number" ? (
    <></>
  ) : props.fieldType == "fileprop" ? (
    <>
      <div className="mk-menu-option" onClick={(e) => editFormula(e)}>
        <span>{i18n.labels.propertyLookup}</span>
      </div>
      <div className="mk-menu-option" onClick={(e) => selectType(e)}>
        <span>{i18n.labels.propertyType}</span>
        <span>{fieldTypeForType(parsedValue.type)?.label}</span>
      </div>
    </>
  ) : props.fieldType == "object" ? (
    <div
      className="mk-menu-option"
      onClick={(e) => {
        props.superstate.ui.openModal(
          "Object Name",

          <InputModal
            value={parsedValue.typeName}
            saveLabel={"Rename Object"}
            saveValue={(value) => {
              saveParsedValue("typeName", value);
            }}
          ></InputModal>,
          windowFromDocument(e.view.document)
        );
      }}
    >
      <span>Name</span>
      <span>{parsedValue.typeName}</span>
    </div>
  ) : props.fieldType == "super" ? (
    <>
      <div className="mk-menu-option">
        <span>{i18n.labels.propertyDynamic}</span>
        <input
          type="checkbox"
          checked={parsedValue.dynamic == true}
          onChange={() => saveParsedValue("dynamic", !parsedValue.dynamic)}
        ></input>
      </div>

      <div className="mk-menu-option" onClick={(e) => selectProperty(e)}>
        <span>{i18n.labels.propertyFileProp}</span>
        <span>{parsedValue.field}</span>
      </div>
    </>
  ) : (
    <></>
  );
};
