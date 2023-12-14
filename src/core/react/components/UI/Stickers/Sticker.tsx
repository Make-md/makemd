import { UIManager } from "core/middleware/ui";
import React from "react";

export const Sticker = (props: { ui: UIManager; sticker: string }) => {
  return (
    <div
      className="mk-sticker"
      dangerouslySetInnerHTML={{
        __html: props.ui.getSticker(props.sticker),
      }}
    ></div>
  );
};
