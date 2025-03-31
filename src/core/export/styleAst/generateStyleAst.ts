import { isNumber, isString } from "lodash";

import { StyleAst } from "./treeToStyleAst";


type StyleDefTree = {
    sem: string,
    tag: string,
    class: string,
    children: StyleDefTree[],
    state?: boolean,
    compute?: boolean,
    styles: Record<string, string>
}

const sems : StyleDefTree[] = [
    {
        sem: 'h1',
        tag: 'h1',
        class: '',
        children: [],
        styles: {
            '--font-weight': 'var(--h1-weight)',
            'font-variant': 'var(--h1-variant)',
            'letter-spacing': '-0.015em',
            'line-height': 'var(--h1-line-height)',
            'font-size': 'var(--h1-size)',
            'color': 'var(--h1-color)',
            'font-style': 'var(--h1-style)',
            'font-family': 'var(--h1-font)',
            'font-weight': 'var(--font-weight)'
        }
    },
    {
        sem: 'h2',
        tag: 'h2',
        class: '',
        children: [],
        styles: {
            '--font-weight': 'var(--h2-weight)',
            'font-variant': 'var(--h2-variant)',
            'letter-spacing': '-0.015em',
            'line-height': 'var(--h2-line-height)',
            'font-size': 'var(--h2-size)',
            'color': 'var(--h2-color)',
            'font-style': 'var(--h2-style)',
            'font-family': 'var(--h2-font)',
            'font-weight': 'var(--font-weight)'
        }
    },
    {
        sem: 'h3',
        tag: 'h3',
        class: '',
        children: [],
        styles: {
            '--font-weight': 'var(--h3-weight)',
            'font-variant': 'var(--h3-variant)',
            'letter-spacing': '-0.015em',
            'line-height': 'var(--h3-line-height)',
            'font-size': 'var(--h3-size)',
            'color': 'var(--h3-color)',
            'font-style': 'var(--h3-style)',
            'font-family': 'var(--h3-font)',
            'font-weight': 'var(--font-weight)'
        }
    },
    {
        sem: 'h4',
        tag: 'h4',
        class: '',
        children: [],
        styles: {
            '--font-weight': 'var(--h4-weight)',
            'font-variant': 'var(--h4-variant)',
            'letter-spacing': '0.015em',
            'line-height': 'var(--h4-line-height)',
            'font-size': 'var(--h4-size)',
            'color': 'var(--h4-color)',
            'font-style': 'var(--h4-style)',
            'font-family': 'var(--h4-font)',
            'font-weight': 'var(--font-weight)'
        }
    },
    {
        sem: 'h5',
        tag: 'h5',
        class: '',
        children: [],
        styles: {
            '--font-weight': 'var(--h5-weight)',
            'font-variant': 'var(--h5-variant)',
            'letter-spacing': '0.015em',
            'line-height': 'var(--h5-line-height)',
            'font-size': 'var(--h5-size)',
            'color': 'var(--h5-color)',
            'font-style': 'var(--h5-style)',
            'font-family': 'var(--h5-font)',
            'font-weight': 'var(--font-weight)'
        }
    },
    {
        sem: 'h6',
        tag: 'h6',
        class: '',
        children: [],
        styles: {
            '--font-weight': 'var(--h6-weight)',
            'font-variant': 'var(--h6-variant)',
            'letter-spacing': '0.015em',
            'line-height': 'var(--h6-line-height)',
            'font-size': 'var(--h6-size)',
            'color': 'var(--h6-color)',
            'font-style': 'var(--h6-style)',
            'font-family': 'var(--h6-font)',
            'font-weight': 'var(--font-weight)'
        }
    },
    {
        sem: 'contextView',
        tag: 'div',
        class: '',
        children: [],
        styles: {
            'display': 'flex',
            'flex-direction': 'column',
        }
    },
    {
        sem: 'contextGroup',
        tag: 'div',
        class: '',
        children: [],
        styles: {
            'display': 'flex',
            'flex-direction': 'column',
        }
    },
    {
        sem: 'contextItem',
        tag: 'a',
        class: '',
        children: [{
            sem: '$hover',
            tag: '',
            class: '',
            state: true,
            children: [],
            styles: {
                'background': 'var(--mk-ui-background-hover)',
            }
        }],
        styles: {
            'display': 'flex',
            'flex-direction': 'column',
            'text-decoration': 'none',
            'color': 'inherit',
        }
    },
    {
        sem: 'ol',
        tag: 'ol',
        class: '',
        children: [
            {
                sem: 'li',
                tag: 'li',
                class: '',
                children: [],
                styles: {
                    'margin-inline-start': '3ch',
                    
                }
            }
        ],
        styles: {
            'padding-inline-start': '0',
            'margin-block-start': 'var(--p-spacing)',
            'margin-block-end': 'var(--p-spacing)'
        }
    },
    {
        sem: 'ul',
        tag: 'ul',
        class: '',
        children: [
            {
                sem: 'li',
                tag: 'li',
                class: '',
                children: [],
                styles: {
                    'margin-inline-start': '3ch',
                }
            }
        ],
        styles: {
            'padding-inline-start': '0',
            'margin-block-start': 'var(--p-spacing)',
            'margin-block-end': 'var(--p-spacing)',
            'list-style-type': '\\200B'
        }
    },
    {
        sem: 'taskList',
        tag: 'ul',
        class: 'contains-task-list',
        children: [
            {
                sem: 'task',
                tag: 'li',
                class: 'task-list-item',
                children: [
                    {
                        sem: 'input',
                        tag: 'input',
                        class: 'task-list-item-checkbox',
                        children: [],
                        styles: {
                            'margin-inline-start': 'calc(var(--checkbox-size)* -1.5)',
                        }
                    }
                ],
                styles: {
                    'display': 'flex',
                    'flex-direction': 'row',
                    'align-items': 'center',
                    'margin-block-start': 'var(--p-spacing)',
                    'margin-block-end': 'var(--p-spacing)',
                }
            }
        ],
        styles: {
            'padding-inline-start': '0',
            'margin-block-start': 'var(--p-spacing)',
            'margin-block-end': 'var(--p-spacing)',
        }
    },
    {
        sem: 'li',
        tag: 'li',
        class: '',
        children: [],
        styles: {
            'margin-inline-start': '3ch',
        }
    },
    {
        sem: 'a',
        tag: 'a',
        class: '',
        children: [],
        styles: {
            '--font-weight': 'var(--link-weight)',
            'color': 'var(--link-color)',
            'font-weight': 'var(--link-weight)',
            'outline': 'none',
            'text-decoration-line': 'var(--link-decoration)',
            'text-decoration-thickness': 'var(--link-decoration-thickness)',
            'cursor': 'var(--cursor-link)',
            'transition': 'opacity 0.15s ease-in-out'
        }
    },
    {
        sem: 'span',
        tag: 'span',
        class: '',
        children: [],
        styles: {
            'color': 'var(--span-color)',
            'font-weight': 'var(--span-weight)',
            'font-style': 'var(--span-style)',
            'font-family': 'var(--span-font)',
            'font-size': 'var(--span-size)',
            'line-height': 'var(--span-line-height)',
            'letter-spacing': 'var(--span-spacing)',
            'text-transform': 'var(--span-transform)',
        }
    },
    {
        sem: 'table',
        tag: 'table',
        class: '',
        children: [
            {
                sem: 'thead',
                tag: 'thead',
                class: '',
                children: [
                    {
                        sem: 'tr',
                        tag: 'tr',
                        class: '',
                        children: [{
                            sem: 'td',
                            tag: 'td',
                            class: '',
                            children: [],
                            styles: {}
                        }],
                        styles: {}
                    }
                ],
                styles: {}
            },
            {
                sem: 'tbody',
                tag: 'tbody',
                class: '',
                children: [
                    {
                        sem: 'tr',
                        tag: 'tr',
                        class: '',
                        children: [{
                            sem: 'td',
                            tag: 'td',
                            class: '',
                            children: [],
                            styles: {
                                'padding': 'var(--size-2-2) var(--size-4-2)',
    'border': 'var(--table-border-width) solid var(--table-border-color)',
    'max-width': 'var(--table-column-max-width)',
    'min-width': 'var(--table-column-min-width)',
    'vertical-align': 'var(--table-cell-vertical-alignment)'
                            }
                        }],
                        styles: {}
                    }
                ],
                styles: {}
            }],
        styles: {
            'border-collapse': 'collapse',
            'width': '100%',
            'margin-block-start': 'var(--p-spacing)',
            'margin-block-end': 'var(--p-spacing)',
        }
    },
    {
        tag: 'input',
        sem: 'input',
        class: '',
        children: [],
        styles: {
            'margin-inline-start': '3ch',
        }
    },
    {
        tag: 'pre',
        sem: 'pre',
        class: '',
        children: [],
        styles: {
            'position': 'relative',
            'padding': 'var(--size-4-3) var(--size-4-4)',
            'min-height': '38px',
            'background-color': 'var(--code-background)',
            'border-radius': 'var(--code-radius)',
            'white-space': 'var(--code-white-space)',
            'border': 'var(--code-border-width) solid var(--code-border-color)',
            'overflow-x': 'auto',
        }
    },
    {
        tag: 'br',
        sem: 'br',
        class: '',
        children: [],
        styles: { 
            'margin-inline-start': '3ch',
        }
    },
    {
        tag: 'hr',
        sem: 'hr',
        class: '',
        children: [],
        styles: {
            'border': 'none',
            'border-top': 'var(--hr-thickness) solid',
            'border-color': 'var(--hr-color)'
        }
    },
    {
        tag: 'img',
        sem: 'img',
        class: '',
        children: [],
        styles: {
            'max-width': '100%',
        }
    },
    {
        tag: 'code',
        sem: 'code',
        class: '',
        children: [],
        styles: {
            }
    },
    {
        tag: 'blockquote',
        sem: 'blockquote',
        class: '',
        children: [],
        styles: {
            'color': 'var(--blockquote-color)',
            'font-style': 'var(--blockquote-font-style)',
            'background-color': 'var(--blockquote-background-color)',
            'border-inline-start': 'var(--blockquote-border-thickness) solid var(--blockquote-border-color)',
            'padding-top': '0',
            'padding-bottom': '0',
            'padding-inline-start': 'var(--size-4-6)',
            'margin-inline-start': '0',
            'margin-inline-end': '0',
        }
    },
    {
        tag: 'p',
        sem: 'p',
        class: '',
        children: [],
        styles: {
        }
    },
    {
        tag: 'strong',
        sem: 'strong',
        class: '',
        children: [],
        styles: {
        }
    },
    {
        tag: 'em',
        sem: 'em',
        class: '',
        children: [],
        styles: {
        }
    },
    {
        tag: 's',
        sem: 's',
        class: '',
        children: [],
        styles: {
        }
    },
    
]

function getAllCSSVariableNames(styleSheets = document.styleSheets){
    const cssVars = [];
    // loop each stylesheet
    for(let i = 0; i < styleSheets.length; i++){
       // loop stylesheet's cssRules
       try{ // try/catch used because 'hasOwnProperty' doesn't work
          for( let j = 0; j < styleSheets[i].cssRules.length; j++){
             try{
                // loop stylesheet's cssRules' style (property names)
                for(let k = 0; k < (styleSheets[i].cssRules[j] as CSSStyleRule).style.length; k++){
                   const name = (styleSheets[i].cssRules[j] as CSSStyleRule).style[k];
                   // test name for css variable signiture and uniqueness
                   if(name.startsWith('--') && cssVars.indexOf(name) == -1){
                      cssVars.push(name);
                   }
                }
             } catch (error) {}
          }
       } catch (error) {}
    }
    return cssVars;
 }
 
 function getElementCSSVariables (allCSSVars: string[], element = document.body){
    const elStyles = window.getComputedStyle(element);
    const cssVars : Record<string, any> = {};
    for(let i = 0; i < allCSSVars.length; i++){
       const key = allCSSVars[i];
       const value = elStyles.getPropertyValue(key)
       if(value){
        cssVars[key] = value;
    }
    }
    return cssVars;
 }
 

function isNumeric(str: any) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }

export const generateStyleAst = (): StyleAst => {
    const markdownRenderer = document.createElement('div')
    markdownRenderer.classList.add('markdown-rendered')
    const defaultEl = window.getComputedStyle(markdownRenderer);
        
    document.body.appendChild(markdownRenderer);
    const defaultStyle : Record<string, any> = Object.entries(defaultEl).reduce((acc, [key, value]) => {
        if (isNumeric(key) || value == '' || (!isString(value) && !isNumber(value)))
            return acc;
        return {
            ...acc,
            [key]: value
        }
    }, {})
    const walk = (item: StyleDefTree): StyleAst => {
        
        const _children = item.children.map(walk)
        if (item.state) {
            return {
                sem: item.sem,
                type: 'slide',
                selector: '',
                styles: item.styles,
                children: _children
            }
        }
            
            let style = {};
            
            if (item.compute) {
                const el = document.createElement(item.tag);
            markdownRenderer.appendChild(el);
            if (item.class?.length > 0) {
                el.classList.add(item.class)
            }
            const computed = window.getComputedStyle(el)
            style = Object.entries(computed).reduce((acc, [key, value]) => {
                
                
                if (isNumeric(key) || value == '' || (!isString(value) && !isNumber(value)))
                    return acc;
                if (defaultStyle[key] == value || item.styles[key] || key.startsWith('webkit'))
                    return acc;
                return {
                    ...acc,
                    [key]: value
                }
            }, {})
        }
            return {
                sem: item.sem,
                type: 'style',
                selector: '',
                styles: {...item.styles, ...style},
                children: _children
            }
        }

        const children = (sems.map(item => {
            return walk(item);
        }))
    

    
    const res: Record<string, string> = getElementCSSVariables(getAllCSSVariableNames())
    const baseStyle = {
        margin: '0',
        'background-color': 'var(--mk-ui-background)',
        'text-rendering': 'optimizeLegibility',
    'font-family': 'var(--font-interface)',
    'line-height': 'var(--line-height-tight)',
    'font-size': 'var(--font-ui-medium)',
    'color': 'var(--text-normal)',
    '-webkit-tap-highlight-color': 'rgba(255, 255, 255, 0)',
    'display': 'flex',
    'height': '100%',
    'overflow': 'hidden',
    }
    const root = {
        sem: 'root',
        variant: '',
        type: 'style',
        selector: '',
        styles: {...res, ...baseStyle},
        children: [{
            sem: 'div',
            variant: '',
            type: 'style',
            selector: 'main',
            styles: {
                'display': 'flex',
                'flex-direction': 'column',
                'overflow': 'auto',
                'position': 'relative',
                'flex': '1',
            },
            children: children
        }]
    }    
    document.body.removeChild(markdownRenderer);
    return root;
}