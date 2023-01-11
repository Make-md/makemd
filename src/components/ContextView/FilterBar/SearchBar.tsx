import i18n from "i18n";
import React from "react";
import { uiIconSet } from "utils/icons";

export const SearchBar = (props: {
  setSearchString: (str: string) => void;
}) => {
  const clearSearch = () => {
    props.setSearchString("");
  };
  return (
    <div className="mk-view-search">
      <button
        dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-search"] }}
      ></button>
      <>
        <input
          onChange={(e) => props.setSearchString(e.target.value)}
          placeholder={i18n.labels.searchPlaceholder}
          className="mk-search-bar"
        ></input>
        <button
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-clear"] }}
          onClick={() => clearSearch()}
        ></button>
      </>
    </div>
  );
};
