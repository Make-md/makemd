import i18n from "core/i18n";
import { Superstate } from "core/superstate/superstate";
import { Rect } from "types/Pos";
import { SelectOption } from "../menu/SelectionMenu";

export const showSpacesMenu = (
  offset: Rect,
  win: Window,
  superstate: Superstate,
  saveLink: (link: string, isNew?: boolean) => void,
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

  superstate.ui.openMenu(
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
      saveOptions: (_: string[], value: string[]) => {
        saveLink(value[0], !options.some((f) => f.value == value[0]));
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
