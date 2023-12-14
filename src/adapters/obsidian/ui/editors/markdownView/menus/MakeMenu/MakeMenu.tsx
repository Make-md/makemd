import { stickerFromString } from "adapters/obsidian/ui/sticker";
import { contextEmbedStringFromContext } from "core/utils/contexts/embed";
import { createInlineTable } from "core/utils/contexts/inlineTable";
import MakeMDPlugin from "main";
import { i18n } from "makemd-core";
import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import { Command, resolveCommands } from "./commands";

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
    const triggerCharLength =
      this.plugin.superstate.settings.menuTriggerChar.length;
    this.file = _file;
    if (
      !this.inCmd &&
      currentLine.slice(0, triggerCharLength) !==
        this.plugin.superstate.settings.menuTriggerChar &&
      currentLine.slice(-2 - triggerCharLength) !==
        "- " + this.plugin.superstate.settings.menuTriggerChar
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
      !currentCmd.includes(this.plugin.superstate.settings.menuTriggerChar)
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
        (i18n.commands[label] &&
          //@ts-ignore
          i18n.commands[label]
            .toLowerCase()
            .includes(context.query.toLowerCase()))
    );

    return suggestions.length > 0
      ? suggestions
      : [{ label: i18n.commandsSuggest.noResult, value: "", icon: "" }];
  }

  renderSuggestion(value: Command, el: HTMLElement): void {
    if (value.value == "") {
      el.setText(i18n.commandsSuggest.noResult);
      return;
    }
    const div = el.createDiv("mk-slash-item");
    const icon = div.createDiv("mk-slash-icon");
    icon.innerHTML = stickerFromString(value.icon, this.plugin);
    const title = div.createDiv();
    //@ts-ignore
    title.setText(i18n.commands[value.label] ?? value.label);
  }

  selectSuggestion(cmd: Command, _evt: MouseEvent | KeyboardEvent): void {
    if (cmd.label === i18n.commandsSuggest.noResult) return;

    if (cmd.value == "table") {
      createInlineTable(this.plugin.superstate, this.file.parent.path).then(
        (f) => {
          this.context.editor.replaceRange(
            contextEmbedStringFromContext(
              this.plugin.superstate.spacesIndex.get(this.file.parent.path),
              f
            ),
            { ...this.context.start, ch: this.cmdStartCh },
            this.context.end
          );
          this.context.editor.setSelection({
            line: this.context.start.line,
            ch: 0,
          });
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
