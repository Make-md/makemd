import MakeMDPlugin from "main";
import { App, FuzzyMatch, FuzzySuggestModal, TFile } from "obsidian";
import { getAbstractFileAtPath, getAllAbstractFilesInVault } from "utils/file";
import { urlRegex } from "utils/regex";

export class imageModal extends FuzzySuggestModal<string> {
  selectImage: (image: string) => void;
  plugin: MakeMDPlugin;
  constructor(
    plugin: MakeMDPlugin,
    app: App,
    selectImage: (image: string) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.selectImage = selectImage;
    this.resultContainerEl.toggleClass("mk-image-modal", true);
    this.inputEl.focus();
    this.inputEl.placeholder = "Select an image or paste a URL";
    this.emptyStateText = "No Images Found";
    this.limit = 30;
  }

  renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement): void {
    var oImg = el.createEl("img");
    const file = getAbstractFileAtPath(app, item.item) as TFile;
    oImg.setAttribute(
      "src",
      file ? app.vault.getResourcePath(file) : item.item
    );
    oImg.setAttribute("height", "100px");
    oImg.setAttribute("width", "100px");
    el.appendChild(oImg);
  }

  getItemText(item: string): string {
    return item;
  }

  getSuggestions(query: string): FuzzyMatch<string>[] {
    let allImages: string[] = [];
    if (query.match(urlRegex)) allImages.push(query);
    allImages.push(
      ...getAllAbstractFilesInVault(this.plugin, app)
        .filter(
          (f) =>
            f instanceof TFile && ["png", "jpg", "jpeg"].contains(f.extension)
        )
        .map((f) => f.path)
    );
    return allImages
      .filter((f) => f.contains(query))
      .map((f, i) => ({
        item: f,
        match: {
          score: i,
          matches: [],
        },
      }));
  }

  getItems(): string[] {
    let allImages: string[] = [];
    allImages.push(
      ...getAllAbstractFilesInVault(this.plugin, app)
        .filter(
          (f) =>
            f instanceof TFile && ["png", "jpg", "jpeg"].contains(f.extension)
        )
        .map((f) => f.path)
    );
    return allImages;
  }

  onChooseItem(item: string, evt: MouseEvent | KeyboardEvent) {
    this.selectImage(item);
  }
}
