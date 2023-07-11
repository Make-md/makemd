import { default as i18n, default as t } from "i18n";
import { Modal } from "obsidian";
import { MDBColumn } from "types/mdb";

export class MergeColumnModal extends Modal {
  columns: MDBColumn[];
  mergeColumn: (fromField: MDBColumn, toField: MDBColumn) => void;

  constructor(
    columns: MDBColumn[],
    mergeColumn: (fromField: MDBColumn, toField: MDBColumn) => void
  ) {
    super(app);
    this.columns = columns;
    this.mergeColumn = mergeColumn;
  }

  onOpen() {
    let { contentEl } = this;
    let myModal = this;

    // Header
    let headerText = i18n.labels.mergeProperties;

    const headerEl = contentEl.createEl("div", { text: headerText });
    headerEl.addClass("modal-title");

    // Input El
    const containerEl = contentEl.createEl("div");
    containerEl.style.cssText =
      "width: 100%; height: 2.5em; margin-bottom: 15px;";
    const select = containerEl.createEl("select");

    for (var i = 0; i < this.columns.length; i++) {
      var opt = document.createElement("option");
      opt.value = i.toString();
      opt.innerHTML = this.columns[i].name + this.columns[i].table;
      select.appendChild(opt);
    }

    const select2 = containerEl.createEl("select");
    for (var i = 0; i < this.columns.length; i++) {
      var opt = document.createElement("option");
      opt.value = i.toString();
      opt.innerHTML = this.columns[i].name + this.columns[i].table;
      select2.appendChild(opt);
    }

    // Buttons
    let changeButtonText = i18n.buttons.merge;

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
      this.mergeColumn(
        this.columns[parseInt(select.value)],
        this.columns[parseInt(select2.value)]
      );
      myModal.close();
    };

    // Event Listener
    changeButton.addEventListener("click", onClickAction);
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
