import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { stringIsConst } from "core/utils/frames/frames";
import { removeQuotes, wrapQuotes } from "core/utils/strings";
import { debounce } from "lodash";
import { SelectOption, Superstate } from "makemd-core";
import type { CSSProperties } from "react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { windowFromDocument } from "shared/utils/dom";

export function countDecimals(value: number) {
  if (Math.floor(value) === value) return 0;

  const valueAsString = value.toString();
  return (
    valueAsString.split(".")[1].length ||
    valueAsString.split(",")[1].length ||
    0
  );
}

export type InputModifier = "shiftKey" | "altKey" | "ctrlKey" | "metaKey";

export type InputDragModifiers = {
  [key in InputModifier]?: number;
};

export type InputWithDragChangeHandler = (
  value: number,
  input: HTMLInputElement | null
) => void;

interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "onInput" | "value"
  > {
  // mouseDragThreshold?: number;
  // tabletDragThreshold?: number;
  value: number;
  modifiers?: InputDragModifiers;
  onChange?: InputWithDragChangeHandler;
  onInput?: InputWithDragChangeHandler;
}

/**
 * Input with drag functionality

 * @prop {number} mouseDragThreshold - The number of pixels that a User Interface element has to be moved before it is recognized.
 * @prop {number} tabletDragThreshold - The drag threshold for tablet events.
 */
export default function InputDrag({
  // mouseDragThreshold = 3,
  // tabletDragThreshold = 10,
  style: _style = {},
  modifiers: _modifiers = {},
  onChange,
  onInput,
  ...props
}: InputProps) {
  const [value, setValue] = useState<number>(props.value);
  const [modifier, setModifier] = useState<InputModifier | "">("");
  const startValue = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const step = props.step ? +props.step : 1;
  const modifiers: InputDragModifiers = useMemo(
    () => ({
      shiftKey: 0.1,
      ..._modifiers,
    }),
    [_modifiers]
  );

  const [, setStartPos] = useState<[number, number]>([0, 0]);

  const style: CSSProperties = { cursor: "ew-resize", ..._style };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (isNaN(+newValue)) {
      return;
    }

    setValue(+newValue);

    onChange?.(+newValue, inputRef.current);
  };

  const handleDragEnd = debounce((newValue: number) => {
    onChange?.(newValue, inputRef.current);
  }, 200);

  const handleInput = useCallback(
    (newValue: number) => {
      requestAnimationFrame(() => {
        onInput?.(newValue, inputRef.current);
      });
      handleDragEnd(newValue);
    },
    [handleDragEnd, onInput]
  );

  const handleMove = useCallback(
    (e: MouseEvent) => {
      setStartPos((pos) => {
        const { clientX: x2, clientY: y2 } = e;
        const [x1, y1] = pos;

        const a = x1 - x2;
        const b = y1 - y2;

        let mod = 1;

        if (modifier) {
          mod = modifiers[modifier] || 1;
        }

        const stepModifer = step * mod;
        const decimals = countDecimals(stepModifer);

        let delta = Math.sqrt(a * a + b * b) * stepModifer;
        if (x2 < x1) delta = -delta;

        let newValue = startValue.current + delta;

        if (props.min != null) newValue = Math.max(newValue, +props.min);
        if (props.max != null) newValue = Math.min(newValue, +props.max);

        newValue = +newValue.toFixed(decimals);

        setValue(newValue);
        handleInput(newValue);

        return pos;
      });
    },
    [modifier, props.max, props.min, step, handleInput, modifiers]
  );

  const handleMoveEnd = useCallback(() => {
    document.removeEventListener("mousemove", handleMove);
    document.removeEventListener("mouseup", handleMoveEnd);
  }, [handleMove]);

  const handleDown = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      let _startValue = +value;

      if (isNaN(_startValue)) {
        _startValue = +(props.defaultValue || props.min || 0);
      }

      startValue.current = _startValue;

      setStartPos([e.clientX, e.clientY]);

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleMoveEnd);
    },
    [handleMove, handleMoveEnd, value, props.min, props.defaultValue]
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey) {
      setModifier("metaKey");
    } else if (e.ctrlKey) {
      setModifier("ctrlKey");
    } else if (e.altKey) {
      setModifier("altKey");
    } else if (e.shiftKey) {
      setModifier("shiftKey");
    }
  };
  const handleKeyUp = () => {
    setModifier("");
  };

  useEffect(() => {
    if (props.value !== value && typeof props.value === "number")
      setValue(props.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMoveEnd);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <input
      placeholder="auto"
      type="number"
      {...props}
      value={value}
      style={style}
      onMouseDown={handleDown}
      onChange={handleChange}
      ref={inputRef}
    />
  );
}

export const StepSetter = (props: {
  superstate: Superstate;
  name: string;
  value: string;
  units: string[];
  min?: number;
  max?: number;
  setValue: (value: string) => void;
}) => {
  const match =
    props.value && stringIsConst(props.value)
      ? removeQuotes(props.value).match(/^(\d+(?:\.\d+)?)\s?([a-zA-Z%]+)$/)
      : null;
  const numericValue = match ? parseInt(match[1]) : 0;
  const unit = match && match[2] ? match[2] : props.units[0];
  const showUnitMenu = (e: React.MouseEvent) => {
    const menuOptions: SelectOption[] = [];
    props.units.forEach((f) => {
      menuOptions.push({
        name: f,
        onClick: () => {
          if (f == "%") {
            props.setValue(wrapQuotes(`${100}${f}`));
            return;
          }
          props.setValue(wrapQuotes(`${numericValue}${f}`));
        },
      });
    });

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };

  return (
    <div className="mk-setter-step">
      <span>{props.name}</span>
      <InputDrag
        min={props.min}
        max={props.max}
        value={numericValue}
        onKeyDown={(e) => {
          if (e.key == "Backspace") {
            if (e.currentTarget.value.length == 1) props.setValue(null);
            e.stopPropagation();
          }
        }}
        onChange={(value) => {
          props.setValue(wrapQuotes(`${value.toString() + unit}`));
        }}
      ></InputDrag>
      <span onClick={(e) => showUnitMenu(e)}>{unit}</span>
    </div>
  );
};
