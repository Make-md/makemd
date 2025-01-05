import { EditorView } from "@codemirror/view";


import MakeBasicsPlugin from "basics/basics";
import { MarkdownView, WorkspaceLeaf } from "obsidian";
import i18n from "shared/i18n";
import { FlowEditorInfo, flowEditorInfo } from "../codemirror/flowEditor";

export const parseOutReferences = (
  ostr: string
): [string, string | undefined] => {
  const str = ostr.split("|")[0];
  const refIndex = str.lastIndexOf("#");
  return refIndex > 0
    ? [str.substring(0, refIndex), str.substring(refIndex + 1)]
    : [str, undefined];
};



export const loadFlowEditorByDOM = (
  plugin: MakeBasicsPlugin,
  el: HTMLElement,
  view: EditorView,
  id: string
) => {
  setTimeout(async () => {
    //wait for el to be attached to the displayed document
    let counter = 0;
    while (!el.parentElement && counter++ <= 50) await sleep(50);
    if (!el.parentElement) return;
    let dom: HTMLElement = el;
    while (
      !dom.hasClass("mk-floweditor") &&
      !dom.hasClass("workspace") &&
      dom.parentElement
    ) {
      dom = dom.parentElement;
    }

    if (
      !dom.hasClass("mk-floweditor") &&
      !dom.hasClass("workspace") &&
      !(dom.nodeName == "HTML")
    ) {
      return;
    }
    setTimeout(async () => {
      //wait for el to be attached to the displayed document
      let leafFound = false;
      if (plugin.app.workspace.activeEditor) {
        if (plugin.app.workspace.activeEditor?.editor?.cm.dom == view.dom) {
          leafFound = true;
          plugin.app.workspace.iterateLeaves((leaf) => {
            if (leaf.view.editor?.cm.dom == view.dom)
            {
              loadFlowEditorsForLeafForID(leaf,
                plugin.app.workspace.activeEditor.editor.cm,
                plugin.app.workspace.activeEditor.file?.path,
                plugin,
                id
              );
            }
          }, plugin.app.workspace["rootSplit"]!);
          
        }
      }
      if (!leafFound) {
        plugin.app.workspace.iterateLeaves((leaf) => {
          const cm = leaf.view.editor?.cm as EditorView;
          if (cm && view.dom == cm.dom) {
            leafFound = true;
            loadFlowEditorsForLeafForID(
              leaf,
              cm,
              (leaf.view as MarkdownView).file?.path,
              plugin,
              id
            );
          }
        }, plugin.app.workspace["rootSplit"]!);
      }
    });
  });
};
export const loadFlowEditorsForLeafForID = (
  leaf: WorkspaceLeaf,
  cm: EditorView,
  source: string,
  plugin: MakeBasicsPlugin,
  id: string
) => {

  const stateField = cm.state.field(flowEditorInfo, false);
  if (!stateField) return;
  const flowInfo = stateField.find((f) => f.id == id);
  if (flowInfo && flowInfo.expandedState == 2) {
    loadFlowEditor(leaf, cm, flowInfo, source, plugin);
  }
};

const loadFlowEditor = async (
  leaf: WorkspaceLeaf,
  cm: EditorView,
  flowEditorInfo: FlowEditorInfo,
  source: string,
  plugin: MakeBasicsPlugin
) => {
  const dom = cm.dom.querySelector(
    "#mk-flow-" + flowEditorInfo.id
  ) as HTMLElement;
  
  const path = plugin.enactor.uriByString(flowEditorInfo.link, source);
  const basePath = plugin.enactor.resolvePath(path.basePath, source);

  if (dom) {

    const spaceCache = plugin.enactor.isSpace(path.basePath);
    if (spaceCache) {
      
      if (!dom.hasAttribute("ready")) {
        // dom.empty();
        dom.setAttribute("ready", "");
        plugin.enactor.openPath(path.fullPath, dom);
        
        return;
      }
    } else  {
      

      const file = plugin.app.vault.getAbstractFileByPath(path.basePath) ?? plugin.app.vault.getAbstractFileByPath(basePath);
    if (file) {
      if (!dom.hasAttribute("ready")) {
        // dom.empty();
        dom.setAttribute("ready", "");
        plugin.enactor.openPath(basePath, dom);
        
      }
    } else {
      
      dom.innerHTML = "";
      const createDiv = dom.createDiv("file-embed");
      createDiv.classList.add("mod-empty");
      const createFile = async (e: MouseEvent) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        await plugin.plugin.files.newFile('/', basePath, 'md');
        loadFlowEditor(leaf, cm, flowEditorInfo, source, plugin);
      };
      createDiv.setText(`"${basePath}" ` + i18n.labels.noFile);
      createDiv.addEventListener("click", createFile);
    }
  }
  }
};




