import useEffectOnce from "./useEffectOnce";
import useEventListener from "./useEventListener";
import useTimeout from "./useTimeout";

import React from "react";

export default function useLongPress(
  ref: React.RefObject<any>,
  cb: () => void,
  { delay = 400 } = {}
) {
  const { reset, clear } = useTimeout(cb, delay);
  useEffectOnce(clear);

  useEventListener("mousedown", reset, ref.current);
  useEventListener("touchstart", reset, ref.current);

  useEventListener("mouseup", clear, ref.current);
  useEventListener("mouseleave", clear, ref.current);
  useEventListener("touchend", clear, ref.current);
}
