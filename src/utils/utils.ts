import { TFile, TFolder, App, Keymap, Platform, TAbstractFile } from 'obsidian';
import MakeMDPlugin from 'main';
import { eventTypes, FlattenedTreeNode, FolderTree, StringTree, StringTreePath } from 'types/types';
import { VaultChangeModal } from 'components/Spaces/modals';
import { UniqueIdentifier } from '@dnd-kit/core';
import { FlowView, FOLDER_VIEW_TYPE } from 'components/FlowView/FlowView';

export function buildTree(flattenedItems: FlattenedTreeNode[]): TFolder {
    const root: TFolder = {...flattenedItems.find(f => f.id == '/'), children: [], isRoot: () => true} as TFolder;
    const items = flattenedItems.map((item) => ({...item, children: []}));
  
    for (const item of items) {
      const {id, children, vault, path, name, parent} = item;
      const parentId = item.parentId ?? '/';
      const _parent = items.find(f => f.id == parentId) ?? items.find(f => f.id == '/');
      if (_parent) {
            if (item.isFolder) {
                _parent.children.push({children, vault, parent, path, name} as TFolder);
            } else {
                _parent.children.push({vault, parent, path, name} as TAbstractFile);
            }
        }
    }
    return { ...root, children: items.filter(f => f.parentId == '/').map(item => {
        const {children, vault, path, name, parent} = item;
        if (item.isFolder) {
            return {children, vault, parent, path, name} as TFolder;
        } else {
            return {vault, parent, path, name} as TAbstractFile;
        }
    }) 
} as TFolder;
  }

  export const nodeIsAncestorOfTarget = (node: FlattenedTreeNode, target: FlattenedTreeNode) => {
    const recursive = (_node: TFolder, _target: TFolder) : boolean => {
        if (!_target.path) {
            return false
        }
        if (_target.path == '/')
            return false;
        if (_target.parent.path == _node.path)
            return true;
        return recursive(_node, _target.parent);
    }
    return recursive(node, target)
  }

function getMaxDepth({previousItem}: {previousItem: FlattenedTreeNode}) {
    
    if (previousItem) {
        if (previousItem.isFolder)
        return previousItem.depth + 1;
        return previousItem.depth;
    }
  
    return 0;
  }
  
  function getMinDepth({nextItem}: {nextItem: FlattenedTreeNode}) {
    if (nextItem) {
      return nextItem.depth;
    }
  
    return 0;
  }

  export function getDragDepth(offset: number, indentationWidth: number) {
    return Math.round(offset / indentationWidth) + 1;
  }

export function getProjection(
    items: FlattenedTreeNode[],
    activeItem: FlattenedTreeNode,
    overItemIndex: number,
    previousItem: FlattenedTreeNode,
    nextItem: FlattenedTreeNode,
    dragDepth: number,
  ) {
    
    

    const activeIsSection = activeItem.parentId == null;
    const overIsSection = previousItem.parentId == null;
    if (nodeIsAncestorOfTarget(activeItem, previousItem)) {
        return null;
    }
    if (activeIsSection) {
        if(overIsSection) {
            return {depth: 0, maxDepth: 0, minDepth: 0, overId: previousItem.id, parentId: null};
        }
        return null;
    }

    if (activeItem.section != previousItem.section) {

        if (previousItem.section == -1) {
            return null;
        }
    }
    
    const projectedDepth = dragDepth;
    const maxDepth = getMaxDepth({
      previousItem,
    });
    const minDepth = getMinDepth({nextItem});
    let depth = projectedDepth;
    if (projectedDepth >= maxDepth) {
      depth = maxDepth;
    } else if (projectedDepth < minDepth) {
      depth = minDepth;
    }
    if (previousItem.section != -1 && depth > 1)
    {
        return null;
    }
    return {depth, maxDepth, minDepth, overId: previousItem.id, parentId: getParentId()};
  
    function getParentId() {
      if (depth === 0 || !previousItem) {
        return '/';
      }
  
      if (depth === previousItem.depth || (depth > previousItem.depth && !previousItem.isFolder)) {
        return previousItem.parentId;
      }
  
      if (depth > previousItem.depth) {
        return previousItem.id;
      }
  
      const newParent = items
        .slice(0, overItemIndex)
        .reverse()
        .find((item) => item.depth === depth)?.parentId;
  
      return newParent ?? null;
    }
  }

export const flattenTrees = (
    items: (TAbstractFile | TFolder)[],
    section: string,
    sectionIndex: number,
    parentId: UniqueIdentifier | null = null,
    depth = 0
  ): FlattenedTreeNode[] => {
    return items.filter(f => f).reduce<FlattenedTreeNode[]>((acc, item, index) => {
        const id = parentId+'/'+item.path
        if ((item as any).children) {
            
      return [
        ...acc,
        {...item, parentId, depth, section: sectionIndex, index, id, isFolder: true},
        ...(flattenTrees((item as any).children, section, sectionIndex, id, depth + 1)),
      ] as FlattenedTreeNode[];
    } else {

        return [
            ...acc,
            {...item, parentId, depth, section: sectionIndex, index, id: id, isFolder: false}
          ] as FlattenedTreeNode[];
    }
    }, []) as FlattenedTreeNode[];
  }

  export const flattenTree = (folder: TFolder, path: string, sectionIndex: number, collapsed: boolean) : FlattenedTreeNode[] => {
    return [{
        ...folder,
        id: folder.path,
        parentId: null,
        depth: 0,
        index: 0,
        section: -1,
        isFolder: true,
    } as FlattenedTreeNode, ...!collapsed ? flattenTrees(folder.children, path, sectionIndex, path, 1) : []]
  }
// Helper Function to Create Folder Tree

export function includeChildrenOf(
    items: FlattenedTreeNode[],
    ids: UniqueIdentifier[]
  ) {
    const excludeParentIds = items.filter(f => f.children?.length > 0 && !ids.find(i => i == f.id) && f.id != '/').map(f => f.id);
    return items.filter((item) => {
      if (item.parentId && excludeParentIds.includes(item.parentId)) {
        if (item.children?.length) {
          excludeParentIds.push(item.id);
        }
        return false;
      }
  
      return true;
    });
  }

export const sortFolderTree = async (folderTree: TFolder, plugin: MakeMDPlugin) : Promise<TFolder> => {

    const stringTree = plugin.settings.folderRank;
    const rawStringTree = folderTreeToStringTree(folderTree);
    const newStringTree = mergeStringTree(stringTree, rawStringTree);
    plugin.settings.folderRank = newStringTree;

    plugin.saveSettings(false);
    
    const sortedFolderTree = sortFolderTreeUsingStringTree(folderTree, newStringTree);
    return sortedFolderTree;
}

export const renamePathInStringTree = (oldPath: string, newFile: TAbstractFile, plugin: MakeMDPlugin) => {
    const stringTree = plugin.settings.folderRank;
    const newName = newFile.name;
    const newPath = newFile.path;
    const recursive = (tree: StringTree, path: string, oldS:string, newS:string) : StringTree => {

        if (path == oldS) {
            return {
                ...tree,
                node: newS
            }
        } else if (!tree.isFolder) {
            return tree;
        }
        return {
            ...tree,
            children: tree.children.map(f => recursive(f, path+'/'+f.node, oldS, newS))
        }
    }
    plugin.settings.fileIcons = plugin.settings.fileIcons.map(f => f[0] == oldPath ? [newPath, f[1]] : f);
    plugin.settings.spaces = plugin.settings.spaces.map(f => {return {... f, children: f.children.map(
        g => g == oldPath ? newPath : g
    )}});
    
    plugin.settings.folderRank = recursive(stringTree, '', '/'+oldPath, newName)

    plugin.saveSettings();
}

export const folderTreeToStringTree = (tree: TFolder) : StringTree => {
    const recursive = (subtree: TAbstractFile) : StringTree => {
        if ((subtree as any).children) {
        return {
            node: subtree.name,
            children: (subtree as any).children.map((f: TAbstractFile) => recursive(f)),
            isFolder: true
        }
     } else {
        return {
            node: subtree.name,
            children: [],
            isFolder: false
        }
    }
    }
    return recursive(tree);
}

const reorderStringTree = (savedTrees: StringTree[], rawTrees: StringTree[]) : StringTree[]  => {
    //find missing trees in live not in cache and append
    const missingTrees = rawTrees.filter((f => !savedTrees.find(g => f.node == g.node)))
    const allTrees = [...savedTrees, ...missingTrees];
    //remove trees that are in cache but not in live
    const filteredTrees = allTrees.filter((f => rawTrees.find(g => f.node == g.node)))
    return filteredTrees;
}

export const mergeStringTree = (savedTree: StringTree, rawTree: StringTree) : StringTree => {
    const flattenSavedTree = (tree: StringTree) : StringTreePath[] => {
        const treeReduce = (t: StringTree[], currPath: string) : StringTreePath[] => {
            return t.reduce((p: StringTreePath[], c: StringTree) => {
                return [...p, {
                    ...c,
                    path: currPath+'/'+c.node
                }, ...treeReduce(c.children, currPath+'/'+c.node)];
            }, [])
        }
        return [
            {...tree, path: '/'},
            ...treeReduce(tree.children, '/')];
    }
    const rankReferences = flattenSavedTree(savedTree);

    const recursive = (subtree: StringTree, treePaths: StringTreePath[], currPath: string) : StringTree => {
        const existingTree : StringTreePath | undefined = treePaths.find(f => currPath == f.path)

        if (existingTree) {
            return {
                ...subtree,
                children: reorderStringTree(existingTree.children, subtree.children).map(t => recursive(t, treePaths, currPath+'/'+t.node))
            }
        } else {
            return {
                ...subtree,
                children: subtree.children.map(t => recursive(t, treePaths, currPath+'/'+t.node)),
            }
        }
    }
    return recursive(rawTree, rankReferences, '/')
}

export const sortFolderTreeUsingStringTree = (folderTree: TFolder, stringTree: StringTree) : TFolder => {
    const recursiveSort = (file: TAbstractFile, strings: StringTree) : TAbstractFile | TFolder => {
        if (file instanceof TFolder) { 
            return {
                ...file,
                children: file.children.map(f => {
                    
                    const currStringTree = strings.children.find(g => g.node == f.name);

                    if (currStringTree)
                        return recursiveSort(f, currStringTree);
                    return f;
                }).sort((a, b) => strings.children.findIndex(x => x.node == a.name)-strings.children.findIndex(x => x.node == b.name)),
            }
        } else {
            return file
        }
    }
    return recursiveSort(folderTree, stringTree) as TFolder;
}

export const hasChildFolder = (folder: TFolder): boolean => {
    let children = folder.children;
    for (let child of children) {
        if (child instanceof TFolder) return true;
    }
    return false;
};

// Files out of Md should be listed with extension badge - Md without extension
export const getFileNameAndExtension = (fullName: string) => {
    var index = fullName.lastIndexOf('.');
    return {
        fileName: fullName.substring(0, index),
        extension: fullName.substring(index + 1),
    };
};

// Returns all parent folder paths
export const getParentFolderPaths = (file: TFile): string[] => {
    let folderPaths: string[] = ['/'];
    let parts: string[] = file.parent.path.split('/');
    let current: string = '';
    for (let i = 0; i < parts.length; i++) {
        current += `${i === 0 ? '' : '/'}` + parts[i];
        folderPaths.push(current);
    }
    return folderPaths;
};

// Extracts the Folder Name from the Full Folder Path
export const getFolderName = (folderPath: string, app: App) => {
    if (folderPath === '/') return app.vault.getName();
    let index = folderPath.lastIndexOf('/');
    if (index !== -1) return folderPath.substring(index + 1);
    return folderPath;
};

export const internalPluginLoaded = (pluginName: string, app: App) => {
    // @ts-ignore
    return app.internalPlugins.plugins[pluginName]?._loaded;
};

export const openFile = async (file: FolderTree, app: App, newLeaf: boolean) => {
    if (file.isFolder) {
        let leaf = app.workspace.getLeaf(newLeaf);
        app.workspace.setActiveLeaf(leaf, {focus: true});
        await leaf.setViewState({ type: FOLDER_VIEW_TYPE, state: { folder: file.path }})
        await app.workspace.requestSaveLayout()
    } else {
        let leaf = app.workspace.getLeaf(newLeaf);
        app.workspace.setActiveLeaf(leaf, {focus: true});
        await leaf.openFile(app.vault.getAbstractFileByPath(file.path) as TFile, { eState: { focus: true } });
    }
};

export const openInternalLink = (event: React.MouseEvent<Element, MouseEvent>, link: string, app: App) => {
    app.workspace.openLinkText(link, '/', Keymap.isModifier(event as unknown as MouseEvent, 'Mod') || 1 === event.button);
};

export const openFileInNewPane = (plugin: MakeMDPlugin, file: FlattenedTreeNode) => {
    openFile(file, plugin.app, true);
};


function selectElementContents(el: Element) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

export const createNewMarkdownFile = async (app: App, folder: TFolder, newFileName: string, content?: string) : Promise<TFile> => {
    // @ts-ignore
    const newFile = await app.fileManager.createNewMarkdownFile(folder, newFileName);
    if (content && content !== '') await app.vault.modify(newFile, content);

    await openFile(newFile, app, false);
    const titleEl = app.workspace.activeLeaf.view.containerEl.querySelector('.inline-title') as HTMLDivElement;
    if (titleEl) {
        titleEl.focus();
        selectElementContents(titleEl)
    }
    let evt = new CustomEvent(eventTypes.activeFileChange, { detail: { filePath: newFile.path } });
    window.dispatchEvent(evt);
    return newFile;
};

export const platformIsMobile = () => {
    return Platform.isMobile;
};

export const createNewFile = async (e: React.MouseEvent, folderPath: string, plugin: MakeMDPlugin) => {
    let targetFolder = plugin.app.vault.getAbstractFileByPath(folderPath);
    if (!targetFolder) return;
    let modal = new VaultChangeModal(plugin, targetFolder, 'create note');
    modal.open();
};


export const unifiedToNative = (unified: string) => {
    let unicodes = unified.split('-')
    let codePoints = unicodes.map((u) => `0x${u}`)
    // @ts-ignore
    return String.fromCodePoint(...codePoints)
}