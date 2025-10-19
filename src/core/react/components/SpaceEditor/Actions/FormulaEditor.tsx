import { StreamLanguage } from "@codemirror/language";
import { abcdefInit } from "@uiw/codemirror-theme-abcdef";
import ReactCodeMirror, {
  EditorView,
  ReactCodeMirrorRef,
  ViewUpdate,
} from "@uiw/react-codemirror";
import { FormulaInfo, formulasInfos } from "core/utils/formula/formulasInfos";
import { mathjs } from "core/utils/formula/syntax";
import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useEffect, useRef, useState } from "react";
import { fieldTypeForField } from "schemas/mdb";
import { SpaceProperty } from "shared/types/mdb";
import { ActionTester } from "./ActionTester";

export type FormulaEditorProps = {
  superstate: Superstate;
  formula: string;
  saveFormula: (formula: string) => void;
  fields: SpaceProperty[];
  value: { [key: string]: string };
  description?: string;
  hide?: () => void;
  path: string;
};

type FormulaSuggestion = {
  name: string;
  type: string;
  value: string;
};

export const FormulaEditor = (props: FormulaEditorProps) => {
  const [formula, setFormula] = useState(props.formula);
  const [presetField, setPresetField] = useState<{
    func: FormulaInfo;
    prop: SpaceProperty;
  }>(null);
  const [query, setQuery] = useState("");
  const [currentFunction, setCurrentFunction] = useState({
    func: null,
    arg: 0,
  });
  const allFormulas = Object.values(formulasInfos);
  const suggestionsForPreset = (preset: {
    func: FormulaInfo;
    prop: SpaceProperty;
  }) => {
    if (!preset) return [];
    const suggestions: FormulaSuggestion[] = [];
    if (preset.func) {
      if (preset.func.args.length == 1) {
        const types = preset.func.args[0]?.types ?? [];
        props.fields
          .filter((f) => types.includes(fieldTypeForField(f)))
          .forEach((g) => {
            suggestions.push({
              name: g.name,
              type: "rollup",
              value: `${preset.func.name}(prop'${g.name}')`,
            });
          });
      }
    } else if (preset.prop) {
      const type: string = fieldTypeForField(preset.prop);
      if (type.includes("multi")) {
        allFormulas
          .filter(
            (f) =>
              f.name != "prop" &&
              f.args.length == 1 &&
              f.args[0].types.some((g) => g == type || g == "any-multi")
          )
          .forEach((g) => {
            suggestions.push({
              name: g.name,
              type: "rollup",
              value: `${g.name}(prop('${preset.prop.name}'))`,
            });
          });
      } else {
        allFormulas
          .filter(
            (f) =>
              f.name != "prop" &&
              f.args.length == 1 &&
              f.args[0].types.includes(type)
          )
          .forEach((g) => {
            suggestions.push({
              name: g.name,
              type: "rollup",
              value: `${g.name}(prop('${preset.prop.name}'))`,
            });
          });
      }
    } else {
      return suggestions;
    }
    return suggestions;
  };
  const onUpdate = (viewUpdates: ViewUpdate) => {
    const view = viewUpdates.view;
    // let currentFunction = "";
    // let formula;
    // let arg = 0;
    // const lastParanOpen = view.state
    //   .sliceDoc(0, view.state.selection.main.head)
    //   .lastIndexOf("(");
    // const lastParanClose = view.state
    //   .sliceDoc(0, view.state.selection.main.head)
    //   .lastIndexOf(")");
    // if (lastParanOpen > lastParanClose) {
    //   if (lastParanOpen > 0) {
    //     const currentFunctionRange = view.state.wordAt(lastParanOpen - 1);
    //     currentFunction = view.state.sliceDoc(
    //       currentFunctionRange.from,
    //       currentFunctionRange.to
    //     );
    //     formula = formulasInfos[currentFunction];
    //     arg = view.state
    //       .sliceDoc(lastParanOpen, view.state.selection.main.head)
    //       .split(",").length;
    //   }
    // }
    const wordRange = view.state.wordAt(view.state.selection.main.head);
    const word = wordRange
      ? view.state.sliceDoc(wordRange.from, wordRange.to)
      : "";
    // setCurrentFunction({ func: formula, arg });
    setQuery(word);
  };
  const saveFormula = (fml: string) => {
    setFormula(fml);
  };

  const save = () => {
    props.saveFormula(formula);
    props.hide();
  };
  useEffect(() => {
    saveFormula(props.formula);
    if (!editorRef.current?.view) return;
    const editor = editorRef.current.view;
    editor.focus();
  }, [props.formula]);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const insertText = (text: string, cursorOffset: number) => {
    const editor = editorRef.current.view;
    const cursor = editor.state.selection.main.to;
    const wordRange = editor.state.wordAt(cursor);
    if (!wordRange) {
      editor.dispatch({
        changes: {
          from: cursor,
          to: cursor,
          insert: text,
        },
        selection: {
          anchor: cursor + text.length - cursorOffset,
        },
      });
    } else {
      editor.dispatch({
        changes: {
          from: wordRange.from,
          to: wordRange.to,
          insert: text,
        },
        selection: {
          anchor: wordRange.from + text.length - cursorOffset,
        },
      });
    }
    editor.focus();
  };

  const filteredProperties = props.fields.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredFunctions = allFormulas.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="mk-formula">
      <div className="mk-formula-header">
        <ReactCodeMirror
          ref={editorRef}
          autoFocus={true}
          value={formula}
          height="auto"
          theme={abcdefInit({
            settings: {
              background: "var(--mk-ui-background)",
            },
          })}
          basicSetup={{
            syntaxHighlighting: true,
            history: true,
            closeBrackets: true,
            autocompletion: false,
            defaultKeymap: true,
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
          }}
          extensions={[EditorView.lineWrapping, StreamLanguage.define(mathjs)]}
          onUpdate={onUpdate}
          onChange={saveFormula}
        />
        <button aria-label={i18n.labels.saveFormula} onClick={() => save()}>
          {i18n.labels.done}
        </button>
      </div>

      <div className="mk-formula-helper">
        <div className="mk-formula-list">
          {filteredProperties.length > 0 && (
            <div className="mk-formula-list-section">{i18n.labels.properties}</div>
          )}
          {filteredProperties.map((f, i) => (
            <div
              key={i}
              className="mk-formula-list-item"
              onMouseOver={() => {
                setPresetField({ func: null, prop: f });
              }}
              onClick={() => {
                insertText(`prop('${f.name}')`, 0);
              }}
            >
              {f.name}
            </div>
          ))}
          {filteredFunctions.length > 0 && (
            <div className="mk-formula-list-section">{i18n.labels.functions}</div>
          )}
          {filteredFunctions.map((f, i) => (
            <div
              key={i}
              className="mk-formula-list-item"
              onMouseOver={() => {
                setPresetField({ func: formulasInfos[f.name], prop: null });
              }}
              onClick={() => {
                insertText(`${f.name}()`, 1);
              }}
            >
              {f.name}
            </div>
          ))}
        </div>
        <div className="mk-formula-suggester">
          {presetField &&
            (presetField.func ? (
              <>
                <div className="mk-formula-suggester-name">
                  {presetField.func.name}(
                  <div className="mk-formula-suggester-args">
                    {presetField.func.args.map((f, i) => (
                      <span
                        aria-label={f.types.join(", ")}
                        key={i}
                        className="mk-formula-suggester-arg"
                      >
                        {f.name}
                        {i < presetField.func.args.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                  )
                </div>
                <div>{i18n.formulas[presetField.func.name]}</div>
              </>
            ) : presetField.prop ? (
              <>
                <div className="mk-formula-suggester-name">
                  {presetField.prop.name}
                </div>
              </>
            ) : (
              <></>
            ))}

          {suggestionsForPreset(presetField).length > 0 && (
            <div className="mk-formula-suggester-title">{i18n.labels.suggestions}</div>
          )}
          {suggestionsForPreset(presetField).map((f, i) => (
            <div key={i} className="mk-formula-suggestion">
              <pre>{f.value}</pre>
              <span></span>
              <button
                className="mk-toolbar-button"
                aria-label={i18n.labels.replace}
                onClick={() => saveFormula(f.value)}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//replace"),
                }}
              ></button>
              <button
                className="mk-toolbar-button"
                aria-label={i18n.labels.insert}
                onClick={() => insertText(f.value, 0)}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//plus"),
                }}
              ></button>
            </div>
          ))}
        </div>
      </div>
      <ActionTester
        type={"formula"}
        code={formula}
        autoTest={true}
        fields={props.fields}
        value={props.value}
        superstate={props.superstate}
        path={props.path}
      ></ActionTester>
    </div>
  );
};
