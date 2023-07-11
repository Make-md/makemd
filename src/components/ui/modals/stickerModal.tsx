import { EmojiData } from "components/StickerMenu/emojis";
import { emojis } from "components/StickerMenu/emojis/default";
import t from "i18n";
import MakeMDPlugin from "main";
import { App, FuzzyMatch, FuzzySuggestModal, getIcon } from "obsidian";
import { lucideIcons } from "utils/icons";
import { emojiFromString } from "utils/strings";

type Sticker = {
  type: string;
  name: string;
  value: string;
  html: string;
  keywords: string;
};

const htmlFromSticker = (sticker: Sticker) => {
  if (sticker.type == "emoji") {
    return emojiFromString(sticker.html);
  }
  return sticker.html;
};

export class stickerModal extends FuzzySuggestModal<Sticker> {
  plugin: MakeMDPlugin;
  setIcon: (emoji: string) => void;
  constructor(
    app: App,
    plugin: MakeMDPlugin,
    setIcon: (emoji: string) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.setIcon = setIcon;
    this.resultContainerEl.toggleClass("mk-sticker-modal", true);
    this.inputEl.focus();
    this.emptyStateText = t.labels.findStickers;
    this.limit = 0;
  }

  renderSuggestion(item: FuzzyMatch<Sticker>, el: HTMLElement): void {
    el.innerHTML = htmlFromSticker(item.item);
    el.setAttr("aria-label", item.item.name);
  }

  getItemText(item: Sticker): string {
    return item.name;
  }

  getItems(): Sticker[] {
    const allLucide: Sticker[] = lucideIcons.map((f) => ({
      name: f,
      type: "lucide",
      keywords: f,
      value: f,
      html: getIcon(f).outerHTML,
    }));
    const allCustom: Sticker[] = [...this.plugin.index.iconsCache.keys()].map(
      (f) => ({
        name: f,
        type: "vault",
        keywords: f,
        value: f,
        html: this.plugin.index.iconsCache.get(f),
      })
    );
    const allEmojis: Sticker[] = Object.keys(emojis as EmojiData).reduce(
      (p, c: string) => [
        ...p,
        ...emojis[c].map((e) => ({
          type: "emoji",
          name: e.n[0],
          value: e.u,
          html: e.u,
        })),
      ],
      []
    );
    return [...allCustom, ...allEmojis, ...allLucide];
  }

  onChooseItem(item: Sticker, evt: MouseEvent | KeyboardEvent) {
    this.setIcon(item.type + "//" + item.value);
  }
}
