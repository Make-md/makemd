import i18n from "core/i18n";
import { Superstate } from "core/superstate/superstate";
import { SelectOption } from "../menu";

export const showSpacesMenu = (
  e: React.MouseEvent | MouseEvent | KeyboardEvent,
  superstate: Superstate,
  saveLink: (link: string, isNew?: boolean) => void,
  includeDefaults?: boolean,
  canAdd?: boolean
) => {
  const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
  const options = [...superstate.allSpaces(true)]
    .filter((f) => includeDefaults || f.type != "default")
    .map<SelectOption>((f) => ({
      name: f.name,
      value: f.path,
      icon: superstate.pathsIndex.get(f.path)?.label?.sticker,
      section: f.type == "tag" ? "Tag" : f.type == "folder" ? "Folder" : "",
      description:
        f.type == "tag" ? f.name : f.type == "folder" ? f.path : f.name,
    }));
  superstate.ui.openMenu(
    { x: offset.left, y: offset.top + 30 },
    {
      ui: superstate.ui,
      multi: false,
      editable: canAdd,
      value: [],
      options,
      sections: ["Tag", "Folder"],
      saveOptions: (_: string[], value: string[]) => {
        saveLink(value[0], !options.some((f) => f.value == value[0]));
      },
      placeholder: i18n.labels.spaceSelectPlaceholder,
      detail: true,
      searchable: true,
      showSections: true,
      showAll: true,
    }
  );
};
