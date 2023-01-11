import { SelectOption } from "components/ui/menus/menuItems";
import "css/MakeMenu.css";
import MakeMDPlugin from "main";
import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile
} from "obsidian";
import { loadTags } from "utils/contexts/contexts";
import { getAllAbstractFilesInVault } from "utils/file";
import { fileNameToString } from "utils/tree";

export default class FlowSuggest extends EditorSuggest<SelectOption> {
  inCmd = false;
  cmdStartCh = 0;
  plugin: MakeMDPlugin;

  constructor(app: App, plugin: MakeMDPlugin) {
    super(app);
    this.plugin = plugin;
  }
  resetInfos() {
    this.cmdStartCh = 0;
    this.inCmd = false;
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    _file: TFile
  ): EditorSuggestTriggerInfo {
    const currentLine = editor.getLine(cursor.line).slice(0, cursor.ch);
    if (!this.inCmd && !(currentLine.slice(-4) == "![![")) {
      this.resetInfos();
      return null;
    }

    if (!this.inCmd) {
      this.cmdStartCh = currentLine.length - 4;
      this.inCmd = true;
    }

    const currentCmd = currentLine.slice(this.cmdStartCh, cursor.ch);
    if (currentCmd.includes(" ") || !currentCmd.includes("![![")) {
      this.resetInfos();
      return null;
    }
    // @ts-ignore
    return { start: cursor, end: cursor, query: currentCmd.slice(4) };
  }

  getSuggestions(
    context: EditorSuggestContext
  ): SelectOption[] | Promise<SelectOption[]> {
    const allTags: SelectOption[] = loadTags(this.plugin).map((f) => ({
      value: f,
      name: f,
    }));
    const allNotes: SelectOption[] = getAllAbstractFilesInVault(
      this.plugin,
      app
    ).map((f) => ({
      name: fileNameToString(f.name),
      description: f.path,
      value: f.path,
    }));
    const suggestions = [...allNotes, ...allTags].filter(
      ({ name, value }) =>
        name.toLowerCase().includes(context.query.toLowerCase()) ||
        (value && value.toLowerCase().includes(context.query.toLowerCase()))
    );
    return suggestions;
  }

  renderSuggestion(value: SelectOption, el: HTMLElement): void {
    const div = el.createDiv("mk-slash-item");
    const icon = div.createDiv("mk-slash-icon");
    icon.innerHTML = value.name;
    const title = div.createDiv();
    //@ts-ignore
    title.setText(value.value);
  }

  selectSuggestion(cmd: SelectOption, _evt: MouseEvent | KeyboardEvent): void {
    this.context.editor.replaceRange(
      cmd.value,
      { ...this.context.start, ch: this.cmdStartCh + 4 },
      this.context.end
    );

    this.resetInfos();

    this.close();
  }
}
