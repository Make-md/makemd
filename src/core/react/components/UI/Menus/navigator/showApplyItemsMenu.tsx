import { saveSpaceCache } from "core/superstate/utils/spaces";
import { SpaceState } from "core/types/superstate";
import { tagSpacePathFromTag } from "core/utils/strings";
import { i18n, Superstate } from "makemd-core";
import React from "react";
import { Rect } from "types/Pos";
import { ensureTag } from "utils/tags";
import StickerModal from "../../Modals/StickerModal";
import {
  defaultMenu,
  menuSeparator,
  SelectOption,
  SelectOptionType,
} from "../menu/SelectionMenu";

const saveContexts = (
  superstate: Superstate,
  spacePath: string,
  contexts: string[]
) => {
  const space = superstate.spacesIndex.get(spacePath);
  saveSpaceCache(superstate, space.space, {
    ...space.metadata,
    contexts,
  });
};

const newContext = (
  offset: Rect,
  superstate: Superstate,
  spacePath: string,
  win: Window,
  onHide: () => void
) => {
  const space = superstate.spacesIndex.get(spacePath);
  const f = superstate.spaceManager.readTags();
  const addTag = async (tag: string) => {
    const newTag = ensureTag(tag);
    saveContexts(superstate, space.path, [
      ...space.metadata.contexts.filter((f) => f != newTag),
      newTag,
    ]);
  };
  return superstate.ui.openMenu(
    offset,
    {
      ui: superstate.ui,
      multi: false,
      editable: true,
      value: [],
      options: f.map((m) => ({ name: m, value: m })),
      saveOptions: (_, value) => addTag(value[0]),
      placeholder: i18n.labels.contextItemSelectPlaceholder,
      searchable: true,
      showAll: true,
    },
    win,
    null,
    onHide
  );
};

const showContextEditMenu = (
  offset: Rect,
  path: string,
  superstate: Superstate,
  win: Window,
  onHide: () => void
) => {
  const options: SelectOption[] = [];
  options.push({
    name: i18n.buttons.addContext,
    icon: "ui//plus",
    type: SelectOptionType.Submenu,
    onSubmenu: (off, onHide) => {
      return newContext(off, superstate, path, win, onHide);
    },
  });
  options.push(menuSeparator);
  const space = superstate.spacesIndex.get(path);
  space.contexts.forEach((f) => {
    options.push({
      name: f,
      icon: "ui//tags",
      onClick: (e) => {
        superstate.ui.openPath(tagSpacePathFromTag(f));
      },
      onMoreOptions: (e) => {
        const offset = (e.target as HTMLElement).getBoundingClientRect();
        const options: SelectOption[] = [];
        options.push({
          name: i18n.menu.deleteContext,
          icon: "ui//trash",
          onClick: (e) => {
            saveContexts(
              superstate,
              space.path,
              space.contexts.filter((s) => s != f)
            );
          },
        });
        return superstate.ui.openMenu(
          offset,
          {
            ui: superstate.ui,
            multi: false,
            editable: false,
            value: [],
            options: options,
            placeholder: i18n.labels.contextItemSelectPlaceholder,
            searchable: false,
            showAll: true,
          },
          win
        );
      },
    });
  });
  return superstate.ui.openMenu(
    offset,
    {
      ui: superstate.ui,
      multi: false,
      editable: false,
      value: [],
      options: options,
      placeholder: i18n.labels.contextItemSelectPlaceholder,
      searchable: false,
      showAll: true,
    },
    win,
    null,
    onHide
  );
};

export const showApplyItemsMenu = (
  offset: Rect,
  superstate: Superstate,
  space: SpaceState,
  win: Window
) => {
  const options: SelectOption[] = [
    {
      name: "Apply Tags",
      icon: "ui//tags",
      value: "apply-tags",
      onSubmenu: (rect, onHide) =>
        showContextEditMenu(rect, space.path, superstate, win, onHide),
    },
    {
      name: "Set Default Sticker",
      icon: "ui//sticker",
      value: "apply-all-sticker",
      onClick: () => {
        superstate.ui.openPalette(
          <StickerModal
            ui={superstate.ui}
            selectedSticker={(emoji) =>
              saveSpaceCache(superstate, space.space, {
                ...space.metadata,
                defaultSticker: emoji,
              })
            }
          />,
          win
        );
      },
    },
  ];
  return superstate.ui.openMenu(
    offset,
    defaultMenu(superstate.ui, options),
    win
  );
};
