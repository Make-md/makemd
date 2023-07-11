import MakeMDPlugin from "main";
import React from "react";
import { stickerFromString } from "utils/sticker";

export const Sticker = (props: { plugin: MakeMDPlugin; sticker: string }) => {
  return (
    <div
      className="mk-sticker"
      dangerouslySetInnerHTML={{
        __html: stickerFromString(props.sticker, props.plugin),
      }}
    ></div>
  );
};
