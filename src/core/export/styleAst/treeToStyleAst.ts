import { Superstate } from "makemd-core";
import { FrameRunInstance, FrameTreeNode } from "shared/types/frameExec";
import { FrameTreeProp } from "shared/types/mframe";
import { getFrameInstanceFromPath } from "../treeHelpers";

export type StyleAst = {
    sem: string;
    type: string;
    selector: string;
    styles: FrameTreeProp,
    children: StyleAst[];
}
export const treeNodetoStyleAst = (tree: FrameTreeNode, instance: FrameRunInstance): StyleAst => {

    const walk = (treeNode: FrameTreeNode, instance: FrameRunInstance): StyleAst => {
        const children: StyleAst[] = [];
        const styles: FrameTreeProp = instance.state[treeNode.id].styles;
        const sem: string = instance.state[treeNode.id].styles.sem;
        const variant: string = instance.state[treeNode.id].styles.variant;
        const node = treeNode.node;
        const type = node.type;
        
        treeNode.children.forEach((child, index) => {
            children.push(walk(child, instance));
        });
        return {
            sem,
            type,
            selector: variant,
            styles,
            children
        }
    }
    return walk(tree, instance);
}

export const styleFrameToStyleAst = (superstate: Superstate, path: string, schema: string): Promise<StyleAst> => {
    return getFrameInstanceFromPath(superstate, path, schema, {}, {}).then((instance) => {
        return treeNodetoStyleAst(instance.root, instance);
    })
}
