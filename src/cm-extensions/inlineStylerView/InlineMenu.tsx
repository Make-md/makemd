import MakeMDPlugin from "main";
import { renderToStaticMarkup } from "react-dom/server";
import * as ReactDOM from "react-dom";
import React, { useEffect, useMemo, useState } from "react";
import { EditorView } from "@codemirror/view";
import "css/InlineMenu.css";
import t from "i18n";
import { resolveStyles, InlineStyle } from "./styles";
import { toggleMark } from "cm-extensions/inlineStylerView/marks";
import { createRoot } from "react-dom/client";
import { getActiveCM, getActiveMarkdownView } from "utils/codemirror";
import { platformIsMobile } from "utils/utils";
import { Mark } from "./Mark";
import { markIconSet, uiIconSet } from "utils/icons";
import MakeMenu from "components/MakeMenu/MakeMenu";
import classNames from "classnames";

export const loadStylerIntoContainer = (el: HTMLElement, plugin: MakeMDPlugin) => {
  // el.removeChild(el.querySelector('.mobile-toolbar-options-container'))
  const root = createRoot(el);
  root.render(
    <InlineMenuComponent mobile={true} activeMarks={[]} plugin={plugin}></InlineMenuComponent>
  );
};

export const InlineMenuComponent: React.FC<{
  cm?: EditorView;
  activeMarks: string[];
  mobile: boolean;
  plugin: MakeMDPlugin
}> = (props) => {
  const [mode, setMode] = useState(props.mobile ? 0 : 1);
  const [colorMode, setColorMode] = useState<{
    prefix: string;
    suffix: string;
    closeTag: string;
  } | null>(null);

  const colors = [
    "#eb3b5a",
    "#fa8231",
    "#f7b731",
    "#20bf6b",
    "#0fb9b1",
    "#2d98da",
    "#3867d6",
    "#8854d0",
    "#4b6584",
  ];
  const makeMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const cm = props.cm ?? getActiveCM();
    if (!cm) return;
    const end = cm.state.selection.main.to;
    const insertChars =
      cm.state.sliceDoc(end - 1, end) == cm.state.lineBreak
        ? props.plugin.settings.menuTriggerChar
        : cm.state.lineBreak + props.plugin.settings.menuTriggerChar;
    cm.dispatch({
      changes: {
        from: end,
        to: end,
        insert: insertChars,
      },
      selection: {
        head: end + insertChars.length,
        anchor: end + insertChars.length,
      },
    });
  };
  const toggleMarkAction = (e: React.MouseEvent, s: InlineStyle) => {
    e.preventDefault();
    const cm = props.cm ?? getActiveCM();
    if (!cm) return;
    if (s.mark) {
      cm.dispatch({
        annotations: toggleMark.of(s.mark),
      });
      return;
    }
    const selection = cm.state.selection.main;
    const selectedText = cm.state.sliceDoc(selection.from, selection.to);
    // cm.focus();
    cm.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert:
          s.value.substring(0, s.insertOffset) +
          selectedText +
          s.value.substring(s.insertOffset),
      },
      selection: s.cursorOffset
        ? {
            anchor:
              selection.from +
              s.value.substring(0, s.insertOffset).length +
              selectedText.length +
              s.cursorOffset,
            head:
              selection.from +
              s.value.substring(0, s.insertOffset).length +
              selectedText.length +
              s.cursorOffset,
          }
        : {
            anchor:
              selection.from + s.value.substring(0, s.insertOffset).length,
            head:
              selection.from +
              s.value.substring(0, s.insertOffset).length +
              selectedText.length,
          },
    });
  };

  const makeMode = () => (
    <>
      <div
        aria-label={!platformIsMobile() ? t.commands.makeMenu : undefined}
        onMouseDown={(e) => {
          makeMenu(e);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{ __html: markIconSet["mk-make-slash"] }}
      ></div>
      <div
        aria-label={!platformIsMobile() ? t.commands.selectStyle : undefined}
        onMouseDown={() => {
          setMode(1);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{ __html: markIconSet["mk-make-style"] }}
      ></div>
      <div
        aria-label={!platformIsMobile() ? t.commands.image : undefined}
        onMouseDown={() => {
          const view = getActiveMarkdownView();
          props.plugin.app.commands.commands[
            "editor:attach-file"
          ].editorCallback(view.editor, view);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{ __html: markIconSet["mk-make-attach"] }}
      ></div>
      <div
        aria-label={!platformIsMobile() ? t.commands.toggleKeyboard : undefined}
        onMouseDown={() => {
          const view = getActiveMarkdownView();
          props.plugin.app.commands.commands[
            "editor:toggle-keyboard"
          ].editorCallback(view.editor, view);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{ __html: markIconSet["mk-make-keyboard"] }}
      ></div>
    </>
  );

  const colorsMode = () => (
    <>
      <div
        className="mk-mark"
        onMouseDown={() => {
          setColorMode(null);
          setMode(1);
        }}
        dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
      ></div>
      {colors.map((c, i) => (
        <div
          key={i}
          onMouseDown={() => {
            setMode(1);
            setColorMode(null);
            const cm = props.cm ?? getActiveCM();
            if (!cm) return;
            const selection = cm.state.selection.main;
            const selectedText = cm.state.sliceDoc(
              selection.from,
              selection.to
            );
            cm.dispatch({
              changes: {
                from: selection.from,
                to: selection.to,
                insert:
                  colorMode.prefix +
                  c +
                  colorMode.suffix +
                  selectedText +
                  colorMode.closeTag,
              },
            });
          }}
          className="mk-color"
          style={{ background: c }}
        ></div>
      ))}
    </>
  );

  const marksMode = () => (
    <>
      {props.mobile ? (
        <div
          className="mk-mark"
          onMouseDown={() => {
            setMode(0);
          }}
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
        ></div>
      ) : (
        <></>
      )}
      {resolveStyles().map((s, i) => {
        return (
          <Mark
            i={i}
            style={s}
            active={props.activeMarks.find((f) => f == s.mark) ? true : false}
            toggleMarkAction={toggleMarkAction}
          ></Mark>
        );
      })}
      {props.plugin.settings.inlineStylerColors ? (
        <>
          <div className="mk-divider"></div>
          <div
            aria-label={!platformIsMobile() ? t.styles.textColor : undefined}
            onMouseDown={() => {
              setMode(2);
              setColorMode({
                prefix: `<span style='color:`,
                suffix: `'>`,
                closeTag: "</span>",
              });
            }}
            className="mk-mark"
            dangerouslySetInnerHTML={{ __html: markIconSet["mk-mark-color"] }}
          ></div>
          <div
            aria-label={!platformIsMobile() ? t.styles.highlight : undefined}
            onMouseDown={() => {
              setMode(2);
              setColorMode({
                prefix: `<mark style='background:`,
                suffix: `'>`,
                closeTag: "</mark>",
              });
            }}
            className="mk-mark"
            dangerouslySetInnerHTML={{
              __html: markIconSet["mk-mark-highlight"],
            }}
          ></div>
        </>
      ) : (
        <></>
      )}
    </>
  );

  return (
    <div
      className={classNames("mk-style-menu", props.mobile ? "" : "menu")}
      onMouseDown={(e) => e.preventDefault()}
    >
      {mode == 0 && props.mobile
        ? makeMode()
        : mode == 2
        ? colorsMode()
        : marksMode()}
    </div>
  );
};
