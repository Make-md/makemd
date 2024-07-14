import i18n from "core/i18n";
import { Superstate } from "core/superstate/superstate";
import React, { useEffect } from "react";

export const SearchBar = (props: {
  superstate: Superstate;
  setSearchString: (str: string) => void;
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
  return !searchActive ? (
    <button
      className="mk-toolbar-button"
      onClick={(e) => {
        e.stopPropagation();
        setSearchActive(true);
      }}
      dangerouslySetInnerHTML={{
        __html: props.superstate.ui.getSticker("ui//search"),
      }}
    ></button>
  ) : (
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
        <button
          className="mk-toolbar-button"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//clear"),
          }}
          onClick={(e) => {
            e.stopPropagation();
            clearSearch();
          }}
        ></button>
      </>
    </div>
  );
};
