
import { buildExecutable } from "core/utils/frames/executable";
import { executeTreeNode } from "core/utils/frames/runner";
import { Element, Literal, Node, Parent, Root } from "hast";
import { fromHtml } from "hast-util-from-html";
import { Superstate } from "makemd-core";
import { stickerForField } from "schemas/mdb";
import { FrameContexts, FrameRunInstance, FrameTreeNode } from "shared/types/frameExec";
import { DBRows, SpaceProperty } from "shared/types/mdb";
import { FrameNode } from "shared/types/mframe";
import { Predicate } from "shared/types/predicate";
import { parseStickerString } from "shared/utils/stickers";
import { parseMultiString } from "utils/parsers";
import { mdToTree } from "../toHtml/mdToTree";
import { HTMLExportOptions } from "../toHtml/spaceToHtml";
import { contextNodeToInstances, getFrameInstanceFromPath, transformPath } from "../treeHelpers";


const uppercasePattern = /([A-Z])/g;
export function hyphenate(key: string) {
  return key.replace(uppercasePattern, '-$1').toLowerCase();
}


const parseStyle = (style: Record<string, any>) => {
  if (!style) return '';
    return Object.keys(style).map((f) => {
      if (f == 'layout') return layoutToStyle(style[f]);
      if (f == 'layoutAlign') return layoutDirectionToStyle(style['layout'], style[f]);
      return `${hyphenate(f)}: ${style[f]};`
    }).join(' ');
}

export const getStickerHast = (superstate: Superstate, sticker: string) : Element | Root => {
  const stickerType =  parseStickerString(sticker)
  const stickerPath = stickerType[1];
      if (
        stickerType[0] == "image") {
          return {
            tagName: 'img',
            properties: {
              src: superstate.ui.getUIPath(superstate.imagesCache.get(stickerPath)),
              style: 'width: 100%; height: 100%;',
            },
            children: [],
            type: 'element',
          }
        }
  const data = superstate.ui.getSticker(sticker)?.replace(/<svg/g, `<svg style="width: 100%; height: 100%;"`);
  return fromHtml(data);
}

const layoutToStyle = (layout: string) => {
    switch (layout) {
      case 'row':
        return 'display: flex; flex-direction: row;';
      case 'column':
        return 'display: flex; flex-direction: column;';
        case 'grid':
            return 'display: grid;';
        case 'masonry':
          return 'column-count: 3'
        default:
            return '';
    }
}

const layoutDirectionToStyle = (layout: string, direction: string) => {
    switch (direction) {
      case 'nw':
      {
        if (layout == 'row') return 'align-items: flex-start; justify-content: flex-start;';
        if (layout == 'column') return 'align-items: flex-start; justify-content: flex-start;';
        return '';
      }
      case 'ne':
      {
        if (layout == 'row') return 'align-items: flex-start; justify-content: flex-end;';
        if (layout == 'column') return 'align-items: flex-end; justify-content: flex-start;';
        return '';
      }
      case 'sw':
      {
        if (layout == 'row') return 'align-items: flex-end; justify-content: flex-start;';
        if (layout == 'column') return 'align-items: flex-start; justify-content: flex-end;';
        return '';
      }
      case 'se':
      {
        if (layout == 'row') return 'align-items: flex-end; justify-content: flex-end;';
        if (layout == 'column') return 'align-items: flex-end; justify-content: flex-end;';
        return '';
      }
      case 'n':
      {
        if (layout == 'row') return 'align-items: flex-start; justify-content: center;';
        if (layout == 'column') return 'align-items: flex-start; justify-content: center;';
        return '';
      }
      case 's':
      {
        if (layout == 'row') return 'align-items: flex-end; justify-content: center;';
        if (layout == 'column') return 'align-items: flex-end; justify-content: center;';
        return '';
      }
      case 'e':
      {
        if (layout == 'row') return 'align-items: center; justify-content: flex-end;';
        if (layout == 'column') return 'align-items: flex-end; justify-content: center;';
        return '';
      }
      case 'w':
      {
        if (layout == 'row') return 'align-items: center; justify-content: flex-start;';
        if (layout == 'column') return 'align-items: flex-start; justify-content: center;';
        return '';
      }
    }}







const getPathName = (superstate: Superstate, path: string) => {
  const sticker = superstate.pathsIndex.get(path)?.label.sticker;
  return {
    tagName: 'div',
    properties: {
      style: 'display: flex; align-items: center;',
    },
    children: [
      {
        tagName: 'div',
        properties: {
          style: 'width: 16px; height: 16px;',
        },
        children: [getStickerHast(superstate, sticker)],
        type: 'element',
      },
      
      {
        tagName: 'div',
        properties: {
          style: 'margin-left: 8px;',
        },
        children: [{ value: superstate.pathsIndex.get(path)?.name ?? '', type: 'text' }],
        type: 'element',
      },
    ],
    type: 'element',
  }

}

const cellToHast = (superstate: Superstate, column: SpaceProperty, data: string, path: string) : Node => {
    const type = column.type;
    if (type == 'image')
      return {
      tagName: 'img',
      properties: {
        src: data,
        style: 'width: 100%; height: auto;',
      },
      children: [],
      type: 'element',
    } as Parent;
    if (type == 'icon') return {
      tagName: 'div',
      properties: {
        style: 'width: 48px; height: 48px; flex: 0 0 auto;',
      },
      children: [getStickerHast(superstate, data)],
      type: 'element',
    } as Parent;
    if (type == 'text') return {
      value: data ?? '',
      type: 'text',
    } as Literal;
    if (type == 'number') return {
      value: data ?? '',
      type: 'text',
    } as Literal;
    if (type == 'date') return {
      value: data ?? '',
      type: 'text',
    } as Literal;
    if (type == 'option') return {
      value: data ?? '',
      type: 'text',
    } as Literal;
    if (type == 'boolean') return {
      tagName: 'input',
      properties: {
        type: 'checkbox',
        checked: data == 'true' ? true : false,
        disabled: true,
      },
      children: [],
      type: 'element',
    } as Parent;
    if (type == 'option-multi' || type == 'tags-multi') return {
      tagName: 'ul',
      children: parseMultiString(data).map((f) => ({
        tagName: 'li',
        children: [{ value: f ?? '', type: 'text' }],
        properties: {},
        type: 'element',
      })),
      properties: {},
      type: 'element',
    } as Parent;
    if (type == 'link' || type == 'file' || type == 'context') return {
      tagName: 'a',
      properties: {
        href: transformPath(superstate, data, path),
      },
      children: [getPathName(superstate, data)],
      type: 'element',
    } as Parent;
    if (type == 'link-multi' || type == 'context-multi') return {
      tagName: 'ul',
      properties: {},
      children: parseMultiString(data).map((f) => ({
        tagName: 'li',
      properties: {},
        children: [
          {
            tagName: 'a',
            properties: { href: transformPath(superstate, f, path) },
            children: [getPathName(superstate, f)], type: 'element',
          },
        ],
        type: 'element',
      })),
      type: 'element',
    } as Parent;
    return {
      value: data ?? '',
      type: 'text',
    } as Literal;

}

const tableViewForContext = async (superstate: Superstate, predicate: Predicate, cols: SpaceProperty[], data:  Record<string, DBRows>, path: string, options?: HTMLExportOptions) : Promise<Node> => {
    const visibleCols = cols.filter((f) => predicate.colsHidden.indexOf(f.name) == -1);
    const tableColumnsHast = visibleCols.map((f) =>
    {
      return {
        tagName: 'th',
        properties: {},
        children: [
          {
            tagName: 'div',
            properties: { style: 'display: flex; align-items: center;' },
            children: [
              {
                tagName: 'div',
                properties: { style: 'flex: 0 0 auto; width: 16px; height: 16px;' },
                children: [getStickerHast(superstate, stickerForField(f)),],
                type: 'element',
              },
              {
                value: f.name,
                type: 'text',
              }
            ],
            type: 'element',
          }
        ],
        type: 'element',
      }
    });
    const tableRowsHast : Node[] = Object.keys(data).map((c) => {
      const rows = data[c].map((r) => {
        return { tagName: 'tr',
          properties: {},
          children: visibleCols.map((f) => {
            return {
              properties: {},
              type: 'element',
              tagName: 'td',
              children: [cellToHast(superstate, f, r[f.name], path)],
            }
            
          }),
          type: 'element',
        }
      })
      return {
        tagName: 'tbody',
        properties: {},
        children: rows,
        type: 'element',
      }
    }
    )
    return {
      tagName: 'table',
      properties: {},
      children: [
        {
          tagName: 'thead',
          properties: {},
          children: [
            {
              tagName: 'tr',
              properties: {},
              children: tableColumnsHast,
              type: 'element',
            },
          ],
          type: 'element',
        },
        ...tableRowsHast
      ],
      type: 'element',
    } as Parent;


}

const contextNodeToHast = async (superstate: Superstate, node: FrameNode, instance: FrameRunInstance, og: string, options?: HTMLExportOptions) => {
  const contextNode = await contextNodeToInstances(superstate, node, instance, og);
  if (!contextNode) return [];
  const { type, instances, predicate, cols, data, path, source } = contextNode;
    if (type == 'table') {
      return [await tableViewForContext(superstate, predicate, cols, data, path, options)];
    }

    const groupInstances = await Promise.all(instances.listGroups.map((a, i) => {
      return Promise.all(instances.listItems.map((f) => Promise.all(f.map((g) => instanceToHast(superstate, g, [], source, 'contextItem'))).
      then(g => instanceToHast(superstate, a, g.flat(), source, 'contextGroup'))));
    }));
    const listView = await instanceToHast(superstate, instances.listView, groupInstances.flat().flat(), source, 'contextView');
    return listView
}

// export const embedImage = async (superstate: Superstate, path: string) => {
//   const imageUrlToBase64 = async (url: string) : Promise<string> => {
//     const xhr = new XMLHttpRequest();
//     return new Promise((resolve, reject) => {
//     xhr.onload = async () => {
      
//         const reader = new FileReader();
//         reader.onloadend = () => {
//           const base64data = reader.result;
//           resolve(base64data as string);
//         };
//         reader.onerror = reject;
//       };
//       xhr.open('GET', url);
//       xhr.responseType = 'blob';
//       xhr.send();
//     })
    
//   };
//   return imageUrlToBase64(path.startsWith('http') ? path : superstate.ui.getUIPath(path));
// }


export const treeNodeToHast =  async (superstate: Superstate, treeNode: FrameTreeNode, instance: FrameRunInstance, content: Node[], path: string, options?: HTMLExportOptions) :Promise<Node[]> => {

  const treeNodeType = treeNode.node.type;

    const node = treeNode.node;
    if (instance.state[node.id].styles?.hidden) return [];
    let inner : Node[] = [];
    let tag = instance.state[node.id].styles?.['sem'] ?? 'div';
    let attrs : Record<string, any> = {};
    const styles = instance.state[node.id]?.styles ?? {};
    if (treeNodeType === 'space') {
        inner = await contextNodeToHast(superstate, node, instance, path, options);
    }

    if (treeNodeType == 'icon') {
      const icon = instance.state[node.id].props.value;
      inner = [getStickerHast(superstate, icon)];
    }
    if (treeNodeType == 'content') {
      inner = content.slice();
    }
    if (treeNodeType == 'image') {
      const src = instance.state[node.id].props.value;
      tag = 'img';
      // if (options?.images?.embed) {
      //   const data = await embedImage(superstate, src);
      //   attrs.src = data as string;
      // } else {
        attrs.src = transformPath(superstate, src, path);
      // }
      
    }
    if (treeNodeType == 'text') {
      const text : string = instance.state[node.id].props.value ?? '';
      tag = instance.state[node.id].styles?.['sem'];
      if (tag == 'br') {
        tag = 'p';
      }
      if (tag == 'a') {
        attrs.href = text;
        if (instance.state[node.id].styles?.['label']) {
          inner = [{
            value: instance.state[node.id].styles?.['label'] ?? '',
            type: 'text',
          } as Literal]
        }
      } else {
        text.split('\n').forEach((f, i, a) => {
          inner.push({
            value: f,
            type: 'text',
          } as Literal);
        if (i < a.length - 1) {
          inner.push({
            tagName: 'br',
            properties: {},
            children: [],
            type: 'element',
          } as Element);
        }
      }
      );
      }
  }
  if (treeNodeType == 'flow') {
    let notePath = superstate.spaceManager.resolvePath(instance.state[node.id].props.value, path);
    const expanded = instance.state[node.id].styles?.['--mk-expanded'];

    if (!expanded) {
      if (!superstate.pathsIndex.has(notePath)) return [];
      return [{
        tagName: 'div',
        properties: {
          style: 'display: flex;',
        },
        children: [{
          tagName: 'a',
          properties: {
            href: transformPath(superstate, notePath, path),
          },
          children: [getPathName(superstate, notePath)],
          type: 'element',
        }],
        type: 'element',
      } as Parent];
    }
    if (superstate.spacesIndex.has(notePath)) {
      const space = superstate.spacesIndex.get(notePath);
      notePath = space.space.notePath;
    }
    if (!notePath) {
      return [];
    }
    const md = await superstate.spaceManager.readPath(notePath);
    const parent = notePath.split('/').slice(0, -1).join('/');
    if (!md) return [];
    const tree = await mdToTree(superstate, md, notePath);
    
    const exec = await buildExecutable(tree);
        const _instance = await executeTreeNode(
          exec,
          {
            prevState: {},
            state: {},
            newState: {},
            slides: {},
          },
          {
            api: superstate.api,
            contexts: {},
            saveState: () => null,
            root: exec,
            exec: exec,
            runID: '',
            selectedSlide: '',
            styleAst: instance.styleAst,
          }
        );
        const hast = await treeNodeToHast(superstate, tree, _instance, [], parent, options);
    inner = hast ?? [];
}
if (treeNodeType == 'input') {
  if (instance.state[node.id].styles?.['sem'] == 'checkbox') {
    tag = 'input';
    styles['display'] = 'inline-block';
    attrs = {
      type: 'checkbox',
      checked: instance.state[node.id].props.value == 'true',
      disabled: true,
    };
  }
}
if (treeNodeType == 'slides') {
  return [];
}
  if (treeNode.children?.length > 0) {

    if (treeNodeType == 'contextView') {
      tag = 'div';
      attrs = {
        'data-type': 'contextView',
      }
    }
    if (tag == 'contextGroup') {
      tag = 'div';
      attrs = {
        'data-type': 'contextGroup',
      }
    }
    if (tag == 'contextItem') {
      tag = 'a';
      attrs = {
        'data-type': 'contextItem',
        href: transformPath(superstate, instance.state[node.id].styles['dataPath'], path),
        'data-path': instance.state[node.id].styles['dataPath'],
      }
    }
    if (tag == 'taskList') {
      tag = 'ul';
      styles['flex-basis'] = '100%';
      attrs = {
        'data-type': 'taskList',
      }
    }
    if (tag == 'task') {
      tag = 'li';
      styles['display'] = 'flex';
      styles['flex-wrap'] = 'wrap';
      attrs = {
        'data-type': 'taskItem',
        'data-checked': instance.state[node.id].props.value == 'true' ? 'true' : 'false',
      }
    }
    
    if (tag == 'ul') {

      tag = 'ul';
      styles['flex-basis'] = '100%';
    } else if (tag == 'ol') {

      tag = 'ol';
      styles['flex-basis'] = '100%';
    }

    for (let i = 0; i < treeNode.children.length; i++) {
      const node = await treeNodeToHast(superstate, treeNode.children[i], instance, content, path, options)
      if (node)
        inner.push(...node);
    }
  }
  if (!tag) {
    return inner;
  }
  delete styles['sem'];
    return [{
      tagName: tag,
      properties: {...attrs, style: parseStyle(styles)},
      children: inner,
      type: 'element',
    } as Parent];
}

export const instanceToHast = async (superstate: Superstate, instance: FrameRunInstance, content: Node[], path: string, rootType?: string, options?: HTMLExportOptions) => {
  if (rootType == 'contextItem') {
    instance.state[instance.exec.id].styles['dataPath'] = instance.contexts.$context._keyValue;
    instance.state[instance.exec.id].styles['sem'] = 'contextItem';
  }
  if (rootType == 'contextGroup' || rootType == 'contextView') {
    instance.state[instance.exec.id].styles['sem'] = rootType;
  }
    return treeNodeToHast(superstate, instance.exec, instance, content, path, options);
}

export const treeToHast = async (superstate: Superstate, context: FrameContexts, path: string, schema: string, options: HTMLExportOptions) => {
  const instance = await getFrameInstanceFromPath(superstate, path, schema, {}, context, options.styleAst);
  return await instanceToHast(superstate, instance, [], path);
}
