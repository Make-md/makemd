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

const SelectMenuInput = forwardRef(
  (
    props: {
      expanded: boolean;
      id: string;
      query: string;
      placeholderText: string;
      classNames: Record<string, string>;
      inputAttributes: any;
      inputEventHandlers: any;
      index: number;
    },
    input: any
  ) => {
    const { classNames, inputAttributes, inputEventHandlers, index } = props;
    const sizer = useRef<HTMLDivElement>(null);
    const [inputWidth, setInputWidth] = useState(null);
    const [query, setQuery] = useState("");
    const [placeholderText, setPlaceholderText] = useState("");
    useEffect(() => {
      copyInputStyles();
      updateInputWidth();
      setTimeout(() => {
        input.current.focus();
      }, 50);
    }, []);

    useEffect(() => {
      if (query !== props.query || placeholderText !== props.placeholderText) {
        setQuery(props.query);
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
      let _inputWidth;

      // scrollWidth is designed to be fast not accurate.
      // +2 is completely arbitrary but does the job.
      _inputWidth = Math.ceil(sizer.current.scrollWidth) + 2;

      if (_inputWidth !== inputWidth) {
        setInputWidth(_inputWidth);
      }
    };

    return (
      <div className={classNames.searchWrapper}>
        <input
          {...inputAttributes}
          {...inputEventHandlers}
          ref={input}
          value={query}
          placeholder={placeholderText}
          className={classNames.searchInput}
          role="combobox"
          style={{ width: "100%" }}
        />
        <div ref={sizer} style={SIZER_STYLES}>
          {query || placeholderText}
        </div>
      </div>
    );
  }
);

export default SelectMenuInput;
