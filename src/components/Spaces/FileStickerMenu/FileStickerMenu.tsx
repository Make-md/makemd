import { EmojiData } from 'components/StickerMenu/emojis'
import { emojis } from 'components/StickerMenu/emojis/default'
import React, { useEffect, useRef, useState } from 'react'
import { unifiedToNative } from 'utils/utils';
import t from "i18n"
import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';


export class StickerModal extends FuzzySuggestModal<Emoji> {
    
    setIcon: (emoji: string) => void;
    constructor(app: App, setIcon: (emoji: string) => void) {
        super(app);
        this.setIcon = setIcon;
        this.resultContainerEl.toggleClass('mk-sticker-modal', true)
        this.inputEl.focus();
        this.emptyStateText = t.labels.findStickers
        this.limit = 0;
    }

    renderSuggestion(item: FuzzyMatch<Emoji>, el: HTMLElement): void {
        el.innerHTML = unifiedToNative(item.item.unicode);
        el.setAttr('aria-label', item.item.label)
    }

    getItemText(item: Emoji): string {
        return item.label+item.desc;
    }

    getItems(): Emoji[] {
        const allEmojis : Emoji[] = Object.keys(emojis as EmojiData).reduce((p,c: string) => [...p, ...emojis[c].map(e => ({ label: e.n[0], desc: e.n[1], variants: e.v, unicode: e.u}))], [])
        return allEmojis;
    }

    onChooseItem(item: Emoji, evt: MouseEvent | KeyboardEvent) {
        this.setIcon(item.unicode)
    }
}

interface Emoji {
    label: string,
    desc: string,
    variants: string[],
    unicode: string
}
