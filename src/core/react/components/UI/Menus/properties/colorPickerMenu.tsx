import { Rect } from "types/Pos";

import { Superstate } from "core/superstate/superstate";

import {
  Gradient,
  parseGradient,
  stringifyGradient,
} from "core/utils/color/gradient";
import { uniqueId } from "lodash";
import { i18n } from "makemd-core";
import React, { useEffect, useRef, useState } from "react";
import {
  backgroundColors,
  colors,
  colorsBase,
  textColors,
} from "schemas/color";

export const ColorPicker = (props: {
  superstate: Superstate;
  color: string;
  hide?: () => void;
  saveValue: (color: string) => void;
  stayOpen?: boolean;
}) => {
  const [gradient, setGradient] = useState<Gradient>(null);
  const [selectedColorStop, setSelectedColorStop] = useState<string>(null);
  const [value, setValue] = useState(props.color ?? "#eb3b5a");
  const [currentColor, setCurrentColor] = useState<string>(value);
  const ref = useRef<HTMLDivElement>(null);
  const saveValue = (v: string) => {
    setCurrentColor(v);
    if (gradient) {
      const newGradient = { ...gradient };

      newGradient.values.find((f) => f.id == selectedColorStop).color = v;

      setGradient(newGradient);
      const gradientString = stringifyGradient(newGradient);

      setValue(gradientString);
      props.saveValue(gradientString);
      return;
    }

    setValue(v);
    props.saveValue(v);
    if (!props.stayOpen) props.hide();
  };
  const saveGradient = (v: Gradient) => {
    const gradientString = stringifyGradient(v);
    setValue(gradientString);
    props.saveValue(gradientString);
  };
  const updateColor = (color: string) => {
    if (color) {
      setValue(color);
      setCurrentColor(color);
    }
    let gradientObject;
    try {
      gradientObject = parseGradient(color);
      const values = gradientObject.values.map((g) => {
        const existingStop = gradient?.values.find(
          (f) => f.position == g.position && f.color == g.color
        );

        if (existingStop) {
          return { ...g, id: existingStop.id ?? uniqueId() };
        }
        return { ...g, id: uniqueId() };
      });

      gradientObject.values = values;
    } catch (e) {
      console.log(e);
    }

    if (gradientObject) {
      setGradient(gradientObject);
      setCurrentColor(gradientObject.values[0].color);
    } else {
      setCurrentColor(color);
    }
  };
  // useEffect(() => {
  //   updateColor(props.color);
  // }, [props.color]);

  useEffect(() => {
    setCurrentColor(
      gradient?.values.find((f) => f.id == selectedColorStop)?.color
    );
  }, [selectedColorStop, gradient]);

  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     console.log(e.key);
  //     if (e.key == "Delete" || e.key == "Backspace") {
  //       const newGradient = { ...gradient };
  //       newGradient.values = newGradient.values.filter(
  //         (f) => f.id != selectedColorStop
  //       );
  //       console.log(newGradient);
  //       setGradient(newGradient);
  //     }
  //   };
  //   props.superstate.ui.inputManager.on("keydown", handleKeyDown);
  //   return () => {
  //     props.superstate.ui.inputManager.off("keydown", handleKeyDown);
  //   };
  // }, [selectedColorStop, gradient]);
  return (
    <div className="mk-ui-color-picker">
      {/* <div className="mk-ui-color-picker-selector">
        <div
          onClick={() => setGradient(null)}
          style={{
            background: "#fff",
            width: "20px",
            height: "20px",
          }}
        ></div>
        <div
          onClick={() =>
            setGradient({
              type: "linear",
              direction: "30deg",
              values: [
                {
                  color: "#eb3b5a",
                  position: 0,
                  id: uniqueId(),
                },
                {
                  color: "#eb3b5a",
                  position: 100,
                  id: uniqueId(),
                },
              ],
            })
          }
          style={{
            background: "linear-gradient(90deg, #fff, #000)",
            width: "20px",
            height: "20px",
          }}
        ></div>
      </div> */}
      <div className="mk-ui-color-picker-palette">
        {/* {gradient && (
          <div
            ref={ref}
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left; //x position within the element.
              const leftOffsetPercentage = (x / rect.width) * 100;
              const newGradient = {
                ...gradient,
                values: [
                  ...gradient.values,
                  {
                    color: "#eb3b5a",
                    position: leftOffsetPercentage,
                    id: uniqueId(),
                  },
                ],
              };
              setGradient(newGradient);
              setSelectedColorStop(newGradient.values[0].id);
            }}
            style={{
              width: "100%",
              height: "30px",
              position: "relative",
              background: value,
            }}
          >
            {gradient.values.map((c, i) => (
              <div
                key={c.id}
                style={{
                  position: "absolute",
                  left: `${c.position}%`,
                  background: c.color,
                  height: "30px",
                  width: "5px",
                  border: "thin solid #fff",
                }}
                onClick={(e) => {
                  setSelectedColorStop(c.id);
                  e.stopPropagation();
                }}
              >
                <FrameDraggableHandle
                  min={0}
                  max={100}
                  cursor={"move"}
                  disableY={true}
                  value={c.position}
                  step={100 / ref.current?.clientWidth}
                  onDragMove={(v) => {
                    const newGradient = { ...gradient };
                    setSelectedColorStop(c.id);
                    newGradient.values[i].position = v;

                    setGradient(newGradient);
                    saveGradient(newGradient);
                  }}
                  onDragEnd={(v) => {}}
                ></FrameDraggableHandle>
              </div>
            ))}
          </div>
        )} */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div
            onMouseDown={() => {
              props.saveValue("");
            }}
            className="mk-color"
            style={{
              background: `linear-gradient(to top left, rgba(0,0,0,0) 0%,
              rgba(255,0,0,0) calc(50% - 1px),
              rgba(255,0,0,1) 50%,
              rgba(255,0,0,0) calc(50% + 1px),
              rgba(0,0,0,0) 100%)`,
            }}
          ></div>
          <span style={{ flex: 1 }}></span>
          {i18n.editor.hex}
          <input
            style={{ width: "auto" }}
            type="text"
            defaultValue={currentColor}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key == "Enter") (e.target as HTMLInputElement).blur();
            }}
            onBlur={(e) => {
              saveValue(e.target.value);
            }}
          ></input>
        </div>
        <div style={{ fontSize: "13px", padding: "4px", marginTop: "8px" }}>
          {i18n.editor.themeColors}
        </div>
        <div>
          {colors.map((c, i) => (
            <div
              key={i}
              aria-label={c[0]}
              onMouseDown={() => {
                saveValue(c[1]);
              }}
              className="mk-color"
              style={{ background: c[1] }}
            ></div>
          ))}
        </div>
        <div>
          {colorsBase.map((c, i) => (
            <div
              key={i}
              aria-label={c[0]}
              onMouseDown={() => {
                saveValue(c[1]);
              }}
              className="mk-color"
              style={{ background: c[1] }}
            ></div>
          ))}
        </div>
        <div style={{ fontSize: "13px", padding: "4px", marginTop: "8px" }}>
          {i18n.editor.uiColors}
        </div>
        <div>
          {backgroundColors.map((c, i) => (
            <div
              key={i}
              aria-label={c[0]}
              onMouseDown={() => {
                saveValue(c[1]);
              }}
              className="mk-color"
              style={{ background: c[1] }}
            ></div>
          ))}
          {textColors.map((c, i) => (
            <div
              key={i}
              aria-label={c[0]}
              onMouseDown={() => {
                saveValue(c[1]);
              }}
              className="mk-color"
              style={{ background: c[1] }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const showColorPickerMenu = (
  superstate: Superstate,
  rect: Rect,
  win: Window,
  value: string,
  setValue: (color: string) => void,
  stayOpen?: boolean
) => {
  return superstate.ui.openCustomMenu(
    rect,
    <ColorPicker
      superstate={superstate}
      color={value}
      saveValue={setValue}
      stayOpen={stayOpen}
    ></ColorPicker>,
    {},
    win
  );
};
