import { defaultSpaceSort, spaceSortFn } from "core/superstate/utils/spaces";
import { encode } from "he";
import { Superstate } from "makemd-core";
import { transformPath } from "../treeHelpers";

type NavItem = {
  href: string;
  path: string;
  depth: number;
  icon: string;
  name: string;
  folder: boolean;
  expanded: boolean;
  children: NavItem[];
};

export const generateNav = (
  superstate: Superstate,
  root: string,
  currentPath: string
) => {
  const isSpace = superstate.spacesIndex.has(currentPath);
  const retrieveSpace = (path: string, depth: number): NavItem => {
    const pathIndex = superstate.pathsIndex.get(path);
    const children: NavItem[] = [];
    const isFolder = superstate.spacesIndex.has(path);
    if (isFolder) {
      const spaceItems = superstate
        .getSpaceItems(path)
        .filter((f) => f.subtype != "html")
        .sort(spaceSortFn(defaultSpaceSort))
        .map((child) => {
          const childPath = child.path;
          const childDepth = depth + 1;
          return retrieveSpace(childPath, childDepth);
        });
      children.push(...spaceItems);
    }
    return {
      path: path,
      href: transformPath(
        superstate,
        path,
        isSpace ? currentPath : superstate.pathsIndex.get(currentPath)?.parent
      ),
      depth,
      icon: pathIndex.label.sticker,
      name: pathIndex.label.name,
      folder: isFolder,
      expanded: currentPath.startsWith(path) || depth == 0,
      children: children,
    };
  };
  const spaceRoot = retrieveSpace(root, 0);

  const collapseIcon = superstate.ui.getSticker("ui//collapse");
  const generateHTML = (navItem: NavItem): string => {
    const children = navItem.children
      .map((child) => generateHTML(child))
      .join("");
    const collapseItem = `<div class="nav-collapse ${
      navItem.expanded ? "expanded" : ""
    }" onclick="event.stopPropagation();document.querySelector('[data-path=${encode(
      `"${navItem.path}"`
    )}]').classList.toggle('expanded');">
      ${collapseIcon}
      </div>`;
    return `
      <div class="nav-item${navItem.expanded ? " expanded" : ""}${
      navItem.path == root ? " nav-root" : ""
    }" data-path="${encode(navItem.path)}">
      <div class="nav-contents ${
        currentPath == navItem.path ? "active" : ""
      }" onclick="event.stopPropagation();window.location.href='${encode(
      navItem.href
    )}';" data-path="${encode(navItem.path)}">
      ${
        navItem.children.length > 0 && navItem.depth > 0
          ? collapseItem
          : "<div class='nav-spacer'></div>"
      }
        <div class="nav-icon">${superstate.ui.getSticker(navItem.icon)}</div>
        <div class="nav-name">${navItem.name}</div>
        </div>
        ${children}
      </div>
    `;
  };
  const html = generateHTML(spaceRoot);
  return `<div class="nav">
  <style>
    .nav {
      display: flex;
      flex-direction: column;
      overflow: auto;
      position: relative;
      width: 300px;
      padding: 24px 8px;
    }
      .nav-item.nav-root {
      padding-left: 0;
      }
    .nav-root > .nav-contents > .nav-spacer {
      width: 0;
    }
    .nav-item {
      display: none;
      flex-direction: column;
      padding-left: 16px;
      gap: 2px;
    }
      .nav-contents.active {
        background: var(--mk-ui-background-selected);
      }
    .nav-item.expanded, .nav-item.expanded > .nav-item {
      display: flex;
    }
    .nav-contents {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .nav-collapse {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      cursor: pointer;
      color: var(--mk-ui-text-tertiary);
      transition: transform 0.2s ease;
      transform: rotate(0deg);
      transform-origin: center;
    }
      .nav-spacer {
        width: 14px;
        height: 14px;
        cursor: default;
}
      .nav-contents:hover  {
      background: var(--mk-ui-background-hover);
    }
    .nav-item.expanded > .nav-contents > .nav-collapse {
      transform: rotate(90deg);
    }
    .nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: var(--mk-ui-text-secondary);
    }
    .nav-name {
      flex: 1;
      font-size: 14px;
      color: var(--mk-ui-text-secondary);
      text-decoration: none;
      text-transform: none;
      text-align: left;
      line-height: 24px;
      transition: color 0.2s ease;
      border-radius: var(--file-border-radius);
      background: var(--file-background);
    }
      .main {
        display: flex;
        flex-direction: column;
        overflow: auto;
        position: relative;
        flex: 1;
      }
      </style>
  ${html}</div>`;
};
