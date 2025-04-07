import { StyleAst } from "shared/types/frameExec";
import { hyphenate } from "../treeToAst/treeToHast";

export const styleAstToCSS = (styleAst: StyleAst): string => {
    let css = "* { box-sizing: border-box; }\n";

    const walk = (styleAst: StyleAst, parent: string): string => {
        let selector = styleAst.sem;
        
        
        if (styleAst.sem == 'taskList') {
            selector = `li[data-type='taskList']`
        }
        if (styleAst.sem == 'contextView') {
            selector = `div[data-type='contextView']`
        }
        if (styleAst.sem == 'contextGroup') {
            selector = `div[data-type='contextGroup']`
        }
        if (styleAst.sem == 'contextItem') {
            selector = `a[data-type='contextItem']`
        }
        if (styleAst.sem == 'root') {
            selector = 'body'
        } else 
        if (styleAst.type == 'slide')  {
            if (selector == '$hover') {
                selector = ":hover"
            } else if (selector == '$active') {
                selector = ".mk-active"
            }
            if (styleAst.selector.length > 0) {
                
                selector = `${parent}.${styleAst.selector}${selector}`
            } else {
                selector = `${parent}${selector}`
            }
        } else {
            if (styleAst.selector.length > 0) {
                selector += `.${styleAst.selector}`
            }
            selector = `${parent} ${selector}`
        }
        
        const children = styleAst.children.map(child => walk(child, styleAst.sem == 'root' ? '' : selector)).join("\n");
        const cssString = `${selector} {
            ${Object.entries(styleAst.styles).map(([key, value]) => `${hyphenate(key)}: ${value}${styleAst.type == 'slide' ? '!important' : ''};`).join("\n")}
            }\n`
        return cssString + children;
        }
    css += walk(styleAst, '');
    return css;
  
}