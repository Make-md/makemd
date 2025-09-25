import { parseStylesToClass } from "core/utils/frames/renderer";
import React, { useEffect, useMemo } from "react";
import { Rect, Size } from "shared/types/Pos";
import { FrameTreeProp } from "shared/types/mframe";
import { FrameDraggableHandle } from "./FrameDraggableHandle";

type FlexboxItem = {
  width: number;
  height: number;
  x: number;
  y: number;
  row: number;
};

type FlexboxRows = {
  [key: string]: {
    start: number;
    end: number;
    maxValue: number;
    items: FlexboxItem[];
  };
};

const reduceFlexItems = (
  items: Rect[],
  container: Size,
  xAxis: boolean,
  axisGap: number
) => {
  const rows: FlexboxRows = {};
  let row = 0;
  let currentRowWidth = 0;
  const axisValue = xAxis ? "width" : "height";
  const nonAxisValue = !xAxis ? "width" : "height";
  items.forEach((f, i, array) => {
    if (i == 0) {
      rows[row] = {
        start: i,
        end: i,
        maxValue: f[nonAxisValue],
        items: [{ ...f, row }],
      };
      currentRowWidth = f[axisValue];
    } else if (array[i][axisValue] + axisGap > container[axisValue]) {
      row++;
      rows[row] = {
        start: i,
        end: i,
        maxValue: f[nonAxisValue],
        items: [{ ...f, row }],
      };
    } else if (
      array[i][axisValue] + axisGap + currentRowWidth >
      container[axisValue]
    ) {
      row++;
      rows[row] = {
        start: i,
        end: i,
        maxValue: f[nonAxisValue],
        items: [{ ...f, row }],
      };
      currentRowWidth = f[axisValue];
    } else {
      if (rows[row]) {
        rows[row] = {
          start: rows[row].start,
          end: i,
          maxValue: Math.max(rows[row].maxValue, f[nonAxisValue]),
          items: [...rows[row].items, { ...f, row }],
        };
        currentRowWidth += f[axisValue] + axisGap;
      } else {
      }
    }
  });
  return rows;
};

export const FrameGapHandle = (props: {
  direction: "row" | "column";
  clientSize: FrameTreeProp;
  childSizes: Rect[];
  styles: FrameTreeProp;
  saveStyles: (size: FrameTreeProp) => void;
}) => {
  const calculateOffset = (value: string) => {
    const match = value
      ? value.match(/^(\d+(?:\.\d+)?)\s?([a-zA-Z%]+)$/)
      : null;
    const numericValue = match ? parseInt(match[1]) : 0;
    return numericValue;
  };
  const [offset, setOffset] = React.useState({
    row: calculateOffset(props.styles["rowGap"]),
    column: calculateOffset(props.styles["columnGap"]),
  });

  useEffect(() => {
    setOffset({
      row: calculateOffset(props.styles["rowGap"]),
      column: calculateOffset(props.styles["columnGap"]),
    });
  }, [props.styles]);
  const handleProps = {
    value: offset[props.direction],

    onDragMove: (value: number) => {
      setOffset({
        ...offset,
        [props.direction == "column" ? "row" : "column"]: value,
      });
    },
    onDragEnd: (value: number) => {
      props.saveStyles(
        props.direction == "column"
          ? {
              rowGap: `"${value}px"`,
            }
          : {
              columnGap: `"${value}px"`,
            }
      );
    },
  };

  const offAxisHandleProps = {
    value: offset[props.direction == "column" ? "row" : "column"],

    onDragMove: (value: number) => {
      setOffset({
        ...offset,
        [props.direction]: value,
      });
    },
    onDragEnd: (value: number) => {
      props.saveStyles(
        props.direction == "column"
          ? {
              columnGap: `"${value}px"`,
            }
          : {
              rowGap: `"${value}px"`,
            }
      );
    },
  };

  const rows = useMemo(
    () =>
      reduceFlexItems(
        props.childSizes,
        {
          width:
            props.clientSize.width -
            props.clientSize.paddingLeft -
            props.clientSize.paddingRight,
          height:
            props.clientSize.height -
            props.clientSize.paddingTop -
            props.clientSize.paddingBottom,
        },
        props.direction == "row",
        offset[props.direction == "column" ? "row" : "column"]
      ),
    [props.childSizes, props.clientSize, props.direction, offset]
  );

  const items = useMemo(() => {
    const items: FlexboxItem[] = [];
    Object.keys(rows).forEach((f) => {
      items.push(...rows[f].items);
    });
    return items;
  }, [rows]);
  //let the boxmodel deal with the offsets
  return (
    <div
      className={`mk-frame-gaps ${parseStylesToClass(props.styles)}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: props.clientSize.width,
        height: props.clientSize.height,
        padding: props.clientSize.paddingTop,
        paddingLeft: props.clientSize.paddingLeft,
        paddingBottom: props.clientSize.paddingBottom,
        paddingRight: props.clientSize.paddingRight,
        flexWrap: props.styles.flexWrap,
      }}
    >
      {props.direction === "row"
        ? items.map((f, i, array) => (
            <React.Fragment key={i}>
              <div style={{ width: f.width, height: f.height }}></div>
              {i == array.length - 1 ? (
                <></>
              ) : rows[f.row].end == i ? (
                <div
                  key={i}
                  className="mk-frame-gap-handle-h"
                  style={{
                    width: "100%",
                    height: Math.max(8, Math.abs(offset["row"])),
                    zIndex: "var(--mk-layer-editor-overlay)",
                  }}
                >
                  <FrameDraggableHandle
                    {...offAxisHandleProps}
                    cursor="col-resize"
                    disableX
                    reverseY
                  ></FrameDraggableHandle>
                </div>
              ) : (
                <div
                  key={i}
                  className="mk-frame-gap-handle-v"
                  style={{
                    width: Math.max(8, Math.abs(offset["column"])),
                    height: rows[f.row].maxValue,
                    zIndex: "var(--mk-layer-editor-overlay)",
                  }}
                >
                  <FrameDraggableHandle
                    {...handleProps}
                    cursor="col-resize"
                    disableY
                  ></FrameDraggableHandle>
                </div>
              )}
            </React.Fragment>
          ))
        : items.map((f, i, array) => (
            <React.Fragment key={i}>
              <div style={{ width: f.width, height: f.height }}></div>
              {i == array.length - 1 ? (
                <></>
              ) : rows[f.row].end == i ? (
                <div
                  key={i}
                  className="mk-frame-gap-handle-v"
                  style={{
                    height: "100%",
                    width: Math.max(8, Math.abs(offset["column"])),
                    zIndex: "var(--mk-layer-editor-overlay)",
                  }}
                >
                  <FrameDraggableHandle
                    {...offAxisHandleProps}
                    cursor="col-resize"
                    disableX
                    reverseY
                  ></FrameDraggableHandle>
                </div>
              ) : (
                <div
                  key={i}
                  className="mk-frame-gap-handle-h"
                  style={{
                    height: Math.max(8, Math.abs(offset["row"])),
                    width: rows[f.row].maxValue,
                    zIndex: "var(--mk-layer-editor-overlay)",
                  }}
                >
                  <FrameDraggableHandle
                    {...handleProps}
                    cursor="row-resize"
                    disableX
                    reverseY
                  ></FrameDraggableHandle>
                </div>
              )}
            </React.Fragment>
          ))}
    </div>
  );
};
