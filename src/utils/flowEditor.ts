import { calloutField, CalloutInfo, flowIDAnnotation, flowIDStateField, flowTypeStateField, portalTypeAnnotation } from "cm-extensions/markSans/callout";
import { cacheFlowEditorHeight, flowEditorInfo, FlowEditorInfo } from "cm-extensions/flowEditor/flowEditor";
import { createFlowEditorInElement } from "dispatch/flowDispatch";
import { App, Editor, TFile, WorkspaceLeaf } from "obsidian";
import { EditorView } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'
import { editableRange, lineRangeToPosRange, selectiveLinesFacet } from "cm-extensions/flowEditor/selectiveEditor";
import MakeMDPlugin from "main";
import { FlowEditor, FlowEditorParent } from "components/FlowEditor/FlowEditor";
import { FocusPortalEvent, OpenFilePortalEvent, SpawnPortalEvent } from "types/types";
import { createNewMarkdownFile, openFile } from "./utils";
import { arrowKeyAnnotation } from "cm-extensions/flowEditor/atomic";
import t from 'i18n'

const parseOutReferences = (ostr: string) : [string, string | undefined] => {
  const str = ostr.split('|')[0]
  const refIndex = str.lastIndexOf('#');
    return refIndex != -1 ? [str.substring(0, refIndex), str.substring(refIndex+1)] : [str, undefined]
  }

  export const getFileFromString = (url: string, source: string) => {
    return app.metadataCache.getFirstLinkpathDest(url, source);
  }

  const getLineRangeFromRef = (file: TFile, ref: string | undefined, app: App) : [number | undefined, number | undefined] => {

    if (!ref) {
      return [undefined, undefined];
    }
    const cache = app.metadataCache.getFileCache(file);
    const headings = cache.headings
    const blocks = cache.blocks;
    const sections = cache.sections;
    if (blocks && ref.charAt(0) == '^' && blocks[ref.substring(1)]) {
      return [blocks[ref.substring(1)].position.start.line+1, blocks[ref.substring(1)].position.end.line+1]
    }
    const heading = headings?.find(f => f.heading.replace('#', ' ') == ref)
    if (heading)
    {
        const index = headings.findIndex(f => f.heading == heading.heading);
        const level = headings[index]?.level
        const nextIndex = headings.findIndex((f, i) => i > index && f.level <= level)
        
        const start = window.make.settings.editorFlowStyle == 'classic' ? heading.position.start.line+1 : heading.position.start.line+2;
        if (index < headings.length-1 && nextIndex != -1) {
          return [start, headings[nextIndex].position.end.line]
        }
        return [start, sections[sections.length-1].position.end.line+1]
    }
    return [undefined, undefined];
  }

  

  export const loadFlowEditorByDOM = (el: HTMLElement, view: EditorView, id: string) => {
    setTimeout(async () => {
      //wait for el to be attached to the displayed document
      let counter = 0;
      while(!el.parentElement && counter++<=50) await sleep(50);
      if(!el.parentElement) return;

    
    let dom: HTMLElement = el;
      while (
        (!dom.hasClass("mk-floweditor") && !dom.hasClass("workspace")) &&
        dom.parentElement
      ) {

        dom = dom.parentElement;
      }
  
      if (!dom.hasClass("mk-floweditor") && !dom.hasClass("workspace")) {
        return;
      }
    setTimeout(async () => {
        //wait for el to be attached to the displayed document
        let counter = 0;
        while(!dom.parentElement && counter++<=50) await sleep(50);
        if(!dom.parentElement) return;

        
    app.workspace.iterateLeaves((leaf) => {
      //@ts-ignore
        const cm = leaf.view.editor?.cm as EditorView
        if (cm && view.dom == cm.dom) {
            loadFlowEditorsForLeafForID(cm, leaf, app, id)
        }
      }, app.workspace["rootSplit"]!)

    });
  });
    
  }
  export const loadFlowEditorsForLeafForID = (cm: EditorView, leaf: WorkspaceLeaf, app: App, id: string) => {
    const stateField = cm.state.field(flowEditorInfo, false);
    if (!stateField)
    return;
          const flowInfo = stateField.find(f => f.id == id)
            if (flowInfo && flowInfo.expandedState == 2) {
                loadFlowEditor(cm, flowInfo, leaf, app)
            }
        }

  export const loadFlowEditorsForLeaf = (cm: EditorView, leaf: WorkspaceLeaf, app: App) => {
    const stateField = cm.state.field(flowEditorInfo, false);
    if (!stateField)
    return;
    for (let flowInfo of stateField) {
            if (flowInfo.expandedState == 2 && flowInfo.embed <= 1) {
                loadFlowEditor(cm, flowInfo, leaf, app)
            }
    }
    }

export const loadFlowEditor = (cm: EditorView, flowEditorInfo: FlowEditorInfo, leaf: WorkspaceLeaf, app: App) => {
            const dom = cm.dom.querySelector('#mk-flow-'+flowEditorInfo.id) as HTMLElement;
            const [link, ref] = parseOutReferences(flowEditorInfo.link);
            //@ts-ignore
            const source = leaf.view.file?.path;
            const file = getFileFromString(link, source)
            if (dom) {
                if (file) {
                const selectiveRange = getLineRangeFromRef(file, ref, app);
                    if (!dom.hasAttribute("ready")) {
                        // dom.empty();
                        dom.setAttribute("ready","");
                        createFlowEditorInElement(flowEditorInfo.id, dom, ref ? 'block' : 'flow', file.path, selectiveRange[0], selectiveRange[1])
                    }
                } else {
                    dom.empty();
                    const createDiv = dom.createDiv('file-embed');
                    createDiv.toggleClass('mod-empty', true);
                    const createFile = async (e: MouseEvent) => {
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        //@ts-ignore
                        await app.fileManager.createNewMarkdownFile(app.vault.getRoot(), link);
                        loadFlowEditor(cm, flowEditorInfo, leaf, app);
                    }
                    createDiv.setText(`"${link}" `+t.labels.noFile);
                    createDiv.addEventListener('click', createFile);

                }
            }
}

export  const focusPortal = async(plugin: MakeMDPlugin, evt: FocusPortalEvent) =>{
    const {id, parent, top} = evt.detail;
    if (parent) {
        app.workspace.iterateLeaves((leaf) => {
          //@ts-ignore
            const cm = leaf.view.editor?.cm as EditorView
            if (cm) {
            const stateField = cm.state.field(flowEditorInfo, false);
            if (stateField) {
                const foundInfo = stateField.find(f => f.id == id);
              if(foundInfo){
                cm.focus();
                if (top) {
                    cm.dispatch({
                        selection: EditorSelection.single(foundInfo.from-4),
                        annotations: arrowKeyAnnotation.of(1)
                    })
                } else {
                      if (foundInfo.to+2 == cm.state.doc.length) {
                        
                        cm.dispatch({
                            changes: [{from: foundInfo.to+2, to: foundInfo.to+2, insert: cm.state.lineBreak}],
                            selection: EditorSelection.single(foundInfo.to+3),
                        annotations: arrowKeyAnnotation.of(2)
                        })
                      } else {
                    cm.dispatch({
                        selection: EditorSelection.single(foundInfo.to+3),
                        annotations: arrowKeyAnnotation.of(2)
                    })
                  }
                }
                
            }
          }
          }
          }, app.workspace["rootSplit"]!)
    } else {
        app.workspace.iterateLeaves((leaf) => {
          //@ts-ignore
            const cm = leaf.view.editor?.cm as EditorView
            if (cm) {
            const stateField = cm.state.field(flowIDStateField, false);
            if (stateField && stateField == id) {
                    cm.focus();
                    const lineRange = cm.state.field(selectiveLinesFacet, false)
                    const posRange = lineRange && lineRange[0] != undefined ? lineRangeToPosRange(cm.state, lineRange) : { from: 0, to: cm.state.doc.length};
                    if (top) {
                        cm.dispatch({
                            selection: EditorSelection.single(posRange.from),
                        })
                    } else {
                      
                        cm.dispatch({
                            selection: EditorSelection.single(posRange.to),
                        })
                    }
                    
            }
          }
          }, app.workspace["rootSplit"]!)
        

    }
    
  }

  export const openFileFromPortal = (plugin: MakeMDPlugin, evt: OpenFilePortalEvent) => {
    const {file: fullLink, source} = evt.detail;
    const [link, ref] = parseOutReferences(fullLink);
    const file = getFileFromString(link, source)
    //@ts-ignore
    openFile({...file, isFolder: false}, plugin.app, false);
  }

export  const spawnNewPortal = async(plugin: MakeMDPlugin, evt: SpawnPortalEvent) =>{
    const {file, el, from, to} = evt.detail;
    let portalFile = plugin.app.vault.getAbstractFileByPath(file);
    const newLeaf = spawnPortal(plugin, el, !from && portalFile.name);
    await newLeaf.openFile(portalFile as TFile);
    //@ts-ignore
    const view = newLeaf.view.editor?.cm as EditorView;
    view.dispatch({
        annotations: [portalTypeAnnotation.of(evt.detail.type), flowIDAnnotation.of(evt.detail.id)]
  })
  view.dom.addEventListener('keydown', (e) => {
    if (e.key == 'ArrowUp') {
      if (e.metaKey == true) {
        view.dispatch({
          annotations: arrowKeyAnnotation.of(3)
        })
      } else {
        view.dispatch({
          annotations: arrowKeyAnnotation.of(1)
        })
      }
        
    }
    if (e.key == 'ArrowDown') {
      if (e.metaKey == true) {
        view.dispatch({
          annotations: arrowKeyAnnotation.of(4)
        })
      } else {
        view.dispatch({
          annotations: arrowKeyAnnotation.of(2)
        })
      }
    }
  })
    if (from && to) {
      //@ts-ignore
        newLeaf.view.editor?.cm.dispatch({
            annotations: [editableRange.of([from, to])]
    })
    }
  }

  export const spawnPortal = (plugin: MakeMDPlugin, initiatingEl?: HTMLElement, fileName?: string, onShowCallback?: () => unknown): WorkspaceLeaf => {
    const parent = plugin.app.workspace.activeLeaf as unknown as FlowEditorParent;
    if (!initiatingEl) initiatingEl = parent.containerEl;
    const hoverPopover = new FlowEditor(parent, initiatingEl!, plugin, undefined, onShowCallback);
    // plugin.attachPortal(hoverPopover);
    if (fileName)
    hoverPopover.titleEl.textContent = fileName.substring(0, fileName.lastIndexOf('.'));;
    return hoverPopover.attachLeaf();
    
  }