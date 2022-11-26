import MakeMDPlugin from 'main';
import { addIcon, ButtonComponent, Component, Menu, SearchComponent, TAbstractFile, TFile, TFolder } from 'obsidian';
import React, { useState, useMemo, useEffect, forwardRef, HTMLAttributes, useRef, CSSProperties } from 'react';
import ReactDOM from 'react-dom'
import { useRecoilState } from 'recoil';
import { FlattenedTreeNode, FolderTree, SectionTree } from 'types/types';
import * as Util from 'utils/utils';
import * as recoilState from 'recoil/pluginState';
import { AnimateLayoutChanges, useSortable } from '@dnd-kit/sortable';
import { UniqueIdentifier } from '@dnd-kit/core';
import 'css/FolderTreeView.css';
import classNames from 'classnames';
import { MoveSuggestionModal, SectionChangeModal, VaultChangeModal } from 'components/Spaces/modals';
import { isMouseEvent } from 'hooks/useLongPress'
import { SectionItem } from 'components/Spaces/TreeView/SectionView';
import { StickerModal } from '../FileStickerMenu/FileStickerMenu';
import t from "i18n"
import { usePopper } from 'react-popper';
import { uiIconSet } from 'utils/icons';


export enum IndicatorState {
  None,
  Top,
  Bottom,
  Row,
}

export type Indicator = {
  state: IndicatorState;
  depth: number
} | undefined;

export interface SortableTreeItemProps extends TreeItemProps {
    id: UniqueIdentifier;
    disabled: boolean;
  }
  
  const animateLayoutChanges: AnimateLayoutChanges = ({isSorting, wasDragging}) =>
    isSorting || wasDragging ? false : true;
  
  export const SortableTreeItem = ({id, data, depth, disabled, style, ...props}: SortableTreeItemProps) => {
    const {
      attributes,
      isDragging,
      isSorting,
      listeners,
      setDraggableNodeRef,
      setDroppableNodeRef,
      transform,
      transition,
    } = useSortable({
      id,
      animateLayoutChanges,
      disabled,
      data
    });

    const memoListeners = useMemo(() => {
      return {
        ...attributes, 
        ...listeners
      }
    }, [isSorting])



    if (data.parentId == null) {
      return <SectionItem
      ref={setDraggableNodeRef}
      wrapperRef={setDroppableNodeRef}
      data={data}
      depth={depth}
      ghost={isDragging}
      disableInteraction={isSorting}
      disabled={disabled}
      style={style}
      handleProps={memoListeners}
      {...props}
    />
    } else 
  {
    return (
      <TreeItem
        ref={setDraggableNodeRef}
        wrapperRef={setDroppableNodeRef}
        data={data}
        depth={depth}
        ghost={isDragging}
        disableInteraction={isSorting}
        disabled={disabled}
        style={style}
        handleProps={memoListeners}
        {...props}
      />
    );
      }
  }

export interface TreeItemProps {
    childCount?: number;
    clone?: boolean;
    collapsed?: boolean;
    depth: number;
    disableInteraction?: boolean;
    disableSelection?: boolean;
    disabled: boolean;
    ghost?: boolean;
    handleProps?: any;
    indicator: Indicator;
    indentationWidth: number;
    data: FlattenedTreeNode;
    plugin: MakeMDPlugin;
    style: CSSProperties;
    onCollapse?(folder: TFolder): void;
    wrapperRef?(node: HTMLDivElement): void;
  }

  
export const TreeItem = forwardRef<HTMLDivElement, TreeItemProps>(
    (
      {
        childCount,
        clone,
        data,
        depth,
        disableSelection,
        disableInteraction,
        ghost,
        handleProps,
        indentationWidth,
        indicator,
        collapsed,
        onCollapse,
        wrapperRef,
        style,
        plugin,
        disabled,
      },
      ref
    ) => {
      
      const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);
      const [sections, setSections] = useRecoilState(recoilState.sections);
      const [fileIcons, setFileIcons] = useRecoilState(recoilState.fileIcons);
      const [referenceElement, setReferenceElement] = React.useState(null);
      const [popperElement, setPopperElement] = useState(null)
      const { styles, attributes } = usePopper(referenceElement, popperElement)
      
      const openFile = (file: FlattenedTreeNode, e: React.MouseEvent) => {
        Util.openFile(file, plugin.app, e.ctrlKey || e.metaKey);
        setActiveFile(file.path);
    };
    

    const updateSections = (sections: SectionTree[]) => {
      plugin.settings.spaces = sections;
      plugin.saveSettings();
  }

  const triggerStickerMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    let vaultChangeModal = new StickerModal(plugin.app, (emoji) => saveFileIcon(emoji));
    vaultChangeModal.open();
  }
    const triggerContextMenu = (file: TAbstractFile, isFolder: boolean, e: React.MouseEvent | React.TouchEvent) => {
      const fileMenu = new Menu();
      if (isFolder) {
        fileMenu.addSeparator();
        fileMenu.addItem((menuItem) => {
          menuItem.setIcon('edit');
          menuItem.setTitle(t.buttons.createNote);
          menuItem.onClick((ev: MouseEvent) => {
            newFileInFolder();
          });
        })  
        fileMenu.addItem((menuItem) => {
          menuItem.setIcon('folder-plus');
          menuItem.setTitle(t.buttons.createFolder);
          menuItem.onClick((ev: MouseEvent) => {
            let vaultChangeModal = new VaultChangeModal(plugin, data, 'create folder', -1);
                vaultChangeModal.open();
          });
        })  
      }

      // Pin - Unpin Item
      fileMenu.addSeparator();
      fileMenu.addItem((menuItem) => {
        menuItem.setTitle(t.menu.spaceTitle);
        menuItem.setDisabled(true);
        
      })  
      sections.map((f, i) => {
        fileMenu.addItem((menuItem) => {
          menuItem.setIcon('pin');
          if (f.children.contains(file.path)) {
            menuItem.setIcon('checkmark');menuItem.setTitle(f.section); 
          }
          else {  menuItem.setTitle(f.section);
            menuItem.setIcon('plus');
          } 
          menuItem.onClick((ev: MouseEvent) => {
            updateSections(!sections[i].children.contains(file.path) ? sections.map((s,k) => {
              return k == i ?
              {
                ...s,
                children: [file.path, ...s.children]
              } : s
            }) : sections.map((s,k) => {
              return k == i ?
              {
                ...s,
                children: s.children.filter(g => g != file.path)
              } : s
            }))
            //   const newPinnedFiles = (pinnedFiles.contains(file)) ?pinnedFiles.filter((pinnedFile) => pinnedFile !== file) : [...pinnedFiles, file];
            //   setPinnedFiles(newPinnedFiles);
            //   plugin.settings.sections = newPinnedFiles.map(f => f.path);
            // plugin.saveSettings();
          });
      });
      })
      if (plugin.settings.spacesStickers) {
      fileMenu.addSeparator();
      // Rename Item
      fileMenu.addItem((menuItem) => {
          menuItem.setTitle(t.buttons.changeIcon);
          menuItem.setIcon('lucide-sticker');
          menuItem.onClick((ev: MouseEvent) => {
            let vaultChangeModal = new StickerModal(plugin.app, (emoji) => saveFileIcon(emoji));
            vaultChangeModal.open();
          });
      });

      fileMenu.addItem((menuItem) => {
        menuItem.setTitle(t.buttons.removeIcon);
        menuItem.setIcon('lucide-file-minus');
        menuItem.onClick((ev: MouseEvent) => {
          removeFileIcon();
        });
    });
  }

      fileMenu.addSeparator();
      // Rename Item
      fileMenu.addItem((menuItem) => {
          menuItem.setTitle(t.menu.rename);
          menuItem.setIcon('pencil');
          menuItem.onClick((ev: MouseEvent) => {
              let vaultChangeModal = new VaultChangeModal(plugin, file, 'rename');
              vaultChangeModal.open();
          });
      });

      // Delete Item
      fileMenu.addItem((menuItem) => {
          menuItem.setTitle('Delete');
          menuItem.setIcon('trash');
          menuItem.onClick((ev: MouseEvent) => {
              let deleteOption = plugin.settings.deleteFileOption;
              if (deleteOption === 'permanent') {
                  plugin.app.vault.delete(file, true);
              } else if (deleteOption === 'system-trash') {
                  plugin.app.vault.trash(file, true);
              } else if (deleteOption === 'trash') {
                  plugin.app.vault.trash(file, false);
              }
          });
      });

      // Open in a New Pane
      fileMenu.addItem((menuItem) => {
          menuItem.setIcon('go-to-file');
          menuItem.setTitle(t.menu.openFilePane);
          menuItem.onClick((ev: MouseEvent) => {
            // @ts-ignore
              Util.openFileInNewPane(plugin, {...file, isFolder: isFolder});
          });
      });

      // Make a Copy Item
      fileMenu.addItem((menuItem) => {
          menuItem.setTitle(t.menu.duplicate);
          menuItem.setIcon('documents');
          menuItem.onClick((ev: MouseEvent) => {
            if ((file as TFile).basename && (file as TFile).extension)
              plugin.app.vault.copy(file as TFile, `${file.parent.path}/${(file as TFile).basename} 1.${(file as TFile).extension}`);
          });
      });

      // Move Item
      if (!Util.internalPluginLoaded('file-explorer', plugin.app)) {
          fileMenu.addItem((menuItem) => {
              menuItem.setTitle(t.menu.moveFile);
              menuItem.setIcon('paper-plane');
              menuItem.onClick((ev: MouseEvent) => {
                  let fileMoveSuggester = new MoveSuggestionModal(plugin.app, file as TFile);
                  fileMoveSuggester.open();
              });
          });
      }
      // Trigger
      plugin.app.workspace.trigger('file-menu', fileMenu, file, 'file-explorer');
      if (isMouseEvent(e)) {
          fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
      } else {
          // @ts-ignore
          fileMenu.showAtPosition({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
      }
      return false;
  };

  const newFileInFolder = async () => {
      await Util.createNewMarkdownFile(
          plugin.app,
          data.parent.children.find(f => f.name == data.name) as TFolder,
          '',
          ''
      )
  }
  
  const fileIcon = fileIcons.find(([path, icon]) => path == data.path);
  const saveFileIcon = (icon: string) => 
  {
    const newFileIcons = [...fileIcons.filter(f => f[0] != data.path), [data.path, icon]] as [string, string][]
    plugin.settings.fileIcons = newFileIcons;
    plugin.saveSettings();
  }

  const removeFileIcon = () => 
  {
    const newFileIcons = [...fileIcons.filter(f => f[0] != data.path)] as [string, string][]
    plugin.settings.fileIcons = newFileIcons;
    plugin.saveSettings();
  }

      return (<>
        <div
          className={classNames(
            'mk-tree-wrapper',
            clone && 'mk-clone',
            ghost && 'mk-ghost',
            disableSelection && 'mk-disable-selection',
            disableInteraction && 'mk-disable-interaction',
            activeFile === data.path && ' mk-is-active')
          }
          ref={wrapperRef}
          style={style}
          
        >
          <div 
          className={indicator && classNames(
            indicator.state == IndicatorState.Bottom ? 'mk-indicator-bottom' : indicator.state == IndicatorState.Top ? 'mk-indicator-top' : indicator.state == IndicatorState.Row ? 'mk-indicator-row' : '',)
          }
          style={ indicator ?
              {
                '--spacing': `${indentationWidth * indicator.depth - 12}px`,
              } as React.CSSProperties : {}
            }
            { ...handleProps}
            >
            <div 
            className={classNames(`mk-tree-item`,
            )} 
            ref={ref}
            style={
              {
                '--spacing': `${indentationWidth * depth - 12}px`,
              } as React.CSSProperties
            }
            onClick={(e) => openFile(data, e)}
            
            onContextMenu={(e) => triggerContextMenu(plugin.app.vault.getAbstractFileByPath(data.path), data.isFolder, e)}
            
            >
            
            { data.isFolder &&
              <button  aria-label={`${collapsed ? t.labels.expand: t.labels.collapse}`}
                className={`mk-collapse ${collapsed ? 'mk-collapsed' : ''}`} onClick={(e) => {onCollapse(data); e.stopPropagation() }} dangerouslySetInnerHTML={{__html: uiIconSet['mk-ui-collapse']}}>
              </button>
            }
            { plugin.settings.spacesStickers &&
            <div className='mk-file-icon'>
              <button aria-label={t.buttons.changeIcon} ref={setReferenceElement}
               dangerouslySetInnerHTML={fileIcon ? {__html: Util.unifiedToNative(fileIcon[1])} : data.isFolder ? {__html: uiIconSet['mk-ui-folder']} : {__html: uiIconSet['mk-ui-file']}} onClick={(e) => triggerStickerMenu(e)}
               >
              </button>
            </div> }
            <div className={`mk-tree-text `}>{
            data.isFolder ? data.name : data.name.substring(0, data.name.lastIndexOf('.')) || data.name
          }</div>
            </div>
            { !clone ?
            <div className='mk-folder-buttons'>
              <button aria-label={t.buttons.moreOptions} onClick={(e) => { triggerContextMenu(plugin.app.vault.getAbstractFileByPath(data.path), data.isFolder, e); e.stopPropagation()}} dangerouslySetInnerHTML={{__html: uiIconSet['mk-ui-options']}}>
              </button>
              {data.isFolder &&
              <button aria-label={t.buttons.newNote} onClick={(e) => { newFileInFolder(); e.stopPropagation()}}  dangerouslySetInnerHTML={{__html: uiIconSet['mk-ui-plus']}}>
              </button>
              }
          </div> : <></>
    }
          </div>
        </div>
        {/* {data.isFolder && !collapsed && data.children.length == 0 && 
        <div className='mk-tree-empty'
        style={
          {
            '--spacing': `${indentationWidth * (depth+1)}px`,
          } as React.CSSProperties
        }
        >No Notes Inside</div>} */}
        </>
      );
    }
  );
  

  TreeItem.displayName = 'TreeItem';
