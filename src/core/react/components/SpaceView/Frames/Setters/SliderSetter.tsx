import React, { useState } from "react";

export const Slider = (props: {
  value: string;
  setValue: (value: string) => void;
}) => {
  const [value, setValue] = useState(props.value);
  return (
    <input
      className="mk-setter-slider"
      type="range"
      value={value}
      min={0}
      max={10}
      onChange={(e) => setValue(e.target.value)}
      onMouseUp={(e) => props.setValue(value)}
    />
  );
};
