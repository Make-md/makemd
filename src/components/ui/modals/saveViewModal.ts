import { Modal } from "obsidian";
import t from "i18n";
import { MDBSchema } from "types/mdb";
import i18n from "i18n";

type ViewAction = "rename table" | "rename view" | "new view" | "new table";

const buttonTexts: Record<ViewAction, string> = {
  "new table": i18n.buttons.saveTable,
  "new view": i18n.buttons.saveView,
  "rename view": i18n.buttons.renameView,
  "rename table": i18n.buttons.renameTable,
};

const headerTexts: Record<ViewAction, string> = {
  "new table": i18n.labels.saveTable,
  "new view": i18n.labels.saveView,
  "rename view": i18n.labels.renameView,
  "rename table": i18n.labels.renameTable,
};

export class SaveViewModal extends Modal {
  schema: MDBSchema;
  saveSchema: (schema: MDBSchema) => void;
  action: ViewAction;

  constructor(
    schema: MDBSchema,
    saveSchema: (schema: MDBSchema) => void,
    action: ViewAction
  ) {
    super(app);
    this.schema = schema;
    this.saveSchema = saveSchema;
    this.action = action;
  }

  onOpen() {
    let { contentEl } = this;
    let myModal = this;

    const headerText = headerTexts[this.action];
    const headerEl = contentEl.createEl("div", { text: headerText });
    headerEl.addClass("modal-title");

    const inputEl = contentEl.createEl("input", {
      value: this.schema.name,
    });
    inputEl.style.cssText = "width: 100%; height: 2.5em; margin-bottom: 15px;";
    inputEl.focus();

    const changeButtonText = buttonTexts[this.action];
    const changeButton = contentEl.createEl("button", {
      text: changeButtonText,
    });

    const cancelButton = contentEl.createEl("button", {
      text: t.buttons.cancel,
    });
    cancelButton.style.cssText = "float: right;";
    cancelButton.addEventListener("click", () => {
      myModal.close();
    });

    const onClickAction = async () => {
      const newName = inputEl.value;
      if (this.action == "new view" || this.action == "new table") {
        this.saveSchema({ ...this.schema, id: newName, name: newName });
      } else {
        this.saveSchema({ ...this.schema, name: newName });
      }
      myModal.close();
    };

    // Event Listener
    changeButton.addEventListener("click", onClickAction);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onClickAction();
      }
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
