import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "makemd-core";
import { Rect } from "shared/types/Pos";
import { SpaceProperty } from "shared/types/mdb";
import { defaultMenu, menuInput } from "../menu/SelectionMenu";
import { DatePickerTimeMode, showDatePickerMenu } from "./datePickerMenu";

export const showSetValueMenu = (
  rect: Rect,
  win: Window,
  superstate: Superstate,
  property: SpaceProperty,
  onChangeValue: (value: string) => void,
  path: string
) => {
  if (!property) return;
  if (property.type == "text") {
  } else if (property.type == "number") {
    const input = menuInput("", (value) => onChangeValue(value));
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
    const options =
      parseFieldValue(property.value, property.type, superstate, path)
        ?.options ?? [];
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
      { name: "Yes", value: "true" },
      { name: "No", value: "false" },
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
  }
};
