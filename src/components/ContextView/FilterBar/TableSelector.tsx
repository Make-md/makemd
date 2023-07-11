import { triggerFileMenu } from "components/ui/menus/fileMenu";
import { SaveViewModal } from "components/ui/modals/saveViewModal";
import { isMouseEvent } from "hooks/useLongPress";
import MakeMDPlugin from "main";
import { Menu } from "obsidian";
import React, { useContext } from "react";
import { defaultTableFields } from "schemas/mdb";
import { MDBSchema } from "types/mdb";
import { uniqueNameFromString } from "utils/array";
import { getAbstractFileAtPath } from "utils/file";
import { sanitizeTableName } from "utils/sanitize";
import { MDBContext } from "../MDBContext";
export const TableSelector = (props: {
  plugin: MakeMDPlugin;
  folderNoteName?: string;
  folderNotePath?: string;
  folderNoteOpen?: boolean;
  viewFolderNote?: (open: boolean) => void;
}) => {
  const { folderNoteOpen, viewFolderNote } = props;
  const {
    tables,
    setDBSchema,
    deleteSchema,
    saveSchema,
    saveDB,
    setSchema,
    dbSchema,
    contextInfo,
  } = useContext(MDBContext);

  const saveNewSchemas = (_schema: MDBSchema) => {
    const newSchema = {
      ..._schema,
      id: uniqueNameFromString(
        sanitizeTableName(_schema.id),
        tables.map((f) => f.id)
      ),
    };
    saveSchema(newSchema).then((f) =>
      saveDB({
        schema: newSchema,
        cols: defaultTableFields.map((f) => ({ ...f, schemaId: newSchema.id })),
        rows: [],
      })
    );
  };
  const newTable = (e: React.MouseEvent) => {
    let vaultChangeModal = new SaveViewModal(
      {
        id: "",
        name: "",
        type: "db",
      },
      saveNewSchemas,
      "new table"
    );
    vaultChangeModal.open();
  };

  const selectView = (_dbschema: MDBSchema, value?: string) => {
    viewFolderNote(false);
    setDBSchema(_dbschema);
    value && setSchema(tables.find((f) => f.id == value));
  };
  const openView = (e: React.MouseEvent, _dbschema: MDBSchema) => {
    const views = tables.filter((f) => f.type != "db" && f.def == _dbschema.id);
    if (views.length == 0) {
      selectView(_dbschema);
      return;
    }
    selectView(_dbschema, views[0].id);
    return;
  };

  const folderNoteOptions = (e: React.MouseEvent) => {
    triggerFileMenu(
      props.plugin,
      getAbstractFileAtPath(app, props.folderNotePath),
      false,
      e,
      "link-context-menu"
    );
  };

  const viewContextMenu = (e: React.MouseEvent, _schema: MDBSchema) => {
    const fileMenu = new Menu();

    fileMenu.addSeparator();

    fileMenu.addItem((menuItem) => {
      menuItem.setTitle("Rename Table");
      menuItem.onClick(() => {
        let vaultChangeModal = new SaveViewModal(
          _schema,
          (s) => saveSchema(s),
          "rename table"
        );
        vaultChangeModal.open();
      });
    });
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle("Delete Table");
      menuItem.onClick(() => {
        deleteSchema(_schema);
      });
    });

    // Trigger
    if (isMouseEvent(e)) {
      fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
    } else {
      fileMenu.showAtPosition({
        // @ts-ignore
        x: e.nativeEvent.locationX,
        // @ts-ignore
        y: e.nativeEvent.locationY,
      });
    }
  };
  return (
    <div className="mk-table-selector">
      {viewFolderNote && (
        <button
          className={`mk-folder-note ${folderNoteOpen ? "mk-is-active" : ""}`}
          onClick={() => viewFolderNote(true)}
          onContextMenu={(e) => folderNoteOptions(e)}
        >
          {props.folderNoteName}
        </button>
      )}
      {tables
        .filter((f) => f.type == "db")
        .map((f) => (
          <button
            className={`${
              !folderNoteOpen && dbSchema?.id == f.id ? "mk-is-active" : ""
            }`}
            onClick={(e) => openView(e, f)}
            onContextMenu={(e) => !f.primary && viewContextMenu(e, f)}
          >
            {f.name}
          </button>
        ))}
      {contextInfo.type == "folder" && (
        <button onClick={(e) => newTable(e)}>+</button>
      )}
    </div>
  );
};
