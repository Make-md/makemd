import { FormulaEditor } from "core/react/components/SpaceEditor/Actions/FormulaEditor";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { unitTypes } from "core/utils/contexts/fields/units";
import { aggregateFnTypes } from "core/utils/contexts/predicate/aggregates";
import { schemaNameFromSpacePath, spaceNameFromSpacePath } from "core/utils/strings";
import { SelectMenuProps, SelectOption, Superstate } from "makemd-core";
import React, { useMemo } from "react";
import { fieldTypeForField, fieldTypeForType, fieldTypes } from "schemas/mdb";
import i18n from "shared/i18n";
import { defaultContextSchemaID } from "shared/schemas/context";
import { SpaceProperty, SpaceTableColumn } from "shared/types/mdb";
import { windowFromDocument } from "shared/utils/dom";
import { InputModal } from "../../Modals/InputModal";
import { EditOptionsModal } from "../../Modals/EditOptionsModal";
import StickerModal from "shared/components/StickerModal";
import { showFilterSelectorMenu } from "../properties/filterSelectorMenu";
import { nameForField } from "core/utils/frames/frames";

export const PropertyValueComponent = (props: {
  superstate: Superstate;
  name?: string;
  table?: string;
  fieldType: string;
  value: string;
  fields: SpaceTableColumn[];
  contextPath?: string;
  rowPath?: string;
  isSpace?: boolean;
  saveValue: (value: string) => void;
}) => {
  const showOptions = (
    e: React.MouseEvent,
    value: string,
    options: SelectOption[],
    field: string,
    saveProperty?: (prop: string) => void,
    placeholder?: string,
    canAdd?: boolean
  ) => {
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        editable: canAdd,
        searchable: true,
        saveOptions: (_, v) => {
          if (saveProperty) {
            saveProperty(v[0]);
          } else {
            saveParsedValue(field, v[0]);
          }
        },
        placeholder: placeholder ?? i18n.labels.propertyValueSpace,
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
    () => {
      const parsed = parseFieldValue(props.value, props.fieldType);
      // Resolve space path if it exists
      
      if (parsed?.space && props.contextPath) {
        parsed.space = props.superstate.spaceManager.resolvePath(parsed.space, props.contextPath);
      }
      
      return parsed;
    },
    [props.value, props.fieldType, props.contextPath]
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
      "space",
      null,
      null,
      true
    );
  };

  const selectAggregateSchema = async (e: React.MouseEvent) => {
    const contextInfo = props.superstate.contextsIndex.get(parsedValue.space || props.contextPath);
    
    if (!contextInfo || !contextInfo.schemas) {
      return;
    }
    
    const schemas = contextInfo.schemas;
    const properties: SelectOption[] = [];
   
    properties.push(
      ...(schemas
        .map((f) => ({
          name: f.name,
          value: f.id,
        })) ?? [])
    );
    showOptions(e, null, properties, "schema");
  };

   const selectAggregateContext = async (e: React.MouseEvent) => {
    showOptions(
      e,
      parsedValue.space,
      props.superstate
        .allSpaces()
        .filter((f) => f.type != "default")
        .map((m) => ({ name: m.name, value: m.path, description: m.path })),
      "space",
      null,
      null,
      true
    );
  };

  const selectAggregateRef = (e: React.MouseEvent) => {
    const properties: SelectOption[] = [];
    const childrenProperty = {
      name: i18n.menu.items,
      value: "$items",
    };
    if (props.rowPath) properties.push(childrenProperty);
    properties.push(
      ...(props.fields
        ?.filter((f) => f.type.startsWith("context"))
        .map((f) => ({
          name: f.name,
          value: f.name,
        })) ?? [])
    );
    showOptions(e, null, properties, "ref");
  };

  const selectAggregateProperty = (e: React.MouseEvent) => {
     let options: SelectOption[] = [];
    if (props.isSpace) {
    
      options = props.superstate.contextsIndex
              .get(parsedValue.space || props.contextPath)
              ?.mdb[parsedValue.schema]?.cols.map((m) => ({
                name: m.name,
                value: m.name,
              })) ?? []
              
    } else {
      const fieldRef = parsedValue.ref;
    
      let fieldSpace = null;
      if (fieldRef == "$items") {
        fieldSpace = props.rowPath;
      } else {
        const field = props.fields.find((f) => f.name == fieldRef);
        if (field) {
          fieldSpace = parseFieldValue(field.value, field.type)?.space;
        }
      }
      if (fieldSpace) {
        options = fieldSpace
          ? props.superstate.contextsIndex
              .get(fieldSpace)
              ?.contextTable?.cols.map((m) => ({
                name: m.name,
                value: m.name,
              })) ?? []
          : [];
      }
    }
    if (options.length > 0) {
      showOptions(
        e,
        parsedValue.field,
        options,
        "field",
        null,
        i18n.labels.propertyValueLinkedPlaceholder,
        true
      );
    }
  };

  const selectAggregateFilter = (e: React.MouseEvent) => {
    let fields: any[] = [];
    
    if (props.isSpace) {
      const contextData = props.superstate.contextsIndex.get(parsedValue.space || props.contextPath);
      const tableData = contextData?.mdb?.[parsedValue.schema];
      
      if (tableData?.cols) {
        fields = tableData.cols.map((col) => ({
          label: nameForField(col),
          field: col.name,
          type: parsedValue.schema,
          vType: col.type,
          defaultFilter: "is"
        }));
      }
    } else {
      const fieldRef = parsedValue.ref;
      let fieldSpace = null;
      
      if (fieldRef == "$items") {
        fieldSpace = props.rowPath;
      } else {
        const refField = props.fields?.find((f) => f.name == fieldRef);
        if (refField) {
          fieldSpace = parseFieldValue(refField.value, refField.type)?.space;
        }
      }
      
      if (fieldSpace) {
        const contextData = props.superstate.contextsIndex.get(fieldSpace);
        if (contextData?.contextTable?.cols) {
          fields = contextData.contextTable.cols.map((col) => ({
            label: col.name,
            field: col.name,
            type: "context",
            vType: col.type,
            defaultFilter: "is"
          }));
        }
      }
    }
    
    showFilterSelectorMenu(
      props.superstate.ui,
      (e.target as HTMLElement).getBoundingClientRect(),
      windowFromDocument(e.view.document),
      props.superstate,
      parsedValue.filters ?? [],
      fields,
      (filters) => saveParsedValue("filters", filters),
      {
        sections: [
          { name: i18n.menu.properties, value: "property" },
          { name: i18n.menu.metadata, value: "metadata" }
        ]
      }
    );
  }
  const selectAggregateFn = (e: React.MouseEvent) => {
    const options: SelectOption[] = [];
    let field: SpaceProperty = null;
    if (props.isSpace) {
      field = props.superstate.contextsIndex
        .get(parsedValue.space || props.contextPath)
        ?.mdb[parsedValue.schema]?.cols?.find((f) => f.name == parsedValue.field);
    } else {
    const fieldRef = parsedValue.ref;

    let fieldSpace = null;
    if (fieldRef == "$items") {
      fieldSpace = props.rowPath;
    } else {
      const refField = props.fields?.find((f) => f.name == parsedValue.ref);
      if (refField) {
        fieldSpace = parseFieldValue(refField.value, refField.type)?.space;
      }
    }
    
    if (fieldSpace) {
      field = props.superstate.contextsIndex
        .get(fieldSpace)
        ?.contextTable?.cols?.find((f) => f.name == parsedValue.field);
    }
  }
    options.push({
      name: i18n.labels.none,
      value: "",
    });
    
    Object.keys(aggregateFnTypes).forEach((f) => {
      if (
        aggregateFnTypes[f].type == fieldTypeForField(field) ||
        aggregateFnTypes[f].type == "any"
      )
        options.push({
          name: i18n.aggregates[f],
          value: f,
        });
    });
    showOptions(e, null, options, "fn");
  };

  const selectSpaceProperty = (e: React.MouseEvent) => {
    showOptions(
      e,
      parsedValue.property,
      props.superstate.contextsIndex
        .get(parsedValue.space)
        ?.contextTable?.cols.filter((f) => {
          return f.type?.startsWith("context") &&
            parseFieldValue(f.value, f.type)["space"] == props.contextPath
            ? true
            : false;
        })
        .map((m) => ({ name: m.name, value: m.name })) ?? [],
      "field",
      saveSpaceProperty,
      i18n.labels.propertyValueLinkedPlaceholder
    );
  };
  const selectProperty = (e: React.MouseEvent) => {
    const properties =
      props.fields
        ?.filter(
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
  const selectNumberFormat = (e: React.MouseEvent) => {
    const formats = unitTypes.map((f) => ({
      name: f.label,
      value: f.value,
    }));
    showOptions(
      e,
      null,
      formats,
      "format",
      (value: string) => {
        saveParsedValue("format", value);
      },
      "Select or Enter Custom Format",
      true
    );
  };
  const selectDateFormat = (e: React.MouseEvent) => {
    const formats = [
      {
        name: "2020-04-21 4:00PM",
        value: "yyyy-MM-dd h:mma",
      },
      {
        name: "Apr 21, 2020 4:00PM",
        value: "MMM d, yyyy h:mma",
      },
      {
        name: "Tue Apr 21, 2020 4:00PM",
        value: "EEE MMM d, yyyy h:mma",
      },
    ];
    showOptions(e, null, formats, "format", null, "Date Format", true);
  };
  const selectEditOptions = (e: React.MouseEvent) => {
    const parsedValue = parseFieldValue(props.value, "option");

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

    const saveOptionsHandler = (newOptions: SelectOption[], colorScheme?: string) => {
      saveParsedValue("options", newOptions);
      if (colorScheme !== undefined) {
        saveParsedValue("colorScheme", colorScheme);
      }
    };

    props.superstate.ui.openModal(
      i18n.labels.editOptions,
      <EditOptionsModal
        superstate={props.superstate}
        options={options}
        colorScheme={parsedValue.colorScheme}
        contextPath={props.contextPath}
        propertyName={props.name}
        saveOptions={saveOptionsHandler}
      />,
      windowFromDocument(e.view.document)
    );
  };
  const numberFormatToString = (format: string) => {
    const formatObj = unitTypes.find((f) => f.value == format);
    return formatObj ? formatObj.label : format;
  };

  const selectBooleanSticker = (e: React.MouseEvent, stickerType: string) => {
    props.superstate.ui.openPalette(
      <StickerModal
        ui={props.superstate.ui}
        selectedSticker={(sticker) => saveParsedValue(stickerType, sticker)}
      />,
      windowFromDocument(e.view.document)
    );
  };

  return props.fieldType?.startsWith("boolean") ? (
    <>
      <div className="mk-menu-option" onClick={(e) => selectBooleanSticker(e, "checked")}>
        <span>{i18n.labels.checkedSticker}</span>
        {parsedValue.checked ? (
          <span
            className="mk-menu-sticker"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker(parsedValue.checked),
            }}
          />
        ) : (
          <span>{i18n.labels.select}</span>
        )}
      </div>
      <div className="mk-menu-option" onClick={(e) => selectBooleanSticker(e, "unchecked")}>
        <span>{i18n.labels.uncheckedSticker}</span>
        {parsedValue.unchecked ? (
          <span
            className="mk-menu-sticker"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker(parsedValue.unchecked),
            }}
          />
        ) : (
          <span>{i18n.labels.select}</span>
        )}
      </div>
      <div className="mk-menu-option" onClick={(e) => selectBooleanSticker(e, "indeterminate")}>
        <span>{i18n.labels.indeterminateSticker}</span>
        {parsedValue.indeterminate ? (
          <span
            className="mk-menu-sticker"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker(parsedValue.indeterminate),
            }}
          />
        ) : (
          <span>{i18n.labels.select}</span>
        )}
      </div>
    </>
  ) : props.fieldType?.startsWith("option") ? (
    <div className="mk-menu-option" onClick={(e) => selectEditOptions(e)}>
      <span>{i18n.labels.editOptions}</span>
    </div>
  ) : props.fieldType?.startsWith("number") ? (
    <>
      <div className="mk-menu-option" onClick={(e) => selectNumberFormat(e)}>
        <span>{i18n.labels.numberFormat}</span>
        <span>{numberFormatToString(parsedValue.format)}</span>
      </div>
      {parsedValue.format === "sticker" && (
        <div className="mk-menu-option" onClick={(e) => selectBooleanSticker(e, "sticker")}>
          <span>{i18n.labels.selectSticker}</span>
          {parsedValue.sticker ? (
            <span
              className="mk-menu-sticker"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker(parsedValue.sticker),
              }}
            />
          ) : (
            <span>{i18n.labels.select}</span>
          )}
        </div>
      )}
    </>
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
          {parsedValue.space?.length > 0
            ? spaceNameFromSpacePath(parsedValue.space, props.superstate) ??
              i18n.labels.select
            : i18n.labels.select}
        </span>
      </div>
      {parsedValue.space?.length > 0 && props.contextPath && (
        <div className="mk-menu-option" onClick={(e) => selectSpaceProperty(e)}>
          <span>{i18n.labels.propertyValueLinked}</span>
          <span>{parsedValue.field ?? i18n.labels.select}</span>
        </div>
      )}
    </>
  ) : props.fieldType?.startsWith("aggregate") ? (
    <>
    {props.isSpace ? <>
    <div className="mk-menu-option" onClick={(e) =>  selectAggregateContext(e)}>
        <span>{"Space"}</span>
        <span>{spaceNameFromSpacePath(parsedValue.space || props.contextPath, props.superstate)}</span>
      </div>
      <div className="mk-menu-option" onClick={(e) => selectAggregateSchema(e) }>
        <span>{i18n.labels.list}</span>
        <span>{schemaNameFromSpacePath(parsedValue.space || props.contextPath,  parsedValue.schema, props.superstate)}</span>
      </div>
      <div className="mk-menu-option" onClick={(e) => selectAggregateFilter(e) }>
        <span>{i18n.descriptions.filter}</span>
        <span>{parsedValue.filters?.length > 0 ? `${parsedValue.filters.reduce((acc: number, g: any) => acc + (g.filters?.length || 0), 0)} filters` : i18n.labels.none}</span>
      </div>
      </> :
      <>
        <div className="mk-menu-option" onClick={(e) => selectAggregateRef(e)}>
        <span>{i18n.labels.propertyValueReference}</span>
        <span>{parsedValue.ref == "$items" ? i18n.menu.items : parsedValue.ref}</span>
      </div>
      {parsedValue.ref?.length > 0 && (
        <div className="mk-menu-option" onClick={(e) => selectAggregateFilter(e)}>
          <span>{i18n.descriptions.filter}</span>
          <span>{parsedValue.filters?.length > 0 ? `${parsedValue.filters.reduce((acc: number, g: any) => acc + (g.filters?.length || 0), 0)} filters` : i18n.labels.none}</span>
        </div>
      )}
      </>
}
      {(parsedValue.ref?.length > 0  || parsedValue.schema?.length > 0)  && (
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
          <span>{i18n.aggregates[parsedValue?.fn]}</span>
        </div>
      )}
      {aggregateFnTypes[parsedValue?.fn]?.valueType == "number" && (
        <div className="mk-menu-option" onClick={(e) => selectNumberFormat(e)}>
          <span>{i18n.labels.numberFormat}</span>
          <span>{numberFormatToString(parsedValue.format)}</span>
        </div>
      )}
      {aggregateFnTypes[parsedValue?.fn]?.valueType == "date" && (
        <div className="mk-menu-option" onClick={(e) => selectDateFormat(e)}>
          <span>{i18n.labels.dateFormat}</span>
          <span>{parsedValue.format}</span>
        </div>
      )}
    </>
  ) : props.fieldType == "fileprop" ? (
    <>
      <div className="mk-menu-option" onClick={(e) => editFormula(e)}>
        <span>{i18n.labels.propertyLookup}</span>
      </div>
      <div className="mk-menu-option" onClick={(e) => selectType(e)}>
        <span>{i18n.labels.propertyType}</span>
        <span>{fieldTypeForType(parsedValue.type)?.label}</span>
      </div>
      {fieldTypeForType(parsedValue.type)?.type == "number" && (
        <>
          <div className="mk-menu-option" onClick={(e) => selectNumberFormat(e)}>
            <span>{i18n.labels.numberFormat}</span>
            <span>{numberFormatToString(parsedValue.format)}</span>
          </div>
          {parsedValue.format === "sticker" && (
            <div className="mk-menu-option" onClick={(e) => selectBooleanSticker(e, "sticker")}>
              <span>{i18n.labels.selectSticker}</span>
              {parsedValue.sticker ? (
                <span
                  className="mk-menu-sticker"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(parsedValue.sticker),
                  }}
                />
              ) : (
                <span>{i18n.labels.select}</span>
              )}
            </div>
          )}
        </>
      )}
      {fieldTypeForType(parsedValue.type)?.type == "date" && (
        <div className="mk-menu-option" onClick={(e) => selectDateFormat(e)}>
          <span>{i18n.labels.dateFormat}</span>
          <span>{parsedValue.format}</span>
        </div>
      )}
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
      <span>{i18n.labels.name}</span>
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
  ) : props.fieldType == "flex" ? (
    <div>
      <div className="mk-menu-option" onClick={(e) => selectType(e)}>
        <span>{i18n.labels.propertyType}</span>
        <span>{fieldTypeForType(parsedValue.type)?.label}</span>
      </div>
      {fieldTypeForType(parsedValue.type).type == "number" && (
        <>
          <div className="mk-menu-option" onClick={(e) => selectNumberFormat(e)}>
            <span>{i18n.labels.numberFormat}</span>
            <span>{numberFormatToString(parsedValue.format)}</span>
          </div>
          {parsedValue.format === "sticker" && (
            <div className="mk-menu-option" onClick={(e) => selectBooleanSticker(e, "sticker")}>
              <span>{i18n.labels.selectSticker}</span>
              {parsedValue.sticker ? (
                <span
                  className="mk-menu-sticker"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(parsedValue.sticker),
                  }}
                />
              ) : (
                <span>{i18n.labels.select}</span>
              )}
            </div>
          )}
        </>
      )}
      {fieldTypeForType(parsedValue.type).type == "date" && (
        <div className="mk-menu-option" onClick={(e) => selectDateFormat(e)}>
          <span>{i18n.labels.dateFormat}</span>
          <span>{parsedValue.format}</span>
        </div>
      )}
    </div>
  ) : (
    <></>
  );
};
