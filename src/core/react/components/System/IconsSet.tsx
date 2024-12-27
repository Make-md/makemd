import { Superstate } from "makemd-core";
import React, { useEffect } from "react";
import { uiIconSet } from "shared/assets/icons";
type IconSet = {
  name: string;
  icon: string;
  iconSet: string;
};
export const IconSet = (props: { superstate: Superstate }) => {
  const [iconSets, setIconSets] = React.useState<any[]>([]);
  const [icons, setIcons] = React.useState<string[]>([]);
  useEffect(() => {
    Object.keys(uiIconSet)
      .filter((f, i) => i < 10)
      .forEach((icon) => {
        setIcons((f) => [...f, "ui//" + icon]);
      });
  }, []);

  return (
    <div>
      <div>
        {icons.map((c, i) => (
          <div
            key={i}
            className="mk-icon-small"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker(c),
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};
