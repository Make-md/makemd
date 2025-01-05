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
import React from "react";
import { emojis } from "shared/assets/emoji";
import i18n from "shared/i18n";
import { Emoji, EmojiData } from "shared/types/emojis";
import { emojiFromString } from "shared/utils/stickers";

export default class StickerMenu extends EditorSuggest<Emoji> {
  inCmd = false;
  cmdStartCh = 0;
  plugin: MakeBasicsPlugin;

  constructor(app: App, plugin: MakeBasicsPlugin) {
    super(app);
    this.plugin = plugin;
    this.emojis = Object.keys(emojis as EmojiData).reduce(
      (p, c) => [
        ...p,
        ...emojis[c].map((e) => ({
          label: e.n[0],
          desc: e.n[1],
          variants: e.v,
          unicode: e.u,
        })),
      ],
      []
    );
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

    if (
      !this.inCmd &&
      !(
        currentLine.slice(-2) == " " + this.plugin.settings.emojiTriggerChar ||
        currentLine[0] == this.plugin.settings.emojiTriggerChar
      )
    ) {
      this.resetInfos();
      return null;
    }

    if (!this.inCmd) {
      this.cmdStartCh = currentLine.length - 1;
      this.inCmd = true;
    }

    const currentCmd = currentLine.slice(this.cmdStartCh, cursor.ch);

    if (
      currentCmd.includes(" ") ||
      !currentCmd.includes(this.plugin.settings.emojiTriggerChar)
    ) {
      this.resetInfos();
      return null;
    }
    // @ts-ignore
    this.suggestEl.classList.toggle("mk-emoji-menu", true);
    return { start: cursor, end: cursor, query: currentCmd.slice(1) };
  }

  emojis: Emoji[];

  getSuggestions(context: EditorSuggestContext): Emoji[] | Promise<Emoji[]> {
    const suggestions = this.emojis.filter(
      ({ label, desc }) =>
        label.includes(context.query) || desc?.includes(context.query)
    );

    return suggestions.length > 0
      ? suggestions
      : [{ label: i18n.commandsSuggest.noResult, unicode: "", desc: "" }];
  }

  renderSuggestion(value: Emoji, el: HTMLElement): void {
    const div = document.createElement("div");
    div.setAttribute("aria-label", value.label);
    const reactElement = this.plugin.enactor.createRoot(div);
    reactElement.render(
      <>
        {value.unicode.length > 0
          ? emojiFromString(value.unicode)
          : i18n.commandsSuggest.noResult}
      </>
    );
    el.appendChild(div);
  }

  selectSuggestion(cmd: Emoji, _evt: MouseEvent | KeyboardEvent): void {
    if (cmd.label === i18n.commandsSuggest.noResult) return;

    this.context.editor.replaceRange(
      emojiFromString(cmd.unicode),
      { ...this.context.start, ch: this.cmdStartCh },
      this.context.end
    );

    this.resetInfos();

    this.close();
  }
}
