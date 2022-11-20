import { Menu } from 'obsidian';
import React, { forwardRef } from 'react';
import { useRecoilState } from 'recoil';
import { SectionTree } from 'types/types';
import * as Util from 'utils/utils';
import * as recoilState from 'recoil/pluginState';
import 'css/SectionView.css';
import classNames from 'classnames';
import { SectionChangeModal, VaultChangeModal } from 'components/Spaces/modals';

import path from 'path';
import { IndicatorState, TreeItemProps } from 'components/Spaces/TreeView/FolderTreeView';
import t from "i18n"
import { isMouseEvent } from 'hooks/useLongPress';
import { uiIconSet } from 'utils/icons';


export const SectionItem = forwardRef<HTMLDivElement, TreeItemProps>(
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
        style,
        onCollapse,
        wrapperRef,
        plugin,
        disabled,
      },
      ref
    ) => {
      const [sections, setSections] = useRecoilState(recoilState.sections);
      const [focusedFolder, setFocusedFolder] = useRecoilState(recoilState.focusedFolder)
      const section = sections.find((s, i) => {
        return i == data.section
    })
    const newFolderInSection = () => {
      let vaultChangeModal = new VaultChangeModal(plugin, focusedFolder, 'create folder', data.section);
        vaultChangeModal.open();
    }
    const newFileInSection = async () => {

      const newFile = await Util.createNewMarkdownFile(
        plugin.app,
        focusedFolder,
        '')
        if (data.section != -1)
        updateSections(sections.map((f, i) => {
          return i == data.section ? {
            ...f,
            children: [newFile.path, ...f.children]
          } : f
        }))
    }
    const updateSections = (sections: SectionTree[]) => {
      plugin.settings.spaces = sections;
      plugin.saveSettings();
  }
  

const triggerMenu = (e: React.MouseEvent | React.TouchEvent) => {
  data.section == -1 ? triggerVaultMenu(e) : triggerSectionMenu(data.name, data.index, e)
}
  const triggerSectionMenu = (section: string, index: number, e: React.MouseEvent | React.TouchEvent) => {
    const fileMenu = new Menu();

//     fileMenu.addItem((menuItem) => {
//       menuItem.setTitle(t.menu.collapseAllFolders);
//       menuItem.setIcon('lucide-chevrons-down-up');
//       menuItem.onClick((ev: MouseEvent) => {
          
//       });
//   });


//   fileMenu.addItem((menuItem) => {
//     menuItem.setTitle(t.menu.expandAllFolders);
//     menuItem.setIcon('lucide-chevrons-down-dow ');
//     menuItem.onClick((ev: MouseEvent) => {
        
//     });
// });

    // Rename Item
    fileMenu.addItem((menuItem) => {
        menuItem.setTitle(t.menu.edit);
        menuItem.setIcon('pencil');
        menuItem.onClick((ev: MouseEvent) => {
            let vaultChangeModal = new SectionChangeModal(plugin, section, index, 'rename');
            vaultChangeModal.open();
        });
    });

    // Delete Item
    fileMenu.addItem((menuItem) => {
        menuItem.setTitle(t.menu.delete);
        menuItem.setIcon('trash');
        menuItem.onClick((ev: MouseEvent) => {
          updateSections(sections.filter((s, i) => {
              return i != index
          }))
        });
    });
  

    
    if (isMouseEvent(e)) {
        fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
    } else {
        // @ts-ignore
        fileMenu.showAtPosition({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
    }
    return false;
};

const triggerVaultMenu = (e: React.MouseEvent | React.TouchEvent) => {
  const fileMenu = new Menu();

  // Rename Item
  fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.menu.newSpace);
      menuItem.setIcon('plus');
      menuItem.onClick((ev: MouseEvent) => {
        let vaultChangeModal = new SectionChangeModal(plugin, '', 0, 'create');
        vaultChangeModal.open();
      });
      if (isMouseEvent(e)) {
        fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
    } else {
        // @ts-ignore
        fileMenu.showAtPosition({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
    }
    return false;
  });
}
      return (<>
        <div
          className={classNames(
            'mk-tree-wrapper',
            'mk-section-wrapper',
            clone && 'mk-clone',
            ghost && 'mk-ghost',
            disableSelection && 'mk-disable-selection',
            disableInteraction && 'mk-disable-interaction')}
            
          ref={wrapperRef}
          style={
            {
              ...style,
               ...(indicator ? {'--spacing': `${indentationWidth * depth}px`} : {}),
            } as React.CSSProperties
          }
          
        >
          
            <div className={classNames('mk-section', indicator ?
            indicator.state == IndicatorState.Bottom ? 'mk-indicator-bottom' : indicator.state == IndicatorState.Top ? 'mk-indicator-top' : indicator.state == IndicatorState.Row ? 'mk-indicator-row' : '' : '')}>
              <div className='mk-section-title'
               onContextMenu={(e) => triggerMenu(e)}
               onClick={(e) => onCollapse(data)}
               ref={ref}
            { ...handleProps}>
              <div className='mk-tree-text'>{data.id == '/' ? plugin.app.vault.getName() : data.name}
               </div>
              <div className={`mk-collapse ${collapsed ? 'mk-collapsed' : ''}`} dangerouslySetInnerHTML={{__html: uiIconSet['mk-ui-collapse-sm']}}>
            </div>
            </div>
          <div  className='mk-folder-buttons'>
            <button
            aria-label={t.buttons.createFolder}
            onClick={() => {
              newFolderInSection()
            }}
             dangerouslySetInnerHTML={{__html: uiIconSet['mk-ui-new-folder']}}> 
            </button>
            <button
            aria-label={t.buttons.newNote}
            onClick={() => {
              newFileInSection();
            }}
            dangerouslySetInnerHTML={{__html: uiIconSet['mk-ui-new-note']}}> 
            </button>
            </div>
            </div>
            
            </div>
            {section && !collapsed && section.children.length == 0 && 
            <div className='mk-tree-empty'
            style={
              {
                '--spacing': `${indentationWidth}px`,
              } as React.CSSProperties
            }>No Notes Inside</div>}
            </>
      );
    }
  );
  
  
  SectionItem.displayName = 'SectionItem';
