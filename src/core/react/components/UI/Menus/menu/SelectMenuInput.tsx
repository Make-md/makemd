import { SelectSection, UIManager } from "makemd-core";
import React, {
  CSSProperties,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";

const SIZER_STYLES: CSSProperties = {
  position: "absolute",
  width: 0,
  height: 0,
  visibility: "hidden",
  overflow: "scroll",
  whiteSpace: "pre",
};

const STYLE_PROPS = [
  "fontSize",
  "fontFamily",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "textTransform",
];

const SelectMenuSearch = forwardRef(
  (
    props: {
      ui: UIManager;
      expanded: boolean;
      id: string;
      query: string;
      placeholderText: string;
      classNames: Record<string, string>;
      inputAttributes: any;
      inputEventHandlers: any;
      index: number;
      currentSection: SelectSection;
    },
    input: any
  ) => {
    const { classNames, inputAttributes, inputEventHandlers, index } = props;
    const sizer = useRef<HTMLDivElement>(null);
    const [inputWidth, setInputWidth] = useState(null);

    const [placeholderText, setPlaceholderText] = useState("");
    useEffect(() => {
      copyInputStyles();
      updateInputWidth();
      setTimeout(() => {
        input.current?.focus();
      }, 50);
    }, []);

    useEffect(() => {
      if (placeholderText !== props.placeholderText) {
        setPlaceholderText(props.placeholderText);
        updateInputWidth();
      }
    }, [props.query, props.placeholderText]);

    const copyInputStyles = () => {
      const inputStyle = window.getComputedStyle(input.current);

      STYLE_PROPS.forEach((prop: any) => {
        sizer.current.style[prop] = inputStyle[prop];
      });
    };

    const updateInputWidth = () => {
      // scrollWidth is designed to be fast not accurate.
      // +2 is completely arbitrary but does the job.
      const _inputWidth = Math.ceil(sizer.current.scrollWidth) + 2;

      if (_inputWidth !== inputWidth) {
        setInputWidth(_inputWidth);
      }
    };

    return (
      <div className={classNames.search}>
        <div className={classNames.searchWrapper}>
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.ui.getSticker("ui//search"),
            }}
          ></div>
          <input
            {...inputAttributes}
            {...inputEventHandlers}
            ref={input}
            value={props.query}
            placeholder={placeholderText}
            className={classNames.searchInput}
            role="combobox"
            style={{ width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          />
          <div ref={sizer} style={SIZER_STYLES}>
            {props.query || placeholderText}
          </div>
          <span></span>
        </div>
      </div>
    );
  }
);

export default SelectMenuSearch;

SelectMenuSearch.displayName = "SelectMenuSearch";
