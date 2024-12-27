import { Superstate } from "makemd-core";
import React from "react";
import { colors, colorsBase } from "shared/utils/color";
export const MaterialsSet = (props: { superstate: Superstate }) => {
  const [materials, setMaterials] = React.useState<any[]>([]);
  return (
    <div>
      <div>
        {colors.map((c, i) => (
          <div
            key={i}
            aria-label={c[0]}
            onMouseDown={() => {}}
            className="mk-color"
            style={{ background: c[1] }}
          ></div>
        ))}
        <div>Add</div>
      </div>
      <div>
        {colorsBase.map((c, i) => (
          <div
            key={i}
            aria-label={c[0]}
            onMouseDown={() => {}}
            className="mk-color"
            style={{ background: c[1] }}
          ></div>
        ))}
      </div>
    </div>
  );
};
