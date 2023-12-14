import { UIManager } from "core/middleware/ui";
import { Pos } from "types/Pos";

import React from "react";
import { DayPicker } from "react-day-picker";

export const showDatePickerMenu = (
  ui: UIManager,
  point: Pos,
  value: Date,
  setValue: (date: Date) => void,
  format?: string
) => {
  ui.openCustomMenu(point, (props: { hide: () => void }) => (
    <DayPicker
      defaultMonth={value}
      mode="single"
      selected={value}
      labels={{
        labelMonthDropdown: () => undefined,
        labelYearDropdown: () => undefined,
        labelNext: () => undefined,
        labelPrevious: () => undefined,
        labelDay: () => undefined,
        labelWeekday: () => undefined,
        labelWeekNumber: () => undefined,
      }}
      onSelect={(date: Date) => {
        setValue(date);
        props.hide();
      }}
    />
  ));
};
