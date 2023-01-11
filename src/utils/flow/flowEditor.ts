import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { arrowKeyAnnotation } from "cm-extensions/flowEditor/atomic";
import {
  flowEditorInfo,
  FlowEditorInfo
} from "cm-extensions/flowEditor/flowEditor";
import {
  editableRange,
  lineRangeToPosRange,
  selectiveLinesFacet
} from "cm-extensions/flowEditor/selectiveEditor";
import {
  flowIDAnnotation,
  flowIDStateField, portalTypeAnnotation
} from "cm-extensions/markSans/callout";
import { INLINE_CONTEXT_VIEW_TYPE } from "components/ContextView/InlineContextView";
import { FlowEditor, FlowEditorParent } from "components/FlowEditor/FlowEditor";
import { createFlowEditorInElement } from "dispatch/flowDispatch";
import t from "i18n";
import MakeMDPlugin from "main";
import {
  MarkdownView,
  TFile,
  TFolder, WorkspaceLeaf
} from "obsidian";
import {
  FocusPortalEvent,
  OpenFilePortalEvent,
  PortalType,
  SpawnPortalEvent
} from "types/types";
import {
  getAbstractFileAtPath,
  openAFile,
  openFile
} from "../file";

export const parseOutReferences = (
  ostr: string
): [string, string | undefined] => {
  const str = ostr.split("|")[0];
  const refIndex = str.lastIndexOf("#");
  return refIndex != -1
    ? [str.substring(0, refIndex), str.substring(refIndex + 1)]
    : [str, undefined];
};

export const getFileFromString = (url: string, source: string) => {
  return app.metadataCache.getFirstLinkpathDest(url, source ?? "");
};

const getLineRangeFromRef = (
  file: TFile,
  ref: string | undefined,
  plugin: MakeMDPlugin
): [number | undefined, number | undefined] => {
  if (!ref) {
    return [undefined, undefined];
  }
  const cache = app.metadataCache.getFileCache(file);
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
      plugin.settings.editorFlowStyle == "classic"
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
  make: MakeMDPlugin,
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
      if (app.workspace.activeEditor) {
        if (app.workspace.activeEditor.editMode.cm.dom == view.dom) {
          leafFound = true;
          loadFlowEditorsForLeafForID(
            app.workspace.activeEditor.editMode.cm,
            app.workspace.activeEditor.file?.path,
            make,
            id
          );
        }
      }
      if (!leafFound) {
        app.workspace.iterateLeaves((leaf) => {
          //@ts-ignore
          const cm = leaf.view.editor?.cm as EditorView;
          if (cm && view.dom == cm.dom) {
            leafFound = true;
            loadFlowEditorsForLeafForID(
              cm,
              (leaf.view as MarkdownView).file?.path,
              make,
              id
            );
          }
        }, app.workspace["rootSplit"]!);
      }
    });
  });
};
export const loadFlowEditorsForLeafForID = (
  cm: EditorView,
  source: string,
  make: MakeMDPlugin,
  id: string
) => {
  const stateField = cm.state.field(flowEditorInfo, false);
  if (!stateField) return;
  const flowInfo = stateField.find((f) => f.id == id);
  if (flowInfo && flowInfo.expandedState == 2) {
    loadFlowEditor(cm, flowInfo, source, make);
  }
};

const loadFlowEditor = (
  cm: EditorView,
  flowEditorInfo: FlowEditorInfo,
  source: string,
  make: MakeMDPlugin
) => {
  const dom = cm.dom.querySelector(
    "#mk-flow-" + flowEditorInfo.id
  ) as HTMLElement;
  const [link, ref] = parseOutReferences(flowEditorInfo.link);
  if (dom) {
    if (link.charAt(0) == "#") {
      if (!dom.hasAttribute("ready")) {
        // dom.empty();
        dom.setAttribute("ready", "");

        createFlowEditorInElement(
          flowEditorInfo.id,
          dom,
          ref ? "block" : "flow",
          link
        );
      }
      return;
    }
    if (link.charAt(link.length - 1) == "/") {
      const folder = getAbstractFileAtPath(
        app,
        link.substring(0, link.length - 1)
      );
      if (!dom.hasAttribute("ready") && folder) {
        // dom.empty();
        dom.setAttribute("ready", "");

        createFlowEditorInElement(
          flowEditorInfo.id,
          dom,
          "context",
          folder.path,
          ref
        );
        return;
      }
    }
    const file = getFileFromString(link, source);
    const aFile = getAbstractFileAtPath(app, link);
    if (file) {
      const selectiveRange = getLineRangeFromRef(file, ref, make);
      if (!dom.hasAttribute("ready")) {
        // dom.empty();
        dom.setAttribute("ready", "");

        createFlowEditorInElement(
          flowEditorInfo.id,
          dom,
          ref ? "block" : "flow",
          file.path,
          ref,
          selectiveRange[0],
          selectiveRange[1]
        );
      }
    } else {
      if (aFile instanceof TFolder) {
        if (!dom.hasAttribute("ready")) {
          // dom.empty();
          dom.setAttribute("ready", "");

          createFlowEditorInElement(
            flowEditorInfo.id,
            dom,
            ref ? "block" : "flow",
            link
          );
        }
        return;
      }
      dom.empty();
      const createDiv = dom.createDiv("file-embed");
      createDiv.toggleClass("mod-empty", true);
      const createFile = async (e: MouseEvent) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        //@ts-ignore
        await app.fileManager.createNewMarkdownFile(app.vault.getRoot(), link);
        loadFlowEditor(cm, flowEditorInfo, source, make);
      };
      createDiv.setText(`"${link}" ` + t.labels.noFile);
      createDiv.addEventListener("click", createFile);
    }
  }
};

export const focusPortal = async (
  plugin: MakeMDPlugin,
  evt: FocusPortalEvent
) => {
  const { id, parent, top } = evt.detail;
  if (parent) {
    app.workspace.iterateLeaves((leaf) => {
      //@ts-ignore
      const cm = leaf.view.editor?.cm as EditorView;
      if (cm) {
        const stateField = cm.state.field(flowEditorInfo, false);
        if (stateField) {
          const foundInfo = stateField.find((f) => f.id == id);
          if (foundInfo) {
            cm.focus();
            if (top) {
              cm.dispatch({
                selection: EditorSelection.single(foundInfo.from - 4),
                annotations: arrowKeyAnnotation.of(1),
              });
            } else {
              if (foundInfo.to + 2 == cm.state.doc.length) {
                cm.dispatch({
                  changes: [
                    {
                      from: foundInfo.to + 2,
                      to: foundInfo.to + 2,
                      insert: cm.state.lineBreak,
                    },
                  ],
                  selection: EditorSelection.single(foundInfo.to + 3),
                  annotations: arrowKeyAnnotation.of(2),
                });
              } else {
                cm.dispatch({
                  selection: EditorSelection.single(foundInfo.to + 3),
                  annotations: arrowKeyAnnotation.of(2),
                });
              }
            }
          }
        }
      }
    }, app.workspace["rootSplit"]!);
  } else {
    app.workspace.iterateLeaves((leaf) => {
      //@ts-ignore
      const cm = leaf.view.editor?.cm as EditorView;
      if (cm) {
        const stateField = cm.state.field(flowIDStateField, false);
        if (stateField && stateField == id) {
          cm.focus();
          const lineRange = cm.state.field(selectiveLinesFacet, false);
          const posRange =
            lineRange && lineRange[0] != undefined
              ? lineRangeToPosRange(cm.state, lineRange)
              : { from: 0, to: cm.state.doc.length };
          if (top) {
            cm.dispatch({
              selection: EditorSelection.single(posRange.from),
            });
          } else {
            cm.dispatch({
              selection: EditorSelection.single(posRange.to),
            });
          }
        }
      }
    }, app.workspace["rootSplit"]!);
  }
};

export const openFileFromPortal = (
  plugin: MakeMDPlugin,
  evt: OpenFilePortalEvent
) => {
  const { file: fullLink, source } = evt.detail;
  const [link, ref] = parseOutReferences(fullLink);
  const file = getFileFromString(link, source);
  openAFile(file, plugin, false);
};

export const spawnLeafFromFile = async (
  plugin: MakeMDPlugin,
  file: string,
  el: HTMLElement,
  type: PortalType,
  ref?: string
): Promise<WorkspaceLeaf> => {
  if (type == "context") {
    const newLeaf = spawnPortal(plugin, el);
    newLeaf.setViewState({
      type: INLINE_CONTEXT_VIEW_TYPE,
      state: { file: file, ref: ref },
    });
    return newLeaf;
  }
  let portalFile = plugin.app.vault.getAbstractFileByPath(file);
  const newLeaf = spawnPortal(plugin, el, portalFile.name);
  await newLeaf.openFile(portalFile as TFile, { active:false });
  //@ts-ignore
  if (newLeaf.view.setMode)
    //@ts-ignore
    newLeaf.view.setMode(newLeaf.view.editMode);
  return newLeaf;
};

export const spawnNewPortal = async (
  plugin: MakeMDPlugin,
  evt: SpawnPortalEvent
) => {
  const { file, el, ref, from, to, type } = evt.detail;
  const newLeaf = await spawnLeafFromFile(plugin, file, el, type, ref);

  //@ts-ignore
  if (!newLeaf?.view?.editor) {
    return;
  }

  //@ts-ignore
  const view = newLeaf.view.editor?.cm as EditorView;
  view.dispatch({
    annotations: [
      portalTypeAnnotation.of(evt.detail.type),
      flowIDAnnotation.of(evt.detail.id),
    ],
  });
  view.dom.addEventListener("keydown", (e) => {
    if (e.key == "ArrowUp") {
      if (e.metaKey == true) {
        view.dispatch({
          annotations: arrowKeyAnnotation.of(3),
        });
      } else {
        view.dispatch({
          annotations: arrowKeyAnnotation.of(1),
        });
      }
    }
    if (e.key == "ArrowDown") {
      if (e.metaKey == true) {
        view.dispatch({
          annotations: arrowKeyAnnotation.of(4),
        });
      } else {
        view.dispatch({
          annotations: arrowKeyAnnotation.of(2),
        });
      }
    }
  });
  if (from && to) {
    //@ts-ignore
    newLeaf.view.editor?.cm.dispatch({
      annotations: [editableRange.of([from, to])],
    });
  }
};

export const spawnPortal = (
  plugin: MakeMDPlugin,
  initiatingEl?: HTMLElement,
  fileName?: string,
  onShowCallback?: () => unknown
): WorkspaceLeaf => {
  const parent = plugin.app.workspace.activeLeaf as unknown as FlowEditorParent;
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
  return hoverPopover.attachLeaf();
};
