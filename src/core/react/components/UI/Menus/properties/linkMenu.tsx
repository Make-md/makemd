import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import { SelectMenuProps, SelectSection } from "shared/types/menu";
import { Rect } from "shared/types/Pos";

export const showLinkMenu = (
  offset: Rect,
  win: Window,
  superstate: Superstate,
  saveLink: (link: string | string[]) => void,
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
      multi: options?.multi,
      editable: true,
      value: options?.value ?? [],
      options: suggestions,
      saveOptions: (_: string[], value: string[]) => {
        options?.multi ? saveLink(value) : saveLink(value[0]);
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
