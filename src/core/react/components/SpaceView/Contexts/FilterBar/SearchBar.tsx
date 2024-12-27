import { Superstate } from "makemd-core";
import React, { useEffect } from "react";
import i18n from "shared/i18n";

export const SearchBar = (props: {
  superstate: Superstate;
  setSearchString: (str: string) => void;
  closeSearch?: () => void;
}) => {
  const [searchActive, setSearchActive] = React.useState(false);
  const clearSearch = () => {
    setSearchActive(false);
    props.setSearchString("");
  };
  const ref = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchActive) {
      ref.current?.focus();
    }
  }, [searchActive]);
  return (
    <div className="mk-view-search">
      <button
        className="mk-toolbar-button"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//search"),
        }}
      ></button>
      <>
        <input
          onChange={(e) => props.setSearchString(e.target.value)}
          placeholder={i18n.labels.searchPlaceholder}
          className="mk-search-bar"
          ref={ref}
        ></input>
        {props.closeSearch && (
          <button
            className="mk-toolbar-button"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//clear"),
            }}
            onClick={(e) => {
              e.stopPropagation();
              clearSearch();
              props.closeSearch();
            }}
          ></button>
        )}
      </>
    </div>
  );
};
