import { EditorView } from "@codemirror/view";
import { FlowEditor, FlowEditorParent } from "adapters/obsidian/ui/editors/FlowEditor";

import {
  FlowEditorInfo,
  flowEditorInfo
} from "adapters/obsidian/ui/editors/markdownView/flowEditor/flowEditor";
import MakeMDPlugin from "main";
import { i18n } from "makemd-core";
import { MarkdownView, WorkspaceLeaf } from "obsidian";
import {
  getAbstractFileAtPath
} from "../file";

export const parseOutReferences = (
  ostr: string
): [string, string | undefined] => {
  const str = ostr.split("|")[0];
  const refIndex = str.lastIndexOf("#");
  return refIndex > 0
    ? [str.substring(0, refIndex), str.substring(refIndex + 1)]
    : [str, undefined];
};



export const getLineRangeFromRef = (
  path: string,
  ref: string | undefined,
  plugin: MakeMDPlugin
): [number | undefined, number | undefined] => {
  if (!ref) {
    return [undefined, undefined];
  }
  const cache = plugin.app.metadataCache.getCache(path)
  if (!cache) return [undefined, undefined];
  const headings = cache.headings;
  const blocks = cache.blocks;
  const sections = cache.sections;
  if (blocks && ref.charAt(0) == "^" && blocks[ref.substring(1)]) {
    return [
      blocks[ref.substring(1)].position.start.line + 1,
      blocks[ref.substring(1)].position.end.line + 1,
    ];
  }
  const heading = headings?.find((f) => f.heading.replace("#", " ") == ref);

  if (heading) {
    const index = headings.findIndex((f) => f.heading == heading.heading);
    const level = headings[index]?.level;
    const nextIndex = headings.findIndex(
      (f, i) => i > index && f.level <= level
    );

    const start =
      plugin.superstate.settings.editorFlowStyle == "classic"
        ? heading.position.start.line + 1
        : heading.position.start.line + 2;
    if (index < headings.length - 1 && nextIndex != -1) {
      return [start, headings[nextIndex].position.end.line];
    }
    return [start, sections[sections.length - 1].position.end.line + 1];
  }
  return [undefined, undefined];
};

export const loadFlowEditorByDOM = (
  plugin: MakeMDPlugin,
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
  plugin: MakeMDPlugin,
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
  plugin: MakeMDPlugin
) => {
  const dom = cm.dom.querySelector(
    "#mk-flow-" + flowEditorInfo.id
  ) as HTMLElement;
  
  const path = plugin.superstate.spaceManager.uriByString(flowEditorInfo.link, source);
  const basePath = plugin.superstate.spaceManager.resolvePath(path.basePath, source);

  if (dom) {

    const spaceCache = plugin.superstate.spacesIndex.get(path.basePath);
    if (spaceCache) {
      
      if (!dom.hasAttribute("ready")) {
        // dom.empty();
        dom.setAttribute("ready", "");
        plugin.superstate.ui.openPath(path.fullPath, false, dom);
        
        return;
      }
    } else  {
      

    
      const file = getAbstractFileAtPath(plugin.app, path.basePath) ?? getAbstractFileAtPath(plugin.app, basePath);
    if (file) {
      const selectiveRange = getLineRangeFromRef(file.path, path.refStr, plugin);
      if (!dom.hasAttribute("ready")) {
        // dom.empty();
        dom.setAttribute("ready", "");
        plugin.superstate.ui.openPath(basePath, false, dom, { from: selectiveRange[0], to: selectiveRange[1] });
        
      }
    } else {
      
      dom.innerHTML = "";
      const createDiv = dom.createDiv("file-embed");
      createDiv.classList.add("mod-empty");
      const createFile = async (e: MouseEvent) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        await plugin.files.newFile('/', basePath, 'md');
        loadFlowEditor(leaf, cm, flowEditorInfo, source, plugin);
      };
      createDiv.setText(`"${basePath}" ` + i18n.labels.noFile);
      createDiv.addEventListener("click", createFile);
    }
  }
  }
};



export const openPathInElement = (
  plugin: MakeMDPlugin,
  parentLeaf: WorkspaceLeaf,
  initiatingEl?: HTMLElement,
  fileName?: string,
  onShowCallback?: (leaf: FlowEditor) => Promise<unknown>
) => {
  const parent = (parentLeaf ?? plugin.app.workspace.getLeaf()) as unknown as FlowEditorParent;
  if (!initiatingEl) initiatingEl = parent.containerEl;
  const hoverPopover = new FlowEditor(
    parent,
    initiatingEl!,
    plugin,
    undefined,
    onShowCallback
  );

  // plugin.attachPortal(hoverPopover);
  if (fileName)
    hoverPopover.titleEl.textContent = fileName.substring(
      0,
      fileName.lastIndexOf(".")
    );
};
