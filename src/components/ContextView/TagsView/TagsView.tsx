import { showSelectMenu } from "components/ui/menus/menuItems";
import i18n from "i18n";
import MakeMDPlugin from "main";
import { Menu } from "obsidian";
import React from "react";
import { openTagContext } from "utils/file";
import { uiIconSet } from "utils/icons";
import { loadTags } from "utils/metadata/tags";
import { stringFromTag } from "utils/strings";
export const TagsView = (props: {
  plugin: MakeMDPlugin;
  tags: string[];
  addTag?: (tag: string) => void;
  removeTag?: (tag: string) => void;
  canOpen?: boolean;
}) => {
  const showTagMenu = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    e.preventDefault();
    const menu = new Menu();
    menu.addItem((menuItem) => {
      menuItem.setIcon("hash");
      menuItem.setTitle(i18n.menu.openTag);
      menuItem.onClick(() => {
        openTagContext(tag, props.plugin, e.metaKey);
      });
    });
    if (props.removeTag)
      menu.addItem((menuItem) => {
        menuItem.setIcon("trash");
        menuItem.setTitle(i18n.menu.removeTag);
        menuItem.onClick(() => {
          props.removeTag(tag);
        });
      });

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    menu.showAtPosition({ x: offset.left, y: offset.top + 30 });
  };

  const showContextMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const f = loadTags(props.plugin);
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        multi: false,
        editable: true,
        value: [],
        options: f.map((m) => ({ name: m, value: m })),
        saveOptions: (_, value) => props.addTag(value[0]),
        placeholder: i18n.labels.contextItemSelectPlaceholder,
        searchable: true,
        showAll: true,
      }
    );
  };

  return (
    <div className="mk-tag-selector">
      {props.tags.map((f, i) => (
        <div
          key={i}
          onContextMenu={(e) => showTagMenu(e, f)}
          onClick={(e) =>
            !props.canOpen
              ? showTagMenu(e, f)
              : openTagContext(f, props.plugin, e.metaKey)
          }
        >
          <span className="cm-hashtag cm-hashtag-begin">#</span>
          <span className="cm-hashtag cm-hashtag-end">{stringFromTag(f)}</span>
        </div>
      ))}
      {props.addTag && (
        <div
          aria-label={i18n.buttons.addTag}
          onClick={(e) => showContextMenu(e)}
        >
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-plus"] }}
          ></div>
        </div>
      )}
    </div>
  );
};
