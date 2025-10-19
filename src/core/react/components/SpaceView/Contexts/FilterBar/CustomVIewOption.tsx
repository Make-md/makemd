import { Sticker } from "core/react/components/UI/Stickers/Sticker";
import { UIManager } from "makemd-core";
import i18n from "shared/i18n";
import React from "react";
export const CustomViewOption = (props: {
  ui: UIManager;
  type: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
  onCustomize?: () => void;
  hide: () => void;
}) => {
  return (
    <div
      className="mk-menu-option"
      onClick={() => {
        props.onSelect();
        props.hide();
      }}
    >
      <Sticker ui={props.ui} sticker={props.icon}></Sticker>
      <div className="mk-menu-options-inner">
        <span>{props.type}</span>
      </div>
      {props.selected && (
        <div
          dangerouslySetInnerHTML={{
            __html: props.ui.getSticker("ui//check"),
          }}
        ></div>
      )}
      {props.onCustomize && <button
        onClick={(e) => {
          e.preventDefault();
          props.hide();
          props.onCustomize();
        }}
        aria-label={i18n.labels.customize}
        className="mk-icon-small mk-inline-button"
        dangerouslySetInnerHTML={{
          __html: props.ui.getSticker("ui//brush"),
        }}
      ></button>}
    </div>
  );
};
