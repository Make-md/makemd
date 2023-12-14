import { EditorView } from "@codemirror/view";
import { showSelectMenu } from "adapters/obsidian/ui/selectMenu";
import MakeMDPlugin from "main";
import { ScreenType, SelectMenuProps, Sticker, Superstate, UIAdapter, UIManager, i18n } from "makemd-core";
import { Notice, Platform, TFile, getIcon } from "obsidian";
import { FC } from "react";
import { emojis } from "schemas/emoji";
import { Pos } from "types/Pos";
import { EmojiData } from "types/emojis";
import { TargetLocation } from "types/path";
import { getAbstractFileAtPath, getLeaf, openPath } from "../utils/file";
import { openPathInElement } from "../utils/flow/flowEditor";
import { workspaceLeafForDom } from "../utils/leaf";
import { modifyTabSticker } from "../utils/modifyTabSticker";
import { arrowKeyAnnotation } from "./editors/markdownView/flowEditor/atomic";
import { flowIDAnnotation } from "./editors/markdownView/flowEditor/flowStateFields";
import { editableRange } from "./editors/markdownView/flowEditor/selectiveEditor";
import { lucideIcons } from "./icons";
import { ObsidianMenu } from "./menu";
import { ObsidianModal } from "./modal";
import { ObsidianPalette } from "./prompt";
import { showMainMenu } from "./showMainMenu";
import { stickerFromString } from "./sticker";

export class ObsidianUI implements UIAdapter {
  public manager: UIManager;
   public constructor(public plugin: MakeMDPlugin) {

   }
    public quickOpen = () => {
        this.plugin.app.commands.executeCommandById('core:quick-open')
    }
    public mainMenu = (el: HTMLElement, superstate: Superstate) => {
      showMainMenu(el, superstate, this.plugin.app)
    }
   public onMetadataRefresh = () => {
    modifyTabSticker(this.plugin);
   }
   public navigationHistory = () => {
      return this.plugin.app.workspace.getLastOpenFiles()
   }
   public getSticker = (icon: string) => {
      return stickerFromString(icon, this.plugin);
   }
    public openMenu = (position: {x: number, y: number}, menuProps: SelectMenuProps) => {
      showSelectMenu(position, menuProps);
    }
    public openCustomMenu = (position: Pos, fc: React.FC<{ hide: () => void }>) => {
      ObsidianMenu({position, fc});
    }
     public openToast = (content: string) => {
        new Notice(content);
     }
     public openPalette = (modal: FC<{ hide: () => void; ref: any; }>, className: string) => {
        const newModal = new ObsidianPalette(this.plugin.app, modal, className)
        newModal.open();
     }

     public openModal = (title: string, modal: FC<{ hide: () => void; }>) => {
        const newModal = new ObsidianModal(this.plugin.app, title, modal)
        newModal.open();
     }
     public openPopover = (position: Pos, popover: FC<{ hide: () => void; }>) => {

     }

     public dragStarted = (e: React.DragEvent<HTMLDivElement>, paths: string[], ) => {
      if (paths.length == 0) return;
      if (paths.length == 1) {
         const path = paths[0];
         const file = getAbstractFileAtPath(this.plugin.app, path)
         if (!file)return;
         if (file instanceof TFile) {
            this.plugin.app.dragManager.onDragStart(e, {
               icon: "lucide-folder",
               source: undefined,
               title: file.name,
               type: "folder",
               file: file,
             });
             this.plugin.app.dragManager.dragFolder(e, file, true);
         } else {
            this.plugin.app.dragManager.onDragStart(e, {
               icon: "lucide-file",
               source: undefined,
               title: file.name,
               type: "file",
               file: file,
             });
         }
      } else {
         const files = paths.map(f => getAbstractFileAtPath(this.plugin.app, f)).filter(f => f);
         this.plugin.app.dragManager.onDragStart(e, {
            icon: "lucide-files",
            source: undefined,
            title: i18n.labels.filesCount.replace(
              "{$1}",
              files.length.toString()
            ),
            type: "files",
            files: files,
          });
   
          this.plugin.app.dragManager.dragFiles(e, files, true);
      }
      
     }

     public setDragLabel = (label: string) => {
      this.plugin.app.dragManager.setAction(label)
     }

     public dragEnded = (e: React.DragEvent<HTMLDivElement>) => {
     }

     
    
     public allStickers = () => {
      const allLucide: Sticker[] = lucideIcons.map((f) => ({
         name: f,
         type: "lucide",
         keywords: f,
         value: f,
         html: getIcon(f).outerHTML,
       }));
       const allCustom: Sticker[] = [...this.plugin.superstate.iconsCache.keys()].map(
         (f) => ({
           name: f,
           type: "vault",
           keywords: f,
           value: f,
           html: this.plugin.superstate.iconsCache.get(f),
         })
       );
       
       const allEmojis: Sticker[] = Object.keys(emojis as EmojiData).reduce(
         (p, c: string) => [
           ...p,
           ...emojis[c].map((e) => ({
             type: "emoji",
             name: e.n[0],
             value: e.u,
             html: e.u,
           })),
         ],
         []
       );
       return [...allEmojis,...allCustom, ...allLucide];
     }

     public getUIPath = (path: string) => {
      const file = this.plugin.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile)
            return this.plugin.app.vault.getResourcePath(file);
        return path;
     }
    public openPath = (path: string, newLeaf: TargetLocation, source?: any, props?: Record<string, any>) => {
      if (newLeaf == 'system') {
        // @ts-ignore
        this.plugin.app.showInFolder(path);
        return;
      }
      if (newLeaf == 'hover') {
        this.plugin.app.workspace.trigger(
          "link-hover",
          {},
          source,
          path,
          path
        );
        return;
      } else if (source) {

        openPathInElement(this.plugin, workspaceLeafForDom(this.plugin.app, source), source, null, async (editor) => {
          const leaf = editor.attachLeaf();

          
          if (this.plugin.app.vault.getAbstractFileByPath(path) instanceof TFile) {
            await leaf.openFile(this.plugin.app.vault.getAbstractFileByPath(path) as TFile);
          } else {
            await openPath(leaf, path, this.plugin)
          }
          if (!props || !leaf.view?.editor) { 
            return;
          }
          
          const view = leaf.view.editor?.cm as EditorView;
          view.dispatch({
            annotations: [
              flowIDAnnotation.of(props.id),
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
          if (props.from && props.to) {
            leaf.view.editor?.cm.dispatch({
              annotations: [editableRange.of([props.from, props.to])],
            });
          }
        });
        return;
      }
      const leaf = getLeaf(this.plugin.app, newLeaf);
      openPath(leaf, path, this.plugin)
    }
      public getScreenType = () => {
         return Platform.isMobile ? 'mobile' : 'desktop' as ScreenType;
      }

}
