import { ObjectCell } from "core/react/components/SpaceView/Contexts/DataTypeView/ObjectCell";
import { parseSourceOptions } from "core/schemas/fieldValueUtils";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { RepeatTemplate } from "core/utils/contexts/fields/presets";
import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React from "react";
import { Rect } from "shared/types/Pos";
import { SpaceProperty } from "shared/types/mdb";
import { defaultMenu, menuInput } from "../menu/SelectionMenu";
import { DatePickerTimeMode, showDatePickerMenu } from "./datePickerMenu";

export const showSetValueMenu = (
  rect: Rect,
  win: Window,
  superstate: Superstate,
  value: string,
  property: SpaceProperty,
  onChangeValue: (value: string) => void,
  path: string,
  schema?: string
) => {
  if (!property) return;
  if (property.type == "text") {
  } else if (property.type == "number") {
    const input = menuInput("", (value) => onChangeValue(value), "");
    superstate.ui.openMenu(
      rect,
      {
        ...defaultMenu(superstate.ui, [input]),
      },
      win
    );
  } else if (property.type == "date") {
    showDatePickerMenu(
      superstate.ui,
      rect,
      win,
      new Date(),
      (date: Date) => onChangeValue(date.toISOString()),
      DatePickerTimeMode.None
    );
  } else if (property.type == "option") {
    const propertyValue = parseFieldValue(property.value, property.type);
    const options =
      propertyValue?.source?.length > 0
        ? parseSourceOptions(
            superstate,
            propertyValue?.source,
            path,
            path,
            schema,
            propertyValue?.sourceProps
          )
        : propertyValue?.options ?? [];
    if (
      propertyValue.source == "$properties" &&
      propertyValue.sourceProps?.type
    ) {
      superstate.ui.openMenu(
        rect,
        {
          ...defaultMenu(superstate.ui, options),
          editable: true,
          placeholder: "Select or Add Property",
          saveOptions: (options: string[], value: string[], isNew: boolean) => {
            if (isNew) {
              const newProperty: SpaceProperty = propertyValue.sourceProps
                .typeName
                ? [RepeatTemplate].find(
                    (f) => f.name == propertyValue.sourceProps.typeName
                  )
                : {
                    name: value[0],
                    type: propertyValue.sourceProps.type,
                  };
              newProperty.name = value[0];
              newProperty.schemaId = schema;
              superstate.spaceManager.addSpaceProperty(path, newProperty);
              onChangeValue(value[0]);
            } else {
              onChangeValue(value[0]);
            }
          },
        },
        win
      );
      return;
    }
    if (options.length == 0) {
      superstate.ui.notify("No options found");
      return;
    }
    superstate.ui.openMenu(
      rect,
      {
        ...defaultMenu(superstate.ui, options),
        saveOptions: (options: string[], value: string[]) => {
          onChangeValue(value[0]);
        },
      },
      win
    );
  } else if (property.type == "boolean") {
    const options = [
      { name: i18n.menu.yes, value: "true" },
      { name: i18n.menu.no, value: "false" },
    ];
    superstate.ui.openMenu(
      rect,
      {
        ...defaultMenu(superstate.ui, options),
        saveOptions: (options: string[], value: string[]) => {
          onChangeValue(value[0]);
        },
      },
      win
    );
  } else if (property.type.startsWith("object")) {
    superstate.ui.openCustomMenu(
      rect,
      <ObjectCell
        property={property}
        propertyValue={property.value}
        superstate={superstate}
        saveValue={(value) => onChangeValue(value)}
        initialValue={value}
        multi={property.type.endsWith("multi")}
        savePropValue={(fv, value) => onChangeValue(value)}
        columns={[]}
        row={{}}
        compactMode={false}
      ></ObjectCell>,
      {},
      win
    );
  }
};
