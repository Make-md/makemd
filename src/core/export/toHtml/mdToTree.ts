
import { wrapQuotes } from "core/utils/strings";
import { uniqueId } from "lodash";
import { Superstate } from "makemd-core";
import { Html, Parent, Root, RootContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { gfmFromMarkdown } from "mdast-util-gfm";
import * as wikiLink from 'mdast-util-wiki-link';
import { frontmatter } from "micromark-extension-frontmatter";
import { gfm } from "micromark-extension-gfm";
import { syntax } from 'micromark-extension-wiki-link';
import { FrameTreeNode } from "shared/types/frameExec";
import { FrameTreeProp } from "shared/types/mframe";
import { htmlToTree } from "../fromHtml/htmlToTree";
import { resolvePath } from "../treeHelpers";



export const mdToTree = (superstate: Superstate,  md: string, path: string) : FrameTreeNode => {
const parentPath = path.split('/').slice(0, -1).join('/');
    const tree = fromMarkdown(md, {
        extensions: [syntax(), gfm(), frontmatter(['yaml', 'toml'])],
        mdastExtensions: [wikiLink.fromMarkdown(), gfmFromMarkdown(), frontmatterFromMarkdown(['yaml', 'toml'])]
    });

    const walkChildren = ( node: RootContent) => {
        const children = (node as Parent).children;
        if (!children) return [];
        return children.reduce(((p, g,i, arr)=> {
        if (p.skip.includes(i)) return p;
        const { node: childNode, skip } = walk(g, i, node, i > 0 && arr[i-1]);
        return {children: [...p.children, childNode], skip: [...p.skip, ...skip]};
    }), {
        children: [],
        skip: []
    }).children
};

    const walk = (node: RootContent | Root, index: number, parent?: RootContent | Root, prev?: RootContent | Root) : {node: FrameTreeNode, skip: number[]} => {
        const nodeId = uniqueId('~');
        let children : FrameTreeNode[] = null;
        const style : FrameTreeProp = {};
        const props : FrameTreeProp = {};
        let type = 'group';
        if (prev && prev.position.end.line < node.position.start.line - 1) {
            const spaces :FrameTreeNode[] = Array.from({length: node.position.start.line - prev.position.end.line - 1}).map((f, i) => {
                const id = uniqueId('~');
                return {
                    id: id,
                    node: {
                        id: id,
                        schemaId: '',
                        rank: 0,
                        name: 'break',
                        type: 'text',
                        props: {
                            value: `''`,
                        },
                        styles: {
                            sem: `'br'`,
                        }
                    },
                    children: [],
                    isRef: false,
                    editorProps: {
                        editMode: 0,
                    },
                    parent: null,
                } as FrameTreeNode
            }
            )
            children = [...spaces, ...walkChildren(node as RootContent)];
            
        }
        if (node.type === 'paragraph') {
            type = 'text';
            style['sem'] = wrapQuotes('div');
        }
        if (node.type === 'heading') {
            style['sem'] = wrapQuotes('h' + node.depth);
            type = 'text';
        }
        if (node.type === 'text') {
            type = 'text';
            props['value'] = wrapQuotes(node.value);
        }
        if (node.type === 'list') {
            type = 'group';
            style['sem'] = wrapQuotes(node.ordered ? 'ol' : 'ul');
            if (node.children.some((g)=>g.checked !== null)) {
                style['sem'] = wrapQuotes('taskList');
            }
        }
        if (node.type === 'listItem') {
            type = 'group';
            if (node.checked !== null) {
              props['value'] = wrapQuotes(node.checked ? 'true' : 'false');

                style['sem'] = `'task'`;
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
                        styles: {
                            sem: `'checkbox'`,
                        }
                    },
                    children: [],
                    isRef: false,
                    editorProps: {
                        editMode: 0,
                    },
                    parent: null,
                }
                children = [before, ...walkChildren(node)];
        } else {
            style['sem'] = `'li'`;
        }

        }

        if (node.type === 'link') {
            type = 'text';
            props['value'] = wrapQuotes(resolvePath(superstate, node.url, parentPath));
            style['label'] = wrapQuotes(node.title);
            style['sem'] = `'a'`;
        }
        if (node.type === 'image') {
            type = 'image';
            style['label'] = wrapQuotes(node.title);
            props['value'] = wrapQuotes(resolvePath(superstate, node.url, parentPath));
        }
        if (node.type === 'code') {
            type = 'text';
            props['value'] = wrapQuotes(node.value);
            style['sem'] = `'pre'`;
        }
        if (node.type === 'table') {
            type = 'group';
            style['sem'] = `'table'`;
        }
        if (node.type === 'tableRow') {
            type = 'group';
            style['sem'] = `'tr'`;
        }
        if (node.type === 'tableCell') {
            type = 'group';
            style['sem'] = `'td'`;

        }
        if (node.type === 'blockquote') {
            type = 'group';
            style['sem'] = `'blockquote'`;
        }
        if (node.type === 'html') {
            type = 'group';

            const html = htmlToTree(node.value);
            const tagName = node.value.match(/<\s*([a-zA-Z0-9]*)/)?.[1];
            const endTagIndex = (parent as Parent).children.findIndex(f => f.type === 'html' && (f as Html).value.startsWith(`</${tagName}>`));
            if (endTagIndex > -1) {
                const walkHtml = (html: FrameTreeNode, tag: string, children: FrameTreeNode[]) => {
                    if (html.node.styles['sem'] === wrapQuotes(tag)) {
                        html.children = children;
                        return html;
                    }
                    if (html.children) {
                        html.children = html.children.map(f => walkHtml(f, tag, children));
                    }
                    return html;
                }
                const children = (parent as Parent).children.slice(index + 1, endTagIndex).map((g,i, arr)=>walk(g, i, node, i> 0 && arr[i-1]).node)
                const newHtml = walkHtml(html, tagName, children);
                return { node: newHtml, skip: Array.from({length: endTagIndex - index}).map((f, i) => i + index) };
            }
            return { node: html, skip: [] };
        }
        if (node.type === 'thematicBreak') {
            type = 'group';
            style['sem'] = `'hr'`;
        }
        if (node.type === 'break') {
            type = 'text';
            props['value'] = '';
            style['sem'] = `'br'`;
        }
        if (node.type === 'emphasis') {
            type = 'text';
            style['sem'] = `'em'`;
        }
        if (node.type === 'strong') {
            type = 'text';
            style['sem'] = `'strong'`;
        }
        if (node.type === 'delete') {
            type = 'text';
            style['sem'] = `'s'`;
        }
        if ((node as any).type === 'wikiLink') {
            type = 'flow';
            props['value'] = `'${resolvePath(superstate, (node as any).value, parentPath)}'`;
        }
        if (node.type === 'inlineCode') {
            type = 'text';
            props['value'] = wrapQuotes(node.value);
            style['sem'] = `'code'`;
        }

        if (node.type === 'footnoteDefinition') {
            type = 'group';
            props['value'] = 'footnoteDefinition';
        }
        if (node.type === 'footnoteReference') {
            type = 'group';
            props['value'] = 'footnoteReference';
        }
        if (node.type === 'definition') {
            type = 'group';
            props['value'] = 'definition';
        }
        if (node.type == 'root') {
            type = 'group';
        }

        if (node.type === 'yaml') {
            type = 'group';
            children = [];
        }

        
        if ((node as Parent).children && !children) {
        children = walkChildren(node as RootContent);
        }
        
        return {node: {
                id: nodeId,
                node: {
                    id: nodeId,
                    schemaId: '',
                    rank: index,
                    name: node.type,
                    type: type,
                    props: props ?? {},
                    styles: style,
                },
                children: children ?? [],
                isRef: false,
                editorProps: {
                    editMode: 0,
                },
                parent: null,
            }, skip: []}
    }
    return walk(tree, 0).node;
}
