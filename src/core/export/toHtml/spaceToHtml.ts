import { RootContent } from "hast";
import { toHtml } from "hast-util-to-html";
import { encode } from "he";
import { Superstate } from "makemd-core";
import { generateNav } from "../nav/generateNav";
import { generateStyleAst } from "../styleAst/generateStyleAst";
import { styleAstToCSS } from "../styleAst/styleAstToCSS";
import { transformPath } from "../treeHelpers";
import { getStickerHast, treeToHast } from "../treeToAst/treeToHast";
import { markdownToHtml } from "./mdToHtml";

export type HTMLExportOptions = {
  header: boolean;
  nav: {
    enabled: boolean;
    root?: string;
  };
  head: {
    styles: {
      enabled?: boolean;
      themes?: boolean;
      payload?: string;
    }
  };
}


const generateHead =async  (superstate: Superstate, path: string, options: HTMLExportOptions) => {
  let html = '';
    if (options.head.styles.payload) {
      html += `<style>${options.head.styles.payload}</style>`;
    } else {
      const styleAst = await generateStyleAst();
      const css = styleAstToCSS(styleAst);
      html += `<style>${css}</style>`;
    }
    const title = superstate.pathsIndex.get(path)?.label.name;
    html += `<title>${title}</title>`;
    html += `<meta name="viewport" content="width=device-width, initial-scale=1.0">`;
    html += `<meta name="theme-color" content="var(--theme-color)">`;
    html += `<meta name="description" content="${title}">`;
    const sticker = superstate.pathsIndex.get(path)?.label.sticker;
    if (sticker) {
      html += `<link rel="icon" href="data:image/svg+xml,${encode(superstate.ui.getSticker(sticker, { fontless: true}))}" type="image/svg+xml">`;
    }
    return `<head>${html}</head>`;
}

const generateHeader = (superstate: Superstate, path: string, options: HTMLExportOptions) => {
  const { header } = options;
  let html = ''
  const pathState = superstate.pathsIndex.get(path);
  let topMargin = 'var(--file-margins)';
  if (header) {
    const cover = pathState?.metadata.property?.[superstate.settings.fmKeyBanner];
    if (cover) {
      const coverPath = transformPath(superstate, cover, path);
      topMargin = '180px';
      html += `<div style="background-image: url('${coverPath}'); background-size: cover; background-position: center; height: 200px; width: 100%; left: 0; top: 0; position: absolute;"></div>`;
    }
  }
  html += `<div style="margin: 0 auto; width: 100%; margin-top: ${topMargin}; max-width: var(--file-line-width);  display: flex; position: relative; flex-direction: column; padding: 0 var(--file-margins); margin-bottom: var(--file-margins);">`;
  if (header) {
    let headerHTML = ''
    if (pathState.metadata.label?.[superstate.settings.fmKeySticker]?.length) {
      const sticker = pathState.label.sticker;
      headerHTML += `<div style="width: 48px; height: 48px; flex: 0 0 auto">${toHtml(getStickerHast(superstate, sticker))}</div>`
    }
    const title = pathState.label.name;
  headerHTML += `<h1>${title}</h1>`;
  html += headerHTML;
  }
  return html;
}

export const noteToHtml = async (superstate: Superstate, path: string, options: HTMLExportOptions) => {
  let html = '';
  if (!superstate.pathsIndex.has(path)) return html;
  
  html += await generateHead(superstate, path, options);
  html += `<body>`
  if (options.nav.enabled) {
    html += generateNav(superstate, options.nav.root, path);
  }
  html += `<div class="main">`;
  html += generateHeader(superstate, path, options);
  const markdown = await superstate.spaceManager.readPath(path);
  html += await markdownToHtml(superstate, markdown, path)
  html += `</div></div></div></body>`;
  return html;
}

export const spaceToHtml = async (superstate: Superstate, path: string, options: HTMLExportOptions) => {
    let html = '';
    const space = superstate.spacesIndex.get(path);
    if (!space) return html;
    const linkedNote = space.space.notePath;
    const context = {
      $space: {
        note: linkedNote,
        space: path,
        path: path,
      },
      $context: {
        _keyValue: path,
        _schema: "main",
      },
    }
    html += await generateHead(superstate, path, options);
    html += `<body>`;
    if (options.nav.enabled) {
      html += generateNav(superstate, options.nav.root, path);
    }
    html += `<div class="main">`;
    html += generateHeader(superstate, path, options);
    html += await treeToHast(superstate, context, path, 'main').then(hast => {
      return toHtml({
      type: 'root',
      children: hast as RootContent[],
       })});
    html += `</div></div></div></body>`;
    return html;
}
