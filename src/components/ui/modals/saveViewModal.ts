import { Modal } from "obsidian";
import t from "i18n";
import { MDBSchema } from "types/mdb";
import i18n from "i18n";

type ViewAction = "rename table" | "rename view" | "new view" | "new table";
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

    // Header
    let headerText;
    if (this.action == "new view")
      headerText = i18n.labels.saveView;
    if (this.action == "new table")
      headerText = i18n.labels.saveTable;
    if (this.action == "rename view")
      headerText = i18n.labels.renameView;
    if (this.action == "rename table")
      headerText = i18n.labels.renameTable;

    const headerEl = contentEl.createEl("div", { text: headerText });
    headerEl.addClass("modal-title");

    // Input El
    const inputEl = contentEl.createEl("input");

    inputEl.style.cssText = "width: 100%; height: 2.5em; margin-bottom: 15px;";
    inputEl.focus();

    // Buttons
    let changeButtonText;
    if (this.action == "new view")
      changeButtonText = i18n.buttons.saveView;
    if (this.action == "new table")
      changeButtonText = i18n.buttons.saveTable;
    if (this.action == "rename view")
      changeButtonText = i18n.buttons.renameView;
    if (this.action == "rename table")
      changeButtonText = i18n.buttons.renameTable;

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
      let newName = inputEl.value;
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
