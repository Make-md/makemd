import MakeBasicsPlugin from "basics/basics";
import { uiIconSet } from "core/assets/icons";
import {
  contextEmbedStringFromContext,
  contextViewEmbedStringFromContext,
} from "core/utils/contexts/embed";
import { createInlineTable } from "core/utils/contexts/inlineTable";
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
import { Command, CommandType, resolveCommands } from "./commands";

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
    const suggestions = resolveCommands().filter(
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
    if (cmd.value == "note") {
      this.plugin.selectLink(_evt as any, (link) => {
        editor.replaceRange(`![![${link}]]`, { ...start, ch: startCh }, end);
        this.resetInfos();

        this.close();
      });
    } else if (cmd.value == "context") {
      this.plugin.selectSpace(_evt as any, (link) => {
        editor.replaceRange(
          contextEmbedStringFromContext(
            this.plugin.superstate.spacesIndex.get(link),
            "files"
          ),
          { ...start, ch: startCh },
          end
        );
        editor.setSelection({
          line: start.line,
          ch: 0,
        });
        this.resetInfos();

        this.close();
      });
    } else if (cmd.value == "link") {
      this.plugin.selectLink(_evt as any, (link) => {
        editor.replaceRange(`[[${link}]]`, { ...start, ch: startCh }, end);
        this.resetInfos();

        this.close();
      });
    } else if (cmd.value == "image") {
      this.plugin.selectImage((image) => {
        editor.replaceRange(`![[${image}]]`, { ...start, ch: startCh }, end);
        this.resetInfos();

        this.close();
      }, editor.cm.dom.win);
    } else if (
      cmd.value == "table" ||
      cmd.value == "board" ||
      cmd.value == "calendar"
    ) {
      createInlineTable(
        this.plugin.superstate,
        this.file.parent.path,
        cmd.value
      ).then((f) => {
        editor.replaceRange(
          contextViewEmbedStringFromContext(
            this.plugin.superstate.spacesIndex.get(this.file.parent.path),
            f
          ),
          { ...start, ch: startCh },
          end
        );
        editor.setSelection({
          line: start.line,
          ch: 0,
        });
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
