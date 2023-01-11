import MakeMDPlugin from "main";
import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import "css/MakeMenu.css";
import { resolveCommands, Command } from "./commands";
import t from "i18n";
import { makeIconSet, markIconSet } from "utils/icons";

export default class MakeMenu extends EditorSuggest<Command> {
  inCmd = false;
  cmdStartCh = 0;
  plugin: MakeMDPlugin;
  file: TFile;

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
      currentCmd.includes(" ") ||
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
    const suggestions = resolveCommands(this.plugin).filter(
      ({ label }) =>
        label.toLowerCase().includes(context.query.toLowerCase()) ||
        //@ts-ignore
        (t.commands[label] &&
          //@ts-ignore
          t.commands[label].toLowerCase().includes(context.query.toLowerCase()))
    );

    return suggestions.length > 0
      ? suggestions
      : [{ label: t.commandsSuggest.noResult, value: "", icon: "" }];
  }

  renderSuggestion(value: Command, el: HTMLElement): void {
    if (value.value == "") {
      el.setText(t.commandsSuggest.noResult);
      return;
    }
    const div = el.createDiv("mk-slash-item");
    const icon = div.createDiv("mk-slash-icon");
    icon.innerHTML = makeIconSet[value.icon];
    const title = div.createDiv();
    //@ts-ignore
    title.setText(t.commands[value.label]);
  }

  selectSuggestion(cmd: Command, _evt: MouseEvent | KeyboardEvent): void {
    if (cmd.label === t.commandsSuggest.noResult) return;

    if (cmd.value == "table") {
      this.plugin.createTable(this.file.parent.path).then((f) => {
        this.context.editor.replaceRange(
          `![![${this.file.parent.path}/#^${f}]]`,
          { ...this.context.start, ch: this.cmdStartCh },
          this.context.end
        );
        this.context.editor.setSelection({
          line: this.context.start.line,
          ch: 0,
        });
        this.resetInfos();
        this.close();
      });
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
