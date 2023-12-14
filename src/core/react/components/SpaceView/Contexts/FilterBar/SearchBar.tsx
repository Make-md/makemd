import i18n from "core/i18n";
import { Superstate } from "core/superstate/superstate";
import React from "react";

export const SearchBar = (props: {
  superstate: Superstate;
  setSearchString: (str: string) => void;
}) => {
  const clearSearch = () => {
    props.setSearchString("");
  };
  return (
    <div className="mk-view-search">
      <button
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//mk-ui-search"),
        }}
      ></button>
      <>
        <input
          onChange={(e) => props.setSearchString(e.target.value)}
          placeholder={i18n.labels.searchPlaceholder}
          className="mk-search-bar"
        ></input>
        <button
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//mk-ui-clear"),
          }}
          onClick={() => clearSearch()}
        ></button>
      </>
    </div>
  );
};
