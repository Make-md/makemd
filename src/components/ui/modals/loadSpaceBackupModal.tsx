import MakeMDPlugin from "main";
import { FuzzySuggestModal } from "obsidian";

export class LoadSpaceBackupModal extends FuzzySuggestModal<string> {
  plugin: MakeMDPlugin;
  files: string[];

  constructor(plugin: MakeMDPlugin, files: string[]) {
    super(app);
    this.plugin = plugin;
    this.files = files;
  }

  getItemText(file: string): string {
    return file;
  }

  getItems(): string[] {
    return this.files;
  }

  onChooseItem(file: string, evt: MouseEvent | KeyboardEvent) {
    this.plugin.index.loadSpaceDBFromBackup(file);
  }
}
