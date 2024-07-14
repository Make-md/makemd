import { EditorView } from "@codemirror/view";
import { toggleMark } from "adapters/obsidian/ui/editors/markdownView/menus/inlineStylerView/marks";
import classNames from "classnames";

import {
  getActiveCM,
  getActiveMarkdownView,
} from "adapters/obsidian/utils/codemirror";
import MakeMDPlugin from "main";
import { i18n } from "makemd-core";

import { isTouchScreen } from "core/utils/ui/screen";
import React, { useState } from "react";
import { colors } from "schemas/color";
import { Mark } from "./Mark";
import { InlineStyle, resolveStyles } from "./styles";

export const loadStylerIntoContainer = (
  el: HTMLElement,
  plugin: MakeMDPlugin
) => {
  // el.removeChild(el.querySelector('.mobile-toolbar-options-container'))
  const root = plugin.ui.createRoot(el);
  root.render(
    <InlineMenuComponent
      mobile={true}
      activeMarks={[]}
      plugin={plugin}
    ></InlineMenuComponent>
  );
};

export const InlineMenuComponent: React.FC<{
  cm?: EditorView;
  activeMarks: string[];
  mobile: boolean;
  plugin: MakeMDPlugin;
}> = (props) => {
  const [mode, setMode] = useState(props.mobile ? 0 : 1);
  const [colorMode, setColorMode] = useState<{
    prefix: string;
    suffix: string;
    closeTag: string;
  } | null>(null);

  const makeMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const cm = props.cm ?? getActiveCM(props.plugin);
    if (!cm) return;
    const end = cm.state.selection.main.to;
    const insertChars =
      cm.state.sliceDoc(end - 1, end) == cm.state.lineBreak
        ? props.plugin.superstate.settings.menuTriggerChar
        : cm.state.lineBreak + props.plugin.superstate.settings.menuTriggerChar;
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
    const cm = props.cm ?? getActiveCM(props.plugin);
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
        aria-label={
          !isTouchScreen(props.plugin.superstate.ui)
            ? i18n.commands.makeMenu
            : undefined
        }
        onMouseDown={(e) => {
          makeMenu(e);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: props.plugin.superstate.ui.getSticker("ui//mk-make-slash"),
        }}
      ></div>
      <div
        aria-label={
          !isTouchScreen(props.plugin.superstate.ui)
            ? i18n.commands.selectStyle
            : undefined
        }
        onMouseDown={() => {
          setMode(1);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: props.plugin.superstate.ui.getSticker("ui//mk-make-style"),
        }}
      ></div>
      <div
        aria-label={
          !isTouchScreen(props.plugin.superstate.ui)
            ? i18n.commands.image
            : undefined
        }
        onMouseDown={() => {
          const view = getActiveMarkdownView(props.plugin);
          props.plugin.app.commands.commands[
            "editor:attach-file"
          ].editorCallback(view.editor, view);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: props.plugin.superstate.ui.getSticker("ui//mk-make-attach"),
        }}
      ></div>
      <div
        aria-label={
          !isTouchScreen(props.plugin.superstate.ui)
            ? i18n.commands.toggleKeyboard
            : undefined
        }
        onMouseDown={() => {
          const view = getActiveMarkdownView(props.plugin);
          props.plugin.app.commands.commands[
            "editor:indent-list"
          ].editorCallback(view.editor, view);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: props.plugin.superstate.ui.getSticker("ui//mk-make-indent"),
        }}
      ></div>
      <div
        aria-label={
          !isTouchScreen(props.plugin.superstate.ui)
            ? i18n.commands.toggleKeyboard
            : undefined
        }
        onMouseDown={() => {
          const view = getActiveMarkdownView(props.plugin);
          props.plugin.app.commands.commands[
            "editor:unindent-list"
          ].editorCallback(view.editor, view);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: props.plugin.superstate.ui.getSticker("ui//mk-make-unindent"),
        }}
      ></div>
      <div
        aria-label={
          !isTouchScreen(props.plugin.superstate.ui)
            ? i18n.commands.toggleKeyboard
            : undefined
        }
        onMouseDown={() => {
          const view = getActiveMarkdownView(props.plugin);
          props.plugin.app.commands.commands[
            "editor:toggle-keyboard"
          ].editorCallback(view.editor, view);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: props.plugin.superstate.ui.getSticker("ui//mk-make-keyboard"),
        }}
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
        dangerouslySetInnerHTML={{
          __html: props.plugin.superstate.ui.getSticker("ui//mk-ui-close"),
        }}
      ></div>
      {colors.map((c, i) => (
        <div
          key={i}
          onMouseDown={() => {
            setMode(1);
            setColorMode(null);
            const cm = props.cm ?? getActiveCM(props.plugin);
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
                  c[1] +
                  colorMode.suffix +
                  selectedText +
                  colorMode.closeTag,
              },
            });
          }}
          className="mk-color"
          style={{ background: c[1] }}
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
          dangerouslySetInnerHTML={{
            __html: props.plugin.superstate.ui.getSticker("ui//mk-ui-close"),
          }}
        ></div>
      ) : (
        <></>
      )}
      {resolveStyles().map((s, i) => {
        return (
          <Mark
            plugin={props.plugin}
            key={i}
            i={i}
            style={s}
            active={props.activeMarks.find((f) => f == s.mark) ? true : false}
            toggleMarkAction={toggleMarkAction}
          ></Mark>
        );
      })}
      {props.plugin.superstate.settings.inlineStylerColors ? (
        <>
          <div className="mk-divider"></div>
          <div
            aria-label={
              !isTouchScreen(props.plugin.superstate.ui)
                ? i18n.styles.textColor
                : undefined
            }
            onMouseDown={() => {
              setMode(2);
              setColorMode({
                prefix: `<span style='color:`,
                suffix: `'>`,
                closeTag: "</span>",
              });
            }}
            className="mk-mark"
            dangerouslySetInnerHTML={{
              __html:
                props.plugin.superstate.ui.getSticker("ui//mk-mark-color"),
            }}
          ></div>
          <div
            aria-label={
              !isTouchScreen(props.plugin.superstate.ui)
                ? i18n.styles.highlight
                : undefined
            }
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
              __html: props.plugin.superstate.ui.getSticker(
                "ui//mk-mark-highlight"
              ),
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
