import { openFileFlowEditor } from "dispatch/flowDispatch";
import { FlowEditorHover } from "components/FlowEditor/FlowEditorHover";
import { MarkdownPostProcessorContext } from "obsidian";
import { EditorView } from "@codemirror/view";
import React from "react";
import { createRoot } from "react-dom/client";
import { iterateTreeInSelection } from "./codemirror";
import { flowTypeStateField } from "cm-extensions/markSans/callout";

const getCMFromElement = (el: HTMLElement): EditorView | undefined => {
  let dom: HTMLElement = el;
  while (!dom.hasClass("cm-editor") && dom.parentElement) {
    dom = dom.parentElement;
  }

  if (!dom.hasClass("cm-editor")) {
    return;
  }
  let rcm: EditorView;
  app.workspace.iterateLeaves((leaf) => {
    //@ts-ignore
    const cm = leaf.view.editor?.cm as EditorView;
    if (cm && dom == cm.dom) {
      rcm = cm;
      return true;
    }
  }, app.workspace["rootSplit"]!);
  return rcm;
};
export const replaceAllEmbed = (
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) => {
  let dom: HTMLElement = el;
  setTimeout(async () => {
    //wait for el to be attached to the displayed document
    let counter = 0;
    while (!el.parentElement && counter++ <= 50) await sleep(50);
    if (!el.parentElement) return;

    while (!dom.hasClass("markdown-embed") && dom.parentElement) {
      dom = dom.parentElement;
    }
    if (dom) {
      var nodes = dom.querySelectorAll(".markdown-embed-link");
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].parentNode === dom) {
          dom.removeChild(nodes[i]);
          const div = dom.createDiv("mk-floweditor-selector");
          const reactEl = createRoot(div);

          //   const flowType = cm.state.field(flowTypeStateField, false);
          reactEl.render(
          <FlowEditorHover 
            toggle={true}
              toggleState={false}
              toggleFlow={(e) => {
                const cm: EditorView = getCMFromElement(dom);
                const pos = cm.posAtDOM(dom);
                iterateTreeInSelection(
                  { from: pos - 3, to: pos + 4 },
                  cm.state,
                  {
                    enter: (node) => {
                      if (node.name.contains("hmd-internal-link")) {
                        if (
                          cm.state.sliceDoc(node.from - 4, node.from - 3) != "!"
                        ) {
                          if (
                            cm.state.sliceDoc(node.to + 2, node.to + 3) !=
                            cm.state.lineBreak
                          ) {
                            cm.dispatch({
                              changes: [
                                {
                                  from: node.from - 3,
                                  to: node.from - 3,
                                  insert: "!",
                                },
                                {
                                  from: node.to + 2,
                                  to: node.to + 2,
                                  insert: cm.state.lineBreak,
                                },
                              ],
                            });
                          } else {
                            cm.dispatch({
                              changes: {
                                from: node.from - 3,
                                to: node.from - 3,
                                insert: "!",
                              },
                            });
                          }
                        }
                      }
                    },
                  }
                );

                e.stopPropagation();
              }}
              openLink={(e) => {
                e.stopPropagation();
                openFileFlowEditor(ctx.sourcePath, "/");
              }}
            ></FlowEditorHover>
          );
        }
      }
    }
  });
};
