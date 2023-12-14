import i18n from "core/i18n";
import { Superstate } from "core/superstate/superstate";

export const showLinkMenu = (
  e: React.MouseEvent,
  superstate: Superstate,
  saveLink: (link: string) => void,
  placeholder?: string
) => {
  const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
  const options = [...superstate.pathsIndex.values()]
    .filter((f) => !f.hidden)
    .map((f) => ({
      name: f.displayName,
      value: f.path,
      description: f.path,
      icon: f.label?.sticker,
    }));
  superstate.ui.openMenu(
    { x: offset.left, y: offset.top + 30 },
    {
      ui: superstate.ui,
      multi: false,
      editable: true,
      value: [],
      options,
      saveOptions: (_: string[], value: string[]) => {
        saveLink(value[0]);
      },
      placeholder: placeholder ?? i18n.labels.linkItemSelectPlaceholder,
      detail: true,
      searchable: true,
      showAll: true,
    }
  );
};
