
import { buildExecutable } from 'core/utils/frames/executable';
import { executeTreeNode } from 'core/utils/frames/runner';
import { RootContent } from 'hast';
import { toHtml } from 'hast-util-to-html';
import { Superstate } from 'makemd-core';
import { treeNodeToHast } from '../treeToAst/treeToHast';
import { mdToTree } from './mdToTree';
export const markdownToHtml =
  async (superstate: Superstate, markdown: string, path: string) => {
    const tree =  await mdToTree(superstate, markdown, path);
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
              }
            );

            const hast = await treeNodeToHast(superstate, tree, _instance, [], path);
            return toHtml({
              type: 'root',
              children: hast as RootContent[],
               });

  };
