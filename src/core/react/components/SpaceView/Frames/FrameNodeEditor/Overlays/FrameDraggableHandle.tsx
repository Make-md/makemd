import { PointerModifiers } from "core/types/ui";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { InputModifier } from "../../Setters/StepSetter";

export const FrameDraggableHandle = (props: {
  value: number;
  cursor: string;
  onDragMove: (value: number, modifiers: PointerModifiers) => void;
  onDragEnd: (value: number, modifiers: PointerModifiers) => void;
  min?: number;
  max?: number;
  step?: number;
  reverseX?: boolean;
  reverseY?: boolean;
  disableX?: boolean;
  disableY?: boolean;
  mod?: number;
}) => {
  const [modifier, setModifier] = useState<InputModifier>(null);
  const startValue = useRef(props.value);
  const currentValue = useRef(props.value);

  const [, setStartPos] = useState<[number, number]>([0, 0]);
  const step = props.step ?? 1;
  const handleMove = useCallback(
    (e: MouseEvent) => {
      setStartPos((pos) => {
        const { clientX: x2, clientY: y2 } = e;
        const [x1, y1] = pos;

        const a = props.reverseX ? x1 - x2 : x2 - x1;
        const b = props.reverseY ? y2 - y1 : y1 - y2;

        const mod = props.mod ?? 1;

        const stepModifer = step * mod;

        let delta = Math.sqrt((((a + b) / 2) * (a + b)) / 2) * stepModifer;
        if (a + b < 0) delta = -delta;

        if (props.disableX) delta = b * stepModifer;
        if (props.disableY) delta = a * stepModifer;
        let newValue = startValue.current + delta;

        newValue = props.min != null ? Math.max(newValue, props.min) : newValue;
        newValue = props.max != null ? Math.min(newValue, props.max) : newValue;
        currentValue.current = newValue;

        props.onDragMove(newValue, {
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
        });

        return pos;
      });
      e.stopPropagation();
    },
    [modifier, props.max, props.min, step, props.onDragMove, props.mod]
  );

  const handleMoveEnd = useCallback(
    (e: MouseEvent) => {
      const captureClick = (e: MouseEvent) => {
        e.stopPropagation(); // Stop the click from being propagated.
        window.removeEventListener("click", captureClick, true); // cleanup
      };
      window.addEventListener(
        "click",
        captureClick,
        true // <-- This registeres this listener for the capture
        //     phase instead of the bubbling phase!
      );
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMoveEnd);
      props.onDragEnd(currentValue.current, {
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
      });
      e.preventDefault();
      e.stopPropagation();
    },
    [handleMove, props.onDragEnd]
  );

  const handleDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      startValue.current = props.value;

      setStartPos([e.clientX, e.clientY]);

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleMoveEnd);
      e.stopPropagation();
    },
    [handleMove, handleMoveEnd, props.value]
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
    setModifier(null);
  };

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
    <div
      className="mk-frame-draggable-handle"
      onMouseDown={handleDown}
      data-placeholder={currentValue.current.toString()}
      style={{
        cursor: props.cursor,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
      }}
    >
      <span></span>
    </div>
  );
};
