import i18n from "core/i18n";
import { Superstate } from "core/superstate/superstate";
import { Rect } from "types/Pos";
import { SelectMenuProps, SelectSection } from "../menu/SelectionMenu";

export const showLinkMenu = (
  offset: Rect,
  win: Window,
  superstate: Superstate,
  saveLink: (link: string) => void,
  options?: Partial<SelectMenuProps>
) => {
  const suggestions = [...superstate.pathsIndex.values()]
    .filter((f) => !f.hidden)
    .map((f) => ({
      name: f.label.name,
      value: f.path,
      description: f.path,
      icon: f.label?.sticker,
      section: f.type,
    }));
  const sections: SelectSection[] = Array.from(
    new Set(suggestions.map((f) => f.section))
  ).map((f) => {
    return {
      name: f,
      value: f,
    };
  });
  return superstate.ui.openMenu(
    offset,
    {
      ui: superstate.ui,
      multi: false,
      editable: true,
      value: [],
      options: suggestions,
      saveOptions: (_: string[], value: string[]) => {
        saveLink(value[0]);
      },
      placeholder: i18n.labels.linkItemSelectPlaceholder,
      detail: true,
      searchable: true,
      showAll: true,
      sections: sections,
      showSections: true,
      ...(options ?? {}),
    },
    win
  );
};
