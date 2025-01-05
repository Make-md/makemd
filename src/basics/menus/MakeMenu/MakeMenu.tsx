import MakeBasicsPlugin from "basics/basics";
import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import { uiIconSet } from "shared/assets/icons";
import i18n from "shared/i18n";
import { Command, CommandType } from "../../types/command";

export default class MakeMenu extends EditorSuggest<Command> {
  inCmd = false;
  cmdStartCh = 0;
  plugin: MakeBasicsPlugin;
  file: TFile;

  constructor(app: App, plugin: MakeBasicsPlugin) {
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
    const triggerCharLength = this.plugin.settings.menuTriggerChar.length;
    this.file = _file;
    if (
      !this.inCmd &&
      currentLine.slice(0, triggerCharLength) !==
        this.plugin.settings.menuTriggerChar &&
      currentLine.slice(-2 - triggerCharLength) !==
        "- " + this.plugin.settings.menuTriggerChar
    ) {
      this.resetInfos();
      return null;
    }

    if (!this.inCmd) {
      this.cmdStartCh = currentLine.length - triggerCharLength;
      this.inCmd = true;
    }

    const currentCmd = currentLine.slice(this.cmdStartCh, cursor.ch);

    if (
      (currentCmd.length > 1 && currentCmd.includes(" ")) ||
      !currentCmd.includes(this.plugin.settings.menuTriggerChar)
    ) {
      this.resetInfos();
      return null;
    }
    return {
      start: cursor,
      end: cursor,
      query: currentCmd.slice(triggerCharLength),
    };
  }

  getSuggestions(
    context: EditorSuggestContext
  ): Command[] | Promise<Command[]> {
    const suggestions = this.plugin.commands.filter(
      ({ label }) =>
        label.toLowerCase().includes(context.query.toLowerCase()) ||
        //@ts-ignore
        (i18n.commands[label] &&
          //@ts-ignore
          i18n.commands[label]
            .toLowerCase()
            .includes(context.query.toLowerCase()))
    );

    return suggestions.length > 0
      ? suggestions
      : [
          {
            label: i18n.commandsSuggest.noResult,
            value: "",
            icon: "",
            type: CommandType.None,
          },
        ];
  }

  renderSuggestion(value: Command, el: HTMLElement): void {
    if (value.value == "") {
      el.setText(i18n.commandsSuggest.noResult);
      return;
    }
    const div = el.createDiv("mk-slash-item");
    const icon = div.createDiv("mk-slash-icon");
    icon.innerHTML = uiIconSet[value.icon];
    const title = div.createDiv();
    //@ts-ignore
    title.setText(i18n.commands[value.label] ?? value.label);
  }

  selectSuggestion(cmd: Command, _evt: MouseEvent | KeyboardEvent): void {
    const start = this.context.start;
    const end = this.context.end;
    const startCh = this.cmdStartCh;
    const editor = this.context.editor;
    if (cmd.label === i18n.commandsSuggest.noResult) return;
    if (cmd.onSelect) {
      cmd.onSelect(
        _evt,
        this.plugin,
        this.file,
        editor,
        start,
        startCh,
        end,
        () => {
          this.resetInfos();
          this.close();
        }
      );
    } else {
      this.context.editor.replaceRange(
        cmd.value,
        { ...this.context.start, ch: this.cmdStartCh },
        this.context.end
      );
      if (cmd.offset) {
        this.context.editor.setSelection(
          { ...this.context.start, ch: this.cmdStartCh + cmd.offset[1] },
          {
            ...this.context.end,
            ch: this.cmdStartCh + cmd.value.length + cmd.offset[0],
          }
        );
      }
      this.resetInfos();

      this.close();
    }
  }
}
