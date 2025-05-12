import { SelectOption, Superstate } from "makemd-core";
import i18n from "shared/i18n";
import { Rect } from "shared/types/Pos";

export const showSpacesMenu = (
  offset: Rect,
  win: Window,
  superstate: Superstate,
  saveLink: (link: string, isNew?: boolean, type?: string) => void,
  includeDefaults?: boolean,
  canAdd?: boolean,
  onlyTags?: boolean
) => {
  const options = [...superstate.allSpaces(true)]
    .filter(
      (f) =>
        (includeDefaults || f.type != "default") &&
        (!onlyTags || f.type == "tag")
    )
    .map<SelectOption>((f) => ({
      name: f.name,
      value: f.path,
      icon: superstate.pathsIndex.get(f.path)?.label?.sticker,
      section: f.type == "tag" ? "tag" : f.type == "folder" ? "folder" : "",
      description:
        f.type == "tag" ? f.name : f.type == "folder" ? f.path : f.path,
    }));

  return superstate.ui.openMenu(
    offset,
    {
      ui: superstate.ui,
      multi: false,
      editable: canAdd,
      addKeyword: "Create",
      value: [],
      options,
      sections: onlyTags
        ? []
        : [
            { name: i18n.buttons.tag, value: "tag" },
            { name: i18n.menu.folder, value: "folder" },
          ],
      saveOptions: (
        _: string[],
        value: string[],
        isNew?: boolean,
        section?: string
      ) => {
        saveLink(value[0], isNew, section);
      },
      placeholder: i18n.labels.spaceSelectPlaceholder,
      detail: true,
      searchable: true,
      showSections: !onlyTags,
      showAll: true,
    },
    win,
    "bottom"
  );
};
