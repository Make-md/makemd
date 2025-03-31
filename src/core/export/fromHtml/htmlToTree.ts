
import { wrapQuotes } from "core/utils/strings";
import { fromHtml } from "hast-util-from-html";
import parse from 'inline-style-parser';
import { uniqueId } from "lodash";
import { FrameTreeNode } from "shared/types/frameExec";
export const htmlToTree = (html: string): FrameTreeNode => {
  const root = fromHtml(html, {
    fragment: true,
  });
  const walk = (node: any, index: number) => {
    const nodeId = uniqueId('~');
    let children: any[] = [];
    let style: any = {};
    let props: any = {};
    let type = 'group';
    let sem: string = null;
    
    if (node.tagName == 'strong' || node.tagName == 'em' || node.tagName == 's' || node.tagName === 'p' || node.tagName === 'h1' || node.tagName === 'h2' || node.tagName === 'h3' || node.tagName === 'h4' || node.tagName === 'h5' || node.tagName === 'h6') {
      sem = node.tagName;
      type = 'text';
    }
    if (node.tagName == 'span') {
      type = 'text';
      sem = 'span';
      if (node.properties.style) {
          parse(node.properties.style).forEach((obj) => {
        if (obj.type === 'declaration') {
        style[obj.property] = wrapQuotes((obj.value));
        }
      }
      );
    }
    }
    if (node.tagName == 'blockquote' || node.tagName == 'pre') {
      type = 'group';
      sem = node.tagName;
    }
    if (node.tagName == 'a') {
      type = 'text';
      sem = 'a';
      style['label'] = wrapQuotes(node.value);
      props['value'] = wrapQuotes(node.href);
    }
    if (node.tagName == 'br') {
      type = 'text';
      props['value'] = '';
      sem = 'br';
    }
    if (node.type === 'text') {
      type = 'text';
      props['value'] = wrapQuotes(node.value);
    }
    if (node.tagName == 'table' || node.tagName == 'thead' || node.tagName == 'tbody' || node.tagName == 'tfoot' || node.tagName == 'tr' || node.tagName == 'td' || node.tagName == 'th') {
      type = 'group';
      sem = node.tagName;
    }
    if (node.tagName === 'ul' || node.tagName === 'ol') {
      type = 'group';
      sem = node.tagName;
      if (node.properties['dataType'] == 'taskList') {
        sem = 'taskList';
      }
    }
    if (node.children?.length > 0){
      children = node.children.map((g: any, i: number) => walk(g, i));
    if (node.tagName === 'li') {
        type = 'group';
        sem = 'li';
        if (node.properties['dataType'] == 'taskItem') {
          props['value'] = wrapQuotes(node.properties.dataChecked == 'true' ? 'true' : 'false');
          sem = 'task';
          const inputId = uniqueId('~');
          const before : FrameTreeNode = {
            id: inputId,
            node: {
              id: inputId,
              schemaId: '',
              rank: 0,
              name: 'input',
              type: 'input',
              props: {
                value: node.checked ? 'true' : 'false',
              },
            },
            children: [],
            parent: null,
            isRef: false,
            editorProps: { editMode: 0}
          };
          children = [before, ...children];
        }

      }

    }
    if (sem) {
      style.sem = wrapQuotes(sem);
    }
    const treeNode : FrameTreeNode = {
      id: nodeId,
      node: {
        id: nodeId,
        schemaId: '',
        rank: 0,
        name: node.tagName,
        type: type,
        props,
        styles: style,
      },
      children,
      parent: null,
      isRef: false,
      editorProps: { editMode: 0}
    };
    return treeNode;
  }
  return walk(root, 0);
}
